// src/modules/hotels/hotels.controller.js
const dbService = require("../../core/dbService");
const pool = require("../../core/db");

const HOTELS_TABLE = "COE_TBL_HOTELS";

const HOTELS_VIEW = "COE_VIEW_HOTEL_PROFILE_LOOKUP";

const HOTEL_CONTRACTS_TABLE = "COE_TBL_HOTEL_CONTRACT";
const HOTEL_CONTRACT_RATES_TABLE = "COE_TBL_HOTEL_CONTRACT_RATES";
const LIST_ITEMS_TABLE = "COE_TBL_LIST_ITEMS";
const HOTEL_SEASONS_TABLE = "COE_TBL_HOTEL_SEASON";
const RATES_VIEW = "COE_VIEW_RATES_LOOKUP";

// Helper: get COMPANY_ID from backend (JWT or session)
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) {
    return req.user.COMPANY_ID;
  }
  if (req.session && req.session.COMPANY_ID) {
    return req.session.COMPANY_ID;
  }
  return null;
}

// --- Helper: is contract "active" now? ---
function isContractActiveRow(row) {
  const now = new Date();
  const start = row.HOTEL_CONTRACT_START_DATE
    ? new Date(row.HOTEL_CONTRACT_START_DATE)
    : null;
  const end = row.HOTEL_CONTRACT_END_DATE
    ? new Date(row.HOTEL_CONTRACT_END_DATE)
    : null;

  if (!start) return false;
  if (end && now > end) return false;
  if (now < start) return false;
  return true;
}

// --- Helper: check overlapping ranges (in JS) ---
function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA;
}

/**
 * GET /api/hotels
 * Optional query params:
 *   ?ACTIVE_STATUS=1
 *   ?HOTEL_AREA=...
 *   ?HOTEL_STARS=5
 *   ?HOTEL_CHAIN=...
 */
/**
 * GET /api/hotels
 * Optional query params:
 *   ?ACTIVE_STATUS=1
 *   ?HOTEL_STARS=5
 *   ?HOTEL_CHAIN=...
 *   ?HOTEL_LOCATION=...
 *   (HOTEL_AREA is mapped to HOTEL_LOCATION for backward compatibility)
 */
async function listHotels(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const {
      ACTIVE_STATUS,
      HOTEL_AREA, // old param
      HOTEL_LOCATION, // new param (matches view column)
      HOTEL_STARS,
      HOTEL_CHAIN,
    } = req.query;

    const where = {};

    if (ACTIVE_STATUS !== undefined) {
      where.ACTIVE_STATUS = Number(ACTIVE_STATUS);
    }
    if (HOTEL_STARS !== undefined) {
      where.HOTEL_STARS = Number(HOTEL_STARS);
    }
    if (HOTEL_CHAIN !== undefined) {
      where.HOTEL_CHAIN = HOTEL_CHAIN;
    }

    // The view exposes LI.ITEM_NAME AS HOTEL_LOCATION
    if (HOTEL_LOCATION !== undefined) {
      where.HOTEL_LOCATION = HOTEL_LOCATION;
    }
    // Backward-compat: if frontend still sends HOTEL_AREA, treat it as location text
    if (HOTEL_AREA !== undefined && HOTEL_LOCATION === undefined) {
      where.HOTEL_LOCATION = HOTEL_AREA;
    }

    // Use the VIEW here – no fields -> SELECT * (we want all joined data)
    const hotels = await dbService.find(
      {
        table: HOTELS_VIEW,
        where,
        orderBy: "HOTEL_NAME ASC",
      },
      companyId
    );

    return res.json(hotels);
  } catch (err) {
    console.error("listHotels error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/hotels/:HOTEL_ID
 */
/**
 * GET /api/hotels/:HOTEL_ID
 * Uses the VIEW to return full joined info
 */
async function getHotelById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    // IMPORTANT: the view must expose H.HOTEL_ID AS HOTEL_ID
    const hotels = await dbService.find(
      {
        table: HOTELS_VIEW,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (hotels.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    return res.json(hotels[0]);
  } catch (err) {
    console.error("getHotelById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/hotels
 *
 * BODY (example):
 * {
 *   "HOTEL_NAME": "My Hotel",
 *   "HOTEL_ADDRESS": "Main street",
 *   "HOTEL_AREA": "Cairo",
 *   "HOTEL_STARS": 5,
 *   "HOTEL_PHONE": "+20...",
 *   "HOTEL_CONTRACT": "CONTRACT-123",
 *   "HOTEL_RESERVATION_EMAIL": "res@hotel.com",
 *   "HOTEL_LAT": "30.123",
 *   "HOTEL_LAN": "31.456",
 *   "HOTEL_CHAIN": "Hilton",
 *   "HOTEL_LOGO": "https://.../logo.png", // or any string path
 *   "HOTEL_CONTACT_PERSON_NAME": "John Doe",
 *   "ACTIVE_STATUS": 1
 * }
 */
async function createHotel(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      HOTEL_NAME,
      HOTEL_ADDRESS,
      HOTEL_AREA,
      HOTEL_STARS,
      HOTEL_PHONE,
      HOTEL_RESERVATION_EMAIL,
      HOTEL_LAT,
      HOTEL_LAN,
      HOTEL_CHAIN,
      HOTEL_LOGO,
      ACTIVE_STATUS,
      HOTEL_CONTACT_PERSON_NAME,
    } = req.body;

    if (!HOTEL_NAME) {
      return res.status(400).json({ message: "HOTEL_NAME is required" });
    }

    const now = new Date(); // 👈 add this

    const result = await dbService.insert(
      HOTELS_TABLE,
      {
        HOTEL_NAME,
        HOTEL_ADDRESS: HOTEL_ADDRESS || null,
        HOTEL_AREA: HOTEL_AREA || null,
        HOTEL_STARS: HOTEL_STARS ?? null,
        HOTEL_PHONE: HOTEL_PHONE || null,
        HOTEL_RESERVATION_EMAIL: HOTEL_RESERVATION_EMAIL || null,
        HOTEL_LAT: HOTEL_LAT || null,
        HOTEL_LAN: HOTEL_LAN || null,
        HOTEL_CHAIN: HOTEL_CHAIN || null,
        HOTEL_LOGO: HOTEL_LOGO || null,
        HOTEL_CONTACT_PERSON_NAME: HOTEL_CONTACT_PERSON_NAME || null,
        ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
        CREATED_BY: userFromToken.USER_ID,
        CREATED_ON: now, // 👈 explicitly set CREATED_ON
      },
      companyId
    );

    return res.status(201).json({
      message: "Hotel created",
      HOTEL_ID: result.insertId,
    });
  } catch (err) {
    console.error("createHotel error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/hotels/:HOTEL_ID
 * BODY: any subset of the hotel fields (same as createHotel)
 */
async function updateHotel(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    const existing = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const {
      HOTEL_NAME,
      HOTEL_ADDRESS,
      HOTEL_AREA,
      HOTEL_STARS,
      HOTEL_PHONE,
      HOTEL_CONTRACT,
      HOTEL_RESERVATION_EMAIL,
      HOTEL_LAT,
      HOTEL_LAN,
      HOTEL_CHAIN,
      HOTEL_LOGO,
      ACTIVE_STATUS,
      HOTEL_CONTACT_PERSON_NAME,
    } = req.body;

    const updateData = {};
    if (HOTEL_NAME !== undefined) updateData.HOTEL_NAME = HOTEL_NAME;
    if (HOTEL_ADDRESS !== undefined) updateData.HOTEL_ADDRESS = HOTEL_ADDRESS;
    if (HOTEL_AREA !== undefined) updateData.HOTEL_AREA = HOTEL_AREA;
    if (HOTEL_STARS !== undefined) updateData.HOTEL_STARS = HOTEL_STARS;
    if (HOTEL_PHONE !== undefined) updateData.HOTEL_PHONE = HOTEL_PHONE;
    if (HOTEL_CONTRACT !== undefined)
      updateData.HOTEL_CONTRACT = HOTEL_CONTRACT;
    if (HOTEL_RESERVATION_EMAIL !== undefined)
      updateData.HOTEL_RESERVATION_EMAIL = HOTEL_RESERVATION_EMAIL;
    if (HOTEL_LAT !== undefined) updateData.HOTEL_LAT = HOTEL_LAT;
    if (HOTEL_LAN !== undefined) updateData.HOTEL_LAN = HOTEL_LAN;
    if (HOTEL_CHAIN !== undefined) updateData.HOTEL_CHAIN = HOTEL_CHAIN;
    if (HOTEL_LOGO !== undefined) updateData.HOTEL_LOGO = HOTEL_LOGO;
    if (ACTIVE_STATUS !== undefined) updateData.ACTIVE_STATUS = ACTIVE_STATUS;
    if (HOTEL_CONTACT_PERSON_NAME !== undefined)
      updateData.HOTEL_CONTACT_PERSON_NAME = HOTEL_CONTACT_PERSON_NAME;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(HOTELS_TABLE, updateData, { HOTEL_ID }, companyId);
    }

    const updated = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        fields: [
          "HOTEL_ID",
          "COMPANY_ID",
          "HOTEL_NAME",
          "HOTEL_ADDRESS",
          "HOTEL_AREA",
          "HOTEL_STARS",
          "HOTEL_PHONE",
          "HOTEL_CONTRACT",
          "HOTEL_RESERVATION_EMAIL",
          "HOTEL_LAT",
          "HOTEL_LAN",
          "HOTEL_CHAIN",
          "HOTEL_LOGO",
          "CREATED_ON",
          "CREATED_BY",
          "ACTIVE_STATUS",
          "HOTEL_CONTACT_PERSON_NAME",
        ],
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Hotel updated",
      HOTEL: updated[0],
    });
  } catch (err) {
    console.error("updateHotel error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/hotels/:HOTEL_ID
 * Soft delete: ACTIVE_STATUS = 0
 */
async function deleteHotel(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    const hotels = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (hotels.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    await dbService.update(
      HOTELS_TABLE,
      { ACTIVE_STATUS: 0 },
      { HOTEL_ID },
      companyId
    );

    return res.json({ message: "Hotel deleted (soft)" });
  } catch (err) {
    console.error("deleteHotel error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/hotels/:HOTEL_ID/contracts
async function listHotelContracts(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    // Ensure hotel exists (scoped by company)
    const hotels = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (hotels.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const rows = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_ID },
        fields: [
          "HOTEL_CONTRACT_ID",
          "HOTEL_ID",
          "HOTEL_CONTRACT_START_DATE",
          "HOTEL_CONTRACT_END_DATE",
          "HOTEL_CONTRACT_ATTACHMENT_ID",
          "COMPANY_ID",
          "CREATED_ON",
        ],
        orderBy: "HOTEL_CONTRACT_START_DATE DESC",
      },
      companyId
    );

    const withActiveFlag = rows.map((r) => ({
      ...r,
      IS_ACTIVE: isContractActiveRow(r) ? 1 : 0,
    }));

    return res.json(withActiveFlag);
  } catch (err) {
    console.error("listHotelContracts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/hotels/:HOTEL_ID/contracts
async function createHotelContract(req, res) {
  try {
    console.log("createHotelContract raw body =", req.body);
    console.log("type of body =", typeof req.body);
    console.log("body keys =", req.body && Object.keys(req.body));
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    const {
      HOTEL_CONTRACT_START_DATE,
      HOTEL_CONTRACT_END_DATE,
      HOTEL_CONTRACT_ATTACHMENT_ID,
    } = req.body;

    // if (!HOTEL_CONTRACT_START_DATE || !HOTEL_CONTRACT_END_DATE) {
    //   return res.status(400).json({
    //     message:
    //       "HOTEL_CONTRACT_START_DATE and HOTEL_CONTRACT_END_DATE are required",
    //   });
    // }

    const start = new Date(HOTEL_CONTRACT_START_DATE);
    const end = new Date(HOTEL_CONTRACT_END_DATE);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid contract start/end date format" });
    }

    if (start > end) {
      return res.status(400).json({
        message:
          "HOTEL_CONTRACT_START_DATE cannot be after HOTEL_CONTRACT_END_DATE",
      });
    }

    // Ensure hotel exists (scoped by company)
    const hotels = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (hotels.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Fetch existing contracts for overlap check
    const existingContracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_ID },
      },
      companyId
    );

    for (const c of existingContracts) {
      const cStart = new Date(c.HOTEL_CONTRACT_START_DATE);
      const cEnd = new Date(c.HOTEL_CONTRACT_END_DATE);
      if (rangesOverlap(start, end, cStart, cEnd)) {
        return res.status(409).json({
          message:
            "Contract dates overlap with an existing contract for this hotel",
          EXISTING_CONTRACT_ID: c.HOTEL_CONTRACT_ID,
        });
      }
    }

    const now = new Date();

    const result = await dbService.insert(
      HOTEL_CONTRACTS_TABLE,
      {
        HOTEL_ID,
        HOTEL_CONTRACT_START_DATE: start,
        HOTEL_CONTRACT_END_DATE: end,
        HOTEL_CONTRACT_ATTACHMENT_ID: HOTEL_CONTRACT_ATTACHMENT_ID || null,
        CREATED_ON: now,
      },
      companyId
    );

    return res.status(201).json({
      message: "Hotel contract created",
      HOTEL_CONTRACT_ID: result.insertId,
    });
  } catch (err) {
    console.error("createHotelContract error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/hotels/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID
async function getHotelContractById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });
    }

    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const contract = contracts[0];

    return res.json({
      ...contract,
      IS_ACTIVE: isContractActiveRow(contract) ? 1 : 0,
    });
  } catch (err) {
    console.error("getHotelContractById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// PUT /api/hotels/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID
async function updateHotelContract(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });
    }

    const {
      HOTEL_CONTRACT_START_DATE,
      HOTEL_CONTRACT_END_DATE,
      HOTEL_CONTRACT_ATTACHMENT_ID,
    } = req.body;

    const existingRows = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const existing = existingRows[0];

    // Determine new range (use existing values if not provided)
    const newStart =
      HOTEL_CONTRACT_START_DATE !== undefined
        ? new Date(HOTEL_CONTRACT_START_DATE)
        : new Date(existing.HOTEL_CONTRACT_START_DATE);

    const newEnd =
      HOTEL_CONTRACT_END_DATE !== undefined
        ? new Date(HOTEL_CONTRACT_END_DATE)
        : new Date(existing.HOTEL_CONTRACT_END_DATE);

    if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid contract start/end date format" });
    }

    if (newStart > newEnd) {
      return res.status(400).json({
        message:
          "HOTEL_CONTRACT_START_DATE cannot be after HOTEL_CONTRACT_END_DATE",
      });
    }

    // Overlap check with other contracts of same hotel
    const otherContracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_ID },
      },
      companyId
    );

    for (const c of otherContracts) {
      if (c.HOTEL_CONTRACT_ID === HOTEL_CONTRACT_ID) continue;

      const cStart = new Date(c.HOTEL_CONTRACT_START_DATE);
      const cEnd = new Date(c.HOTEL_CONTRACT_END_DATE);

      if (rangesOverlap(newStart, newEnd, cStart, cEnd)) {
        return res.status(409).json({
          message:
            "Updated contract dates overlap with another contract for this hotel",
          EXISTING_CONTRACT_ID: c.HOTEL_CONTRACT_ID,
        });
      }
    }

    const updateData = {};
    if (HOTEL_CONTRACT_START_DATE !== undefined) {
      updateData.HOTEL_CONTRACT_START_DATE = newStart;
    }
    if (HOTEL_CONTRACT_END_DATE !== undefined) {
      updateData.HOTEL_CONTRACT_END_DATE = newEnd;
    }
    if (HOTEL_CONTRACT_ATTACHMENT_ID !== undefined) {
      updateData.HOTEL_CONTRACT_ATTACHMENT_ID =
        HOTEL_CONTRACT_ATTACHMENT_ID || null;
    }

    if (Object.keys(updateData).length > 0) {
      await dbService.update(
        HOTEL_CONTRACTS_TABLE,
        updateData,
        { HOTEL_CONTRACT_ID, HOTEL_ID },
        companyId
      );
    }

    const updated = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    const contract = updated[0];

    return res.json({
      message: "Hotel contract updated",
      CONTRACT: {
        ...contract,
        IS_ACTIVE: isContractActiveRow(contract) ? 1 : 0,
      },
    });
  } catch (err) {
    console.error("updateHotelContract error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// DELETE /api/hotels/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID
async function deleteHotelContract(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });
    }

    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    await dbService.remove(
      HOTEL_CONTRACTS_TABLE,
      { HOTEL_CONTRACT_ID, HOTEL_ID },
      companyId
    );

    return res.json({ message: "Hotel contract deleted" });
  } catch (err) {
    console.error("deleteHotelContract error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ----------------------------------------------------
// HOTEL CONTRACT RATES CRUD
// ----------------------------------------------------

// GET /api/hotels/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates
async function listHotelContractRates(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });
    }

    // Ensure contract belongs to this hotel + company
    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const sql = `
      SELECT
        r.RATE_ID,
        r.HOTEL_CONTRACT_ID,
        r.RATE_FOR_ID,
        r.RATE_START_DATE,
        r.RATE_END_DATE,
        r.RATE_AMOUNT,
        r.COMPANY_ID,
        r.CREATED_ON,
        r.CREATED_BY,
        r.CHANGED_ON,
        r.CHANGED_BY,
        li.ITEM_NAME AS RATE_FOR_NAME
      FROM ${HOTEL_CONTRACT_RATES_TABLE} r
      LEFT JOIN ${LIST_ITEMS_TABLE} li
        ON li.LIST_ITEM_ID = r.RATE_FOR_ID
       AND li.COMPANY_ID = ?
      WHERE r.HOTEL_CONTRACT_ID = ?
        AND r.COMPANY_ID = ?
      ORDER BY r.RATE_START_DATE ASC, r.RATE_ID ASC
    `;

    const [rows] = await pool.query(sql, [
      companyId,
      HOTEL_CONTRACT_ID,
      companyId,
    ]);

    return res.json(rows);
  } catch (err) {
    console.error("listHotelContractRates error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/hotels/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates/:RATE_ID
async function getHotelContractRateById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);
    const RATE_ID = parseInt(req.params.RATE_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });
    }
    if (!RATE_ID || Number.isNaN(RATE_ID)) {
      return res.status(400).json({ message: "Invalid RATE_ID" });
    }

    // Ensure contract belongs to this hotel + company
    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const sql = `
      SELECT
        r.RATE_ID,
        r.HOTEL_CONTRACT_ID,
        r.RATE_FOR_ID,
        r.RATE_START_DATE,
        r.RATE_END_DATE,
        r.RATE_AMOUNT,
        r.COMPANY_ID,
        r.CREATED_ON,
        r.CREATED_BY,
        r.CHANGED_ON,
        r.CHANGED_BY,
        li.ITEM_NAME AS RATE_FOR_NAME
      FROM ${HOTEL_CONTRACT_RATES_TABLE} r
      LEFT JOIN ${LIST_ITEMS_TABLE} li
        ON li.LIST_ITEM_ID = r.RATE_FOR_ID
       AND li.COMPANY_ID = ?
      WHERE r.HOTEL_CONTRACT_ID = ?
        AND r.RATE_ID = ?
        AND r.COMPANY_ID = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [
      companyId,
      HOTEL_CONTRACT_ID,
      RATE_ID,
      companyId,
    ]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Rate not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getHotelContractRateById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/hotels/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates
async function createHotelContractRate(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });
    }

    // Ensure contract belongs to this hotel + company
    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const { RATE_FOR_ID, RATE_START_DATE, RATE_END_DATE, RATE_AMOUNT } =
      req.body;

    if (RATE_AMOUNT === undefined || RATE_AMOUNT === null) {
      return res.status(400).json({ message: "RATE_AMOUNT is required" });
    }

    const amountNumber = Number(RATE_AMOUNT);
    if (Number.isNaN(amountNumber)) {
      return res
        .status(400)
        .json({ message: "RATE_AMOUNT must be a valid number" });
    }

    // Optional RATE_FOR_ID -> LIST_ITEMS_TABLE.LIST_ITEM_ID
    let rateForId = null;
    if (
      RATE_FOR_ID !== undefined &&
      RATE_FOR_ID !== null &&
      RATE_FOR_ID !== ""
    ) {
      rateForId = parseInt(RATE_FOR_ID, 10);
      if (!rateForId || Number.isNaN(rateForId)) {
        return res.status(400).json({ message: "Invalid RATE_FOR_ID" });
      }

      const items = await dbService.find(
        {
          table: LIST_ITEMS_TABLE,
          where: { LIST_ITEM_ID: rateForId },
          limit: 1,
        },
        companyId
      );

      if (!items.length) {
        return res.status(400).json({
          message: "Invalid Room Type (list item not found for this company)",
        });
      }
    }

    let startDate = null;
    let endDate = null;

    if (
      RATE_START_DATE !== undefined &&
      RATE_START_DATE !== null &&
      RATE_START_DATE !== ""
    ) {
      startDate = new Date(RATE_START_DATE);
      if (Number.isNaN(startDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid RATE_START_DATE format" });
      }
    }

    if (
      RATE_END_DATE !== undefined &&
      RATE_END_DATE !== null &&
      RATE_END_DATE !== ""
    ) {
      endDate = new Date(RATE_END_DATE);
      if (Number.isNaN(endDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid RATE_END_DATE format" });
      }
    }

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        message: "RATE_START_DATE cannot be after RATE_END_DATE",
      });
    }

    const now = new Date();

    const result = await dbService.insert(
      HOTEL_CONTRACT_RATES_TABLE,
      {
        HOTEL_CONTRACT_ID,
        RATE_FOR_ID: rateForId,
        RATE_START_DATE: startDate,
        RATE_END_DATE: endDate,
        RATE_AMOUNT: amountNumber,
        CREATED_ON: now,
        CREATED_BY: userFromToken.USER_ID,
        CHANGED_ON: now,
        CHANGED_BY: userFromToken.USER_ID,
      },
      companyId
    );

    return res.status(201).json({
      message: "Hotel contract rate created",
      RATE_ID: result.insertId,
    });
  } catch (err) {
    console.error("createHotelContractRate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// PUT /api/hotels/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates/:RATE_ID
async function updateHotelContractRate(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);
    const RATE_ID = parseInt(req.params.RATE_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });
    }
    if (!RATE_ID || Number.isNaN(RATE_ID)) {
      return res.status(400).json({ message: "Invalid RATE_ID" });
    }

    // Ensure contract exists and belongs to this hotel + company
    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Ensure rate exists for this contract
    const existingRates = await dbService.find(
      {
        table: HOTEL_CONTRACT_RATES_TABLE,
        where: { RATE_ID, HOTEL_CONTRACT_ID },
        limit: 1,
      },
      companyId
    );

    if (!existingRates.length) {
      return res.status(404).json({ message: "Rate not found" });
    }

    const existing = existingRates[0];

    const { RATE_FOR_ID, RATE_START_DATE, RATE_END_DATE, RATE_AMOUNT } =
      req.body;

    const updateData = {};

    // RATE_AMOUNT
    if (RATE_AMOUNT !== undefined) {
      const amountNumber = Number(RATE_AMOUNT);
      if (Number.isNaN(amountNumber)) {
        return res
          .status(400)
          .json({ message: "RATE_AMOUNT must be a valid number" });
      }
      updateData.RATE_AMOUNT = amountNumber;
    }

    // RATE_FOR_ID (can be set to null)
    if (RATE_FOR_ID !== undefined) {
      if (RATE_FOR_ID === null || RATE_FOR_ID === "") {
        updateData.RATE_FOR_ID = null;
      } else {
        const rateForId = parseInt(RATE_FOR_ID, 10);
        if (!rateForId || Number.isNaN(rateForId)) {
          return res.status(400).json({ message: "Invalid RATE_FOR_ID" });
        }

        const items = await dbService.find(
          {
            table: LIST_ITEMS_TABLE,
            where: { LIST_ITEM_ID: rateForId },
            limit: 1,
          },
          companyId
        );

        if (!items.length) {
          return res.status(400).json({
            message: "Invalid Room Type (list item not found for this company)",
          });
        }

        updateData.RATE_FOR_ID = rateForId;
      }
    }

    // Dates: compute newStart/newEnd based on existing row + provided values
    let newStart = existing.RATE_START_DATE
      ? new Date(existing.RATE_START_DATE)
      : null;
    let newEnd = existing.RATE_END_DATE
      ? new Date(existing.RATE_END_DATE)
      : null;

    if (RATE_START_DATE !== undefined) {
      if (RATE_START_DATE === null || RATE_START_DATE === "") {
        newStart = null;
        updateData.RATE_START_DATE = null;
      } else {
        const parsedStart = new Date(RATE_START_DATE);
        if (Number.isNaN(parsedStart.getTime())) {
          return res
            .status(400)
            .json({ message: "Invalid RATE_START_DATE format" });
        }
        newStart = parsedStart;
        updateData.RATE_START_DATE = parsedStart;
      }
    }

    if (RATE_END_DATE !== undefined) {
      if (RATE_END_DATE === null || RATE_END_DATE === "") {
        newEnd = null;
        updateData.RATE_END_DATE = null;
      } else {
        const parsedEnd = new Date(RATE_END_DATE);
        if (Number.isNaN(parsedEnd.getTime())) {
          return res
            .status(400)
            .json({ message: "Invalid RATE_END_DATE format" });
        }
        newEnd = parsedEnd;
        updateData.RATE_END_DATE = parsedEnd;
      }
    }

    if (newStart && newEnd && newStart > newEnd) {
      return res.status(400).json({
        message: "RATE_START_DATE cannot be after RATE_END_DATE",
      });
    }

    const now = new Date();
    updateData.CHANGED_ON = now;
    updateData.CHANGED_BY = userFromToken.USER_ID;

    await dbService.update(
      HOTEL_CONTRACT_RATES_TABLE,
      updateData,
      { RATE_ID, HOTEL_CONTRACT_ID },
      companyId
    );

    // Return the updated row (with RATE_FOR_NAME)
    const sql = `
      SELECT
        r.RATE_ID,
        r.HOTEL_CONTRACT_ID,
        r.RATE_FOR_ID,
        r.RATE_START_DATE,
        r.RATE_END_DATE,
        r.RATE_AMOUNT,
        r.COMPANY_ID,
        r.CREATED_ON,
        r.CREATED_BY,
        r.CHANGED_ON,
        r.CHANGED_BY,
        li.ITEM_NAME AS RATE_FOR_NAME
      FROM ${HOTEL_CONTRACT_RATES_TABLE} r
      LEFT JOIN ${LIST_ITEMS_TABLE} li
        ON li.LIST_ITEM_ID = r.RATE_FOR_ID
       AND li.COMPANY_ID = ?
      WHERE r.HOTEL_CONTRACT_ID = ?
        AND r.RATE_ID = ?
        AND r.COMPANY_ID = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [
      companyId,
      HOTEL_CONTRACT_ID,
      RATE_ID,
      companyId,
    ]);

    return res.json({
      message: "Hotel contract rate updated",
      RATE: rows[0] || null,
    });
  } catch (err) {
    console.error("updateHotelContractRate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// DELETE /api/hotels/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates/:RATE_ID
async function deleteHotelContractRate(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);
    const RATE_ID = parseInt(req.params.RATE_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });
    }
    if (!RATE_ID || Number.isNaN(RATE_ID)) {
      return res.status(400).json({ message: "Invalid RATE_ID" });
    }

    // Ensure contract belongs to this hotel + company
    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Ensure rate exists
    const existingRates = await dbService.find(
      {
        table: HOTEL_CONTRACT_RATES_TABLE,
        where: { RATE_ID, HOTEL_CONTRACT_ID },
        limit: 1,
      },
      companyId
    );

    if (!existingRates.length) {
      return res.status(404).json({ message: "Rate not found" });
    }

    await dbService.remove(
      HOTEL_CONTRACT_RATES_TABLE,
      { RATE_ID, HOTEL_CONTRACT_ID },
      companyId
    );

    return res.json({ message: "Hotel contract rate deleted" });
  } catch (err) {
    console.error("deleteHotelContractRate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ----------------------------------------------------
// HOTEL SEASONS CRUD
// ----------------------------------------------------

// GET /api/hotels/:HOTEL_ID/seasons
async function listHotelSeasons(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    // Ensure hotel exists (scoped by company)
    const hotels = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (hotels.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const sql = `
  SELECT
    s.SEASON_ID,
    s.SEASON_NAME_ID,
    s.SEASON_HOTEL_ID,
    s.SEASON_START_DATE,
    s.SEASON_END_DATE,
    s.COMPANY_ID,
    s.CREATED_ON,
    s.CREATED_BY,
    s.UPDATED_ON,
    s.UPDATED_BY,
    li.ITEM_NAME AS SEASON_NAME
  FROM ${HOTEL_SEASONS_TABLE} s
  LEFT JOIN ${LIST_ITEMS_TABLE} li
    ON li.LIST_ITEM_ID = s.SEASON_NAME_ID
   AND li.COMPANY_ID = ?
  WHERE s.SEASON_HOTEL_ID = ?
    AND s.COMPANY_ID = ?
  ORDER BY s.SEASON_START_DATE ASC, s.SEASON_ID ASC
`;

    const [rows] = await pool.query(sql, [companyId, HOTEL_ID, companyId]);

    return res.json(rows);
  } catch (err) {
    console.error("listHotelSeasons error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/hotels/:HOTEL_ID/seasons/:SEASON_ID
async function getHotelSeasonById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    if (!SEASON_ID || Number.isNaN(SEASON_ID)) {
      return res.status(400).json({ message: "Invalid SEASON_ID" });
    }

    // Ensure hotel exists (scoped by company)
    const hotels = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (hotels.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const sql = `
  SELECT
    s.SEASON_ID,
    s.SEASON_NAME_ID,
    s.SEASON_HOTEL_ID,
    s.SEASON_START_DATE,
    s.SEASON_END_DATE,
    s.COMPANY_ID,
    s.CREATED_ON,
    s.CREATED_BY,
    s.UPDATED_ON,
    s.UPDATED_BY,
    li.ITEM_NAME AS SEASON_NAME
  FROM ${HOTEL_SEASONS_TABLE} s
  LEFT JOIN ${LIST_ITEMS_TABLE} li
    ON li.LIST_ITEM_ID = s.SEASON_NAME_ID
   AND li.COMPANY_ID = ?
  WHERE s.SEASON_HOTEL_ID = ?
    AND s.SEASON_ID = ?
    AND s.COMPANY_ID = ?
  LIMIT 1
`;

    const [rows] = await pool.query(sql, [
      companyId,
      HOTEL_ID,
      SEASON_ID,
      companyId,
    ]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Season not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getHotelSeasonById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/hotels/:HOTEL_ID/seasons
async function createHotelSeason(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    // Ensure hotel exists (scoped by company)
    const hotels = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (hotels.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const { SEASON_NAME_ID, SEASON_START_DATE, SEASON_END_DATE } = req.body;

    // SEASON_NAME_ID required & numeric
    if (SEASON_NAME_ID === undefined || SEASON_NAME_ID === null) {
      return res.status(400).json({ message: "SEASON_NAME_ID is required" });
    }

    const seasonNameId = parseInt(SEASON_NAME_ID, 10);
    if (!seasonNameId || Number.isNaN(seasonNameId)) {
      return res.status(400).json({ message: "Invalid SEASON_NAME_ID" });
    }

    // For seasons it usually makes sense to require both dates
    if (!SEASON_START_DATE || !SEASON_END_DATE) {
      return res.status(400).json({
        message: "SEASON_START_DATE and SEASON_END_DATE are required",
      });
    }

    const start = new Date(SEASON_START_DATE);
    const end = new Date(SEASON_END_DATE);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid SEASON_START_DATE or SEASON_END_DATE" });
    }

    if (start > end) {
      return res.status(400).json({
        message: "SEASON_START_DATE cannot be after SEASON_END_DATE",
      });
    }

    const now = new Date();

    const result = await dbService.insert(
      HOTEL_SEASONS_TABLE,
      {
        SEASON_NAME_ID: seasonNameId,
        SEASON_HOTEL_ID: HOTEL_ID,
        SEASON_START_DATE: start,
        SEASON_END_DATE: end,
        CREATED_ON: now,
        CREATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
        UPDATED_BY: userFromToken.USER_ID,
      },
      companyId
    );

    return res.status(201).json({
      message: "Hotel season created",
      SEASON_ID: result.insertId,
    });
  } catch (err) {
    console.error("createHotelSeason error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// PUT /api/hotels/:HOTEL_ID/seasons/:SEASON_ID
async function updateHotelSeason(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    if (!SEASON_ID || Number.isNaN(SEASON_ID)) {
      return res.status(400).json({ message: "Invalid SEASON_ID" });
    }

    // Ensure hotel exists (scoped by company)
    const hotels = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (hotels.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const existingRows = await dbService.find(
      {
        table: HOTEL_SEASONS_TABLE,
        where: { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Season not found" });
    }

    const existing = existingRows[0];

    const { SEASON_NAME_ID, SEASON_START_DATE, SEASON_END_DATE } = req.body;

    const updateData = {};

    // SEASON_NAME_ID (optional change)
    if (SEASON_NAME_ID !== undefined) {
      if (SEASON_NAME_ID === null || SEASON_NAME_ID === "") {
        return res
          .status(400)
          .json({ message: "SEASON_NAME_ID cannot be null/empty" });
      }

      const seasonNameId = parseInt(SEASON_NAME_ID, 10);
      if (!seasonNameId || Number.isNaN(seasonNameId)) {
        return res.status(400).json({ message: "Invalid SEASON_NAME_ID" });
      }

      updateData.SEASON_NAME_ID = seasonNameId;
    }

    // Dates – keep invariant SEASON_START_DATE <= SEASON_END_DATE
    let newStart = existing.SEASON_START_DATE
      ? new Date(existing.SEASON_START_DATE)
      : null;
    let newEnd = existing.SEASON_END_DATE
      ? new Date(existing.SEASON_END_DATE)
      : null;

    if (SEASON_START_DATE !== undefined) {
      if (SEASON_START_DATE === null || SEASON_START_DATE === "") {
        return res
          .status(400)
          .json({ message: "SEASON_START_DATE cannot be null/empty" });
      }
      const parsed = new Date(SEASON_START_DATE);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid SEASON_START_DATE" });
      }
      newStart = parsed;
      updateData.SEASON_START_DATE = parsed;
    }

    if (SEASON_END_DATE !== undefined) {
      if (SEASON_END_DATE === null || SEASON_END_DATE === "") {
        return res
          .status(400)
          .json({ message: "SEASON_END_DATE cannot be null/empty" });
      }
      const parsed = new Date(SEASON_END_DATE);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid SEASON_END_DATE" });
      }
      newEnd = parsed;
      updateData.SEASON_END_DATE = parsed;
    }

    if (newStart && newEnd && newStart > newEnd) {
      return res.status(400).json({
        message: "SEASON_START_DATE cannot be after SEASON_END_DATE",
      });
    }

    const now = new Date();
    updateData.UPDATED_ON = now;
    updateData.UPDATED_BY = userFromToken.USER_ID;

    await dbService.update(
      HOTEL_SEASONS_TABLE,
      updateData,
      { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
      companyId
    );

    const updatedRows = await dbService.find(
      {
        table: HOTEL_SEASONS_TABLE,
        where: { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Hotel season updated",
      SEASON: updatedRows[0] || null,
    });
  } catch (err) {
    console.error("updateHotelSeason error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// DELETE /api/hotels/:HOTEL_ID/seasons/:SEASON_ID
async function deleteHotelSeason(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    if (!SEASON_ID || Number.isNaN(SEASON_ID)) {
      return res.status(400).json({ message: "Invalid SEASON_ID" });
    }

    // Ensure hotel exists (scoped by company)
    const hotels = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (hotels.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const existingRows = await dbService.find(
      {
        table: HOTEL_SEASONS_TABLE,
        where: { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Season not found" });
    }

    await dbService.remove(
      HOTEL_SEASONS_TABLE,
      { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
      companyId
    );

    return res.json({ message: "Hotel season deleted" });
  } catch (err) {
    console.error("deleteHotelSeason error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ----------------------------------------------------
// GET seasons with their rates for a hotel
// GET /api/hotels/:HOTEL_ID/seasons-with-rates
// ----------------------------------------------------
async function getHotelSeasonsWithRates(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }

    // 1) Ensure hotel exists for this company
    const hotels = await dbService.find(
      {
        table: HOTELS_TABLE,
        where: { HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (!hotels.length) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // 2) Get ACTIVE CONTRACT for this hotel
    //    active = now between HOTEL_CONTRACT_START_DATE and HOTEL_CONTRACT_END_DATE
    const now = new Date();
    const contractSql = `
      SELECT
        HOTEL_CONTRACT_ID,
        HOTEL_ID,
        HOTEL_CONTRACT_START_DATE,
        HOTEL_CONTRACT_END_DATE,
        HOTEL_CONTRACT_ATTACHMENT_ID,
        COMPANY_ID,
        CREATED_ON
      FROM ${HOTEL_CONTRACTS_TABLE}
      WHERE HOTEL_ID = ?
        AND COMPANY_ID = ?
        AND ? BETWEEN HOTEL_CONTRACT_START_DATE AND HOTEL_CONTRACT_END_DATE
      ORDER BY HOTEL_CONTRACT_START_DATE DESC, HOTEL_CONTRACT_ID DESC
      LIMIT 1
    `;

    const [contractRows] = await pool.query(contractSql, [
      HOTEL_ID,
      companyId,
      now,
    ]);

    const activeContract = contractRows && contractRows.length
      ? contractRows[0]
      : null;

    // 3) Get seasons for this hotel (with SEASON_NAME from list items)
    const seasonsSql = `
      SELECT
        s.SEASON_ID,
        s.SEASON_NAME_ID,
        s.SEASON_HOTEL_ID,
        s.SEASON_START_DATE,
        s.SEASON_END_DATE,
        s.COMPANY_ID,
        s.CREATED_ON,
        s.CREATED_BY,
        s.UPDATED_ON,
        s.UPDATED_BY,
        li.ITEM_NAME AS SEASON_NAME
      FROM ${HOTEL_SEASONS_TABLE} s
      LEFT JOIN ${LIST_ITEMS_TABLE} li
        ON li.LIST_ITEM_ID = s.SEASON_NAME_ID
       AND li.COMPANY_ID = ?
      WHERE s.SEASON_HOTEL_ID = ?
        AND s.COMPANY_ID = ?
      ORDER BY s.SEASON_START_DATE ASC, s.SEASON_ID ASC
    `;

    const [seasonRows] = await pool.query(seasonsSql, [
      companyId,
      HOTEL_ID,
      companyId,
    ]);

    // If no active contract, just return seasons with empty RATES arrays
    if (!activeContract) {
      const seasonsWithEmptyRates = seasonRows.map((season) => ({
        ...season,
        RATES: [],
      }));

      return res.json({
        HOTEL_ID,
        ACTIVE_CONTRACT: null,
        SEASONS: seasonsWithEmptyRates,
      });
    }

    // 4) Get all rates for the active contract from the view
    const ratesSql = `
      SELECT
        RATE_ID,
        ITEM_NAME,
        HOTEL_CONTRACT_ID,
        RATE_FOR_ID,
        RATE_START_DATE,
        RATE_END_DATE,
        RATE_AMOUNT,
        COMPANY_ID,
        CREATED_ON,
        CREATED_BY,
        CHANGED_ON,
        CHANGED_BY
      FROM ${RATES_VIEW}
      WHERE HOTEL_CONTRACT_ID = ?
        AND COMPANY_ID = ?
      ORDER BY RATE_START_DATE ASC, RATE_ID ASC
    `;

    const [rateRows] = await pool.query(ratesSql, [
      activeContract.HOTEL_CONTRACT_ID,
      companyId,
    ]);

    // 5) Attach rates to seasons:
    //    For each season, include only rates whose (start & end) are inside the season range
    const seasonsWithRates = seasonRows.map((season) => {
      const sStart = season.SEASON_START_DATE
        ? new Date(season.SEASON_START_DATE)
        : null;
      const sEnd = season.SEASON_END_DATE
        ? new Date(season.SEASON_END_DATE)
        : null;

      const seasonRates =
        sStart && sEnd
          ? rateRows.filter((rate) => {
              if (!rate.RATE_START_DATE || !rate.RATE_END_DATE) {
                return false;
              }
              const rStart = new Date(rate.RATE_START_DATE);
              const rEnd = new Date(rate.RATE_END_DATE);

              // Only rates fully inside the season range
              return rStart >= sStart && rEnd <= sEnd;
            })
          : [];

      return {
        ...season,
        RATES: seasonRates,
      };
    });

    // 6) Final response
    return res.json({
      HOTEL_ID,
      ACTIVE_CONTRACT: activeContract,
      SEASONS: seasonsWithRates,
    });
  } catch (err) {
    console.error("getHotelSeasonsWithRates error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


module.exports = {
  listHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  listHotelContracts,
  getHotelContractById,
  createHotelContract,
  updateHotelContract,
  deleteHotelContract,
  listHotelContractRates,
  getHotelContractRateById,
  createHotelContractRate,
  updateHotelContractRate,
  deleteHotelContractRate,
  listHotelSeasons,
  getHotelSeasonById,
  createHotelSeason,
  updateHotelSeason,
  deleteHotelSeason,
   getHotelSeasonsWithRates,
};
