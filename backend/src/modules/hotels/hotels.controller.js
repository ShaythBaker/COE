// src/modules/hotels/hotels.controller.js
const dbService = require("../../core/dbService");
const pool = require("../../core/db");

const HOTELS_TABLE = "COE_TBL_HOTELS";
const HOTELS_VIEW = "COE_VIEW_HOTEL_PROFILE_LOOKUP";

const HOTEL_CONTRACTS_TABLE = "COE_TBL_HOTEL_CONTRACT";
const HOTEL_CONTRACT_RATES_TABLE = "COE_TBL_HOTEL_CONTRACT_RATES"; // (kept for backward compatibility)
const LIST_ITEMS_TABLE = "COE_TBL_LIST_ITEMS";
const HOTEL_SEASONS_TABLE = "COE_TBL_HOTEL_SEASON";

const HOTEL_SEASON_RATES_TABLE = "COE_TBL_HOTEL_SEASON_RATES";

const HOTEL_ADDITIONAL_SERVICES_TABLE = "COE_TBL_HOTEL_ADDITIONAL_SERVICES";

// Helper: get COMPANY_ID from backend (JWT or session)
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) return req.user.COMPANY_ID;
  if (req.session && req.session.COMPANY_ID) return req.session.COMPANY_ID;
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

// --- Helper: end of day for inclusive comparisons ---
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// --- Helper: season is expired if now > endOfDay(SEASON_END_DATE) ---
function isSeasonExpiredRow(seasonRow) {
  if (!seasonRow || !seasonRow.SEASON_END_DATE) return false;
  return new Date() > endOfDay(seasonRow.SEASON_END_DATE);
}

/**
 * GET /api/hotels
 */
async function listHotels(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const {
      ACTIVE_STATUS,
      HOTEL_AREA, // old param
      HOTEL_LOCATION, // new param (matches view column)
      HOTEL_STARS,
      HOTEL_CHAIN,
    } = req.query;

    const where = {};

    if (ACTIVE_STATUS !== undefined)
      where.ACTIVE_STATUS = Number(ACTIVE_STATUS);
    if (HOTEL_STARS !== undefined) where.HOTEL_STARS = Number(HOTEL_STARS);
    if (HOTEL_CHAIN !== undefined) where.HOTEL_CHAIN = HOTEL_CHAIN;

    if (HOTEL_LOCATION !== undefined) where.HOTEL_LOCATION = HOTEL_LOCATION;
    if (HOTEL_AREA !== undefined && HOTEL_LOCATION === undefined)
      where.HOTEL_LOCATION = HOTEL_AREA;

    const hotels = await dbService.find(
      { table: HOTELS_VIEW, where, orderBy: "HOTEL_NAME ASC" },
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
async function getHotelById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });

    const hotels = await dbService.find(
      { table: HOTELS_VIEW, where: { HOTEL_ID }, limit: 1 },
      companyId
    );

    if (hotels.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

    return res.json(hotels[0]);
  } catch (err) {
    console.error("getHotelById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/hotels
 */
async function createHotel(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID)
      return res.status(401).json({ message: "Unauthorized" });

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

    if (!HOTEL_NAME)
      return res.status(400).json({ message: "HOTEL_NAME is required" });

    const now = new Date();

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
        CREATED_ON: now,
      },
      companyId
    );

    return res
      .status(201)
      .json({ message: "Hotel created", HOTEL_ID: result.insertId });
  } catch (err) {
    console.error("createHotel error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/hotels/:HOTEL_ID
 */
async function updateHotel(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });

    const existing = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (existing.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

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

    return res.json({ message: "Hotel updated", HOTEL: updated[0] });
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
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });

    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (hotels.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

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

// ----------------------------------------------------
// HOTEL CONTRACTS CRUD (kept as-is)
// ----------------------------------------------------

async function listHotelContracts(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });

    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (hotels.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

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

async function createHotelContract(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });

    const {
      HOTEL_CONTRACT_START_DATE,
      HOTEL_CONTRACT_END_DATE,
      HOTEL_CONTRACT_ATTACHMENT_ID,
    } = req.body;

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

    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (hotels.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

    const existingContracts = await dbService.find(
      { table: HOTEL_CONTRACTS_TABLE, where: { HOTEL_ID } },
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

async function getHotelContractById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID))
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });

    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );

    if (contracts.length === 0)
      return res.status(404).json({ message: "Contract not found" });

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

async function updateHotelContract(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID))
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });

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
    if (existingRows.length === 0)
      return res.status(404).json({ message: "Contract not found" });

    const existing = existingRows[0];

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

    const otherContracts = await dbService.find(
      { table: HOTEL_CONTRACTS_TABLE, where: { HOTEL_ID } },
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
    if (HOTEL_CONTRACT_START_DATE !== undefined)
      updateData.HOTEL_CONTRACT_START_DATE = newStart;
    if (HOTEL_CONTRACT_END_DATE !== undefined)
      updateData.HOTEL_CONTRACT_END_DATE = newEnd;
    if (HOTEL_CONTRACT_ATTACHMENT_ID !== undefined)
      updateData.HOTEL_CONTRACT_ATTACHMENT_ID =
        HOTEL_CONTRACT_ATTACHMENT_ID || null;

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

async function deleteHotelContract(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID))
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });

    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );
    if (contracts.length === 0)
      return res.status(404).json({ message: "Contract not found" });

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
// HOTEL CONTRACT RATES CRUD (kept for backward compatibility)
// ----------------------------------------------------
// NOTE: You can remove these later once frontend fully stops using them.

async function listHotelContractRates(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID))
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });

    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );
    if (contracts.length === 0)
      return res.status(404).json({ message: "Contract not found" });

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

async function getHotelContractRateById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const HOTEL_CONTRACT_ID = parseInt(req.params.HOTEL_CONTRACT_ID, 10);
    const RATE_ID = parseInt(req.params.RATE_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!HOTEL_CONTRACT_ID || Number.isNaN(HOTEL_CONTRACT_ID))
      return res.status(400).json({ message: "Invalid HOTEL_CONTRACT_ID" });
    if (!RATE_ID || Number.isNaN(RATE_ID))
      return res.status(400).json({ message: "Invalid RATE_ID" });

    const contracts = await dbService.find(
      {
        table: HOTEL_CONTRACTS_TABLE,
        where: { HOTEL_CONTRACT_ID, HOTEL_ID },
        limit: 1,
      },
      companyId
    );
    if (contracts.length === 0)
      return res.status(404).json({ message: "Contract not found" });

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
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "Rate not found" });

    return res.json(rows[0]);
  } catch (err) {
    console.error("getHotelContractRateById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createHotelContractRate(req, res) {
  // kept unchanged (optional)
  return res.status(410).json({
    message:
      "Contract rates are deprecated. Use season rates endpoints instead.",
  });
}

async function updateHotelContractRate(req, res) {
  // kept unchanged (optional)
  return res.status(410).json({
    message:
      "Contract rates are deprecated. Use season rates endpoints instead.",
  });
}

async function deleteHotelContractRate(req, res) {
  // kept unchanged (optional)
  return res.status(410).json({
    message:
      "Contract rates are deprecated. Use season rates endpoints instead.",
  });
}

// ----------------------------------------------------
// HOTEL SEASONS CRUD
// ----------------------------------------------------

async function listHotelSeasons(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });

    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (hotels.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

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

async function getHotelSeasonById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!SEASON_ID || Number.isNaN(SEASON_ID))
      return res.status(400).json({ message: "Invalid SEASON_ID" });

    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (hotels.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

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
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "Season not found" });

    return res.json(rows[0]);
  } catch (err) {
    console.error("getHotelSeasonById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function createHotelSeason(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID)
      return res.status(401).json({ message: "Unauthorized" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });

    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (hotels.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

    const { SEASON_NAME_ID, SEASON_START_DATE, SEASON_END_DATE } = req.body;

    if (SEASON_NAME_ID === undefined || SEASON_NAME_ID === null) {
      return res.status(400).json({ message: "SEASON_NAME_ID is required" });
    }

    const seasonNameId = parseInt(SEASON_NAME_ID, 10);
    if (!seasonNameId || Number.isNaN(seasonNameId))
      return res.status(400).json({ message: "Invalid SEASON_NAME_ID" });

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
      return res
        .status(400)
        .json({ message: "SEASON_START_DATE cannot be after SEASON_END_DATE" });
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

    return res
      .status(201)
      .json({ message: "Hotel season created", SEASON_ID: result.insertId });
  } catch (err) {
    console.error("createHotelSeason error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateHotelSeason(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID)
      return res.status(401).json({ message: "Unauthorized" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!SEASON_ID || Number.isNaN(SEASON_ID))
      return res.status(400).json({ message: "Invalid SEASON_ID" });

    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (hotels.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

    const existingRows = await dbService.find(
      {
        table: HOTEL_SEASONS_TABLE,
        where: { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
        limit: 1,
      },
      companyId
    );
    if (existingRows.length === 0)
      return res.status(404).json({ message: "Season not found" });

    const existing = existingRows[0];

    const { SEASON_NAME_ID, SEASON_START_DATE, SEASON_END_DATE } = req.body;

    const updateData = {};

    if (SEASON_NAME_ID !== undefined) {
      if (SEASON_NAME_ID === null || SEASON_NAME_ID === "") {
        return res
          .status(400)
          .json({ message: "SEASON_NAME_ID cannot be null/empty" });
      }
      const seasonNameId = parseInt(SEASON_NAME_ID, 10);
      if (!seasonNameId || Number.isNaN(seasonNameId))
        return res.status(400).json({ message: "Invalid SEASON_NAME_ID" });
      updateData.SEASON_NAME_ID = seasonNameId;
    }

    let newStart = existing.SEASON_START_DATE
      ? new Date(existing.SEASON_START_DATE)
      : null;
    let newEnd = existing.SEASON_END_DATE
      ? new Date(existing.SEASON_END_DATE)
      : null;

    if (SEASON_START_DATE !== undefined) {
      if (SEASON_START_DATE === null || SEASON_START_DATE === "")
        return res
          .status(400)
          .json({ message: "SEASON_START_DATE cannot be null/empty" });
      const parsed = new Date(SEASON_START_DATE);
      if (Number.isNaN(parsed.getTime()))
        return res.status(400).json({ message: "Invalid SEASON_START_DATE" });
      newStart = parsed;
      updateData.SEASON_START_DATE = parsed;
    }

    if (SEASON_END_DATE !== undefined) {
      if (SEASON_END_DATE === null || SEASON_END_DATE === "")
        return res
          .status(400)
          .json({ message: "SEASON_END_DATE cannot be null/empty" });
      const parsed = new Date(SEASON_END_DATE);
      if (Number.isNaN(parsed.getTime()))
        return res.status(400).json({ message: "Invalid SEASON_END_DATE" });
      newEnd = parsed;
      updateData.SEASON_END_DATE = parsed;
    }

    if (newStart && newEnd && newStart > newEnd) {
      return res
        .status(400)
        .json({ message: "SEASON_START_DATE cannot be after SEASON_END_DATE" });
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

async function deleteHotelSeason(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!SEASON_ID || Number.isNaN(SEASON_ID))
      return res.status(400).json({ message: "Invalid SEASON_ID" });

    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (hotels.length === 0)
      return res.status(404).json({ message: "Hotel not found" });

    const existingRows = await dbService.find(
      {
        table: HOTEL_SEASONS_TABLE,
        where: { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
        limit: 1,
      },
      companyId
    );
    if (existingRows.length === 0)
      return res.status(404).json({ message: "Season not found" });

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
// NEW: HOTEL SEASON RATES CRUD
// ----------------------------------------------------

// GET /api/hotels/:HOTEL_ID/seasons/:SEASON_ID/rates
async function listHotelSeasonRates(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!SEASON_ID || Number.isNaN(SEASON_ID))
      return res.status(400).json({ message: "Invalid SEASON_ID" });

    // Ensure season belongs to hotel/company
    const seasons = await dbService.find(
      {
        table: HOTEL_SEASONS_TABLE,
        where: { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
        limit: 1,
      },
      companyId
    );
    if (!seasons.length)
      return res.status(404).json({ message: "Season not found" });

    const sql = `
      SELECT
        r.RATE_ID,
        r.SEASON_ID,
        r.RATE_FOR_ID,
        r.RATE_START_DATE,
        r.RATE_END_DATE,
        r.RATE_AMOUNT,
        r.COMPANY_ID,
        r.CREATED_ON,
        r.CREATED_BY,
        r.CHANGED_ON,
        r.CHANGED_BY,
        li.ITEM_NAME AS ITEM_NAME
      FROM ${HOTEL_SEASON_RATES_TABLE} r
      LEFT JOIN ${LIST_ITEMS_TABLE} li
        ON li.LIST_ITEM_ID = r.RATE_FOR_ID
       AND li.COMPANY_ID = ?
      WHERE r.SEASON_ID = ?
        AND r.COMPANY_ID = ?
      ORDER BY r.RATE_START_DATE ASC, r.RATE_ID ASC
    `;

    const [rows] = await pool.query(sql, [companyId, SEASON_ID, companyId]);
    return res.json(rows);
  } catch (err) {
    console.error("listHotelSeasonRates error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/hotels/:HOTEL_ID/seasons/:SEASON_ID/rates
async function createHotelSeasonRate(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID)
      return res.status(401).json({ message: "Unauthorized" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!SEASON_ID || Number.isNaN(SEASON_ID))
      return res.status(400).json({ message: "Invalid SEASON_ID" });

    // Ensure season belongs to hotel/company
    const seasons = await dbService.find(
      {
        table: HOTEL_SEASONS_TABLE,
        where: { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
        limit: 1,
      },
      companyId
    );
    if (!seasons.length)
      return res.status(404).json({ message: "Season not found" });

    const season = seasons[0];

    // block create if season already expired
    if (isSeasonExpiredRow(season)) {
      return res
        .status(409)
        .json({ message: "Cannot add rates to an expired season" });
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

    // Optional RATE_FOR_ID
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

    // Season dates (required for defaulting)
    const sStart = season.SEASON_START_DATE
      ? new Date(season.SEASON_START_DATE)
      : null;
    const sEnd = season.SEASON_END_DATE
      ? new Date(season.SEASON_END_DATE)
      : null;

    if (
      !sStart ||
      !sEnd ||
      Number.isNaN(sStart.getTime()) ||
      Number.isNaN(sEnd.getTime())
    ) {
      return res
        .status(500)
        .json({ message: "Season start/end dates are invalid in DB" });
    }

    // Dates: default to season dates if not provided
    let startDate;
    let endDate;

    // RATE_START_DATE
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
    } else {
      startDate = sStart; // default to season start
    }

    // RATE_END_DATE
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
    } else {
      endDate = sEnd; // default to season end
    }

    // Validate date order
    if (startDate > endDate) {
      return res.status(400).json({
        message: "RATE_START_DATE cannot be after RATE_END_DATE",
      });
    }

    // Enforce within season range (always, since we now always have dates)
    if (startDate < sStart) {
      return res.status(400).json({
        message: "RATE_START_DATE must be within the season dates",
      });
    }
    if (endDate > sEnd) {
      return res.status(400).json({
        message: "RATE_END_DATE must be within the season dates",
      });
    }

    const now = new Date();

    const result = await dbService.insert(
      HOTEL_SEASON_RATES_TABLE,
      {
        SEASON_ID,
        RATE_FOR_ID: rateForId,
        RATE_START_DATE: startDate, // never null now
        RATE_END_DATE: endDate, // never null now
        RATE_AMOUNT: amountNumber,
        CREATED_ON: now,
        CREATED_BY: userFromToken.USER_ID,
        CHANGED_ON: now,
        CHANGED_BY: userFromToken.USER_ID,
      },
      companyId
    );

    return res
      .status(201)
      .json({ message: "Season rate created", RATE_ID: result.insertId });
  } catch (err) {
    console.error("createHotelSeasonRate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// PUT /api/hotels/:HOTEL_ID/seasons/:SEASON_ID/rates/:RATE_ID
async function updateHotelSeasonRate(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID)
      return res.status(401).json({ message: "Unauthorized" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);
    const RATE_ID = parseInt(req.params.RATE_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!SEASON_ID || Number.isNaN(SEASON_ID))
      return res.status(400).json({ message: "Invalid SEASON_ID" });
    if (!RATE_ID || Number.isNaN(RATE_ID))
      return res.status(400).json({ message: "Invalid RATE_ID" });

    const seasons = await dbService.find(
      {
        table: HOTEL_SEASONS_TABLE,
        where: { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
        limit: 1,
      },
      companyId
    );
    if (!seasons.length)
      return res.status(404).json({ message: "Season not found" });

    const season = seasons[0];
    if (isSeasonExpiredRow(season)) {
      return res
        .status(409)
        .json({ message: "Cannot edit rates for an expired season" });
    }

    const existingRates = await dbService.find(
      {
        table: HOTEL_SEASON_RATES_TABLE,
        where: { RATE_ID, SEASON_ID },
        limit: 1,
      },
      companyId
    );
    if (!existingRates.length)
      return res.status(404).json({ message: "Rate not found" });

    const existing = existingRates[0];
    const { RATE_FOR_ID, RATE_START_DATE, RATE_END_DATE, RATE_AMOUNT } =
      req.body;

    const updateData = {};

    // RATE_AMOUNT
    if (RATE_AMOUNT !== undefined) {
      const amountNumber = Number(RATE_AMOUNT);
      if (Number.isNaN(amountNumber))
        return res
          .status(400)
          .json({ message: "RATE_AMOUNT must be a valid number" });
      updateData.RATE_AMOUNT = amountNumber;
    }

    // RATE_FOR_ID
    if (RATE_FOR_ID !== undefined) {
      if (RATE_FOR_ID === null || RATE_FOR_ID === "") {
        updateData.RATE_FOR_ID = null;
      } else {
        const rateForId = parseInt(RATE_FOR_ID, 10);
        if (!rateForId || Number.isNaN(rateForId))
          return res.status(400).json({ message: "Invalid RATE_FOR_ID" });

        const items = await dbService.find(
          {
            table: LIST_ITEMS_TABLE,
            where: { LIST_ITEM_ID: rateForId },
            limit: 1,
          },
          companyId
        );
        if (!items.length)
          return res.status(400).json({
            message: "Invalid Room Type (list item not found for this company)",
          });

        updateData.RATE_FOR_ID = rateForId;
      }
    }

    // Dates
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
        const parsed = new Date(RATE_START_DATE);
        if (Number.isNaN(parsed.getTime()))
          return res
            .status(400)
            .json({ message: "Invalid RATE_START_DATE format" });
        newStart = parsed;
        updateData.RATE_START_DATE = parsed;
      }
    }

    if (RATE_END_DATE !== undefined) {
      if (RATE_END_DATE === null || RATE_END_DATE === "") {
        newEnd = null;
        updateData.RATE_END_DATE = null;
      } else {
        const parsed = new Date(RATE_END_DATE);
        if (Number.isNaN(parsed.getTime()))
          return res
            .status(400)
            .json({ message: "Invalid RATE_END_DATE format" });
        newEnd = parsed;
        updateData.RATE_END_DATE = parsed;
      }
    }

    if (newStart && newEnd && newStart > newEnd) {
      return res
        .status(400)
        .json({ message: "RATE_START_DATE cannot be after RATE_END_DATE" });
    }

    // enforce within season range if season has dates
    const sStart = season.SEASON_START_DATE
      ? new Date(season.SEASON_START_DATE)
      : null;
    const sEnd = season.SEASON_END_DATE
      ? new Date(season.SEASON_END_DATE)
      : null;

    if (sStart && sEnd) {
      if (newStart && newStart < sStart)
        return res
          .status(400)
          .json({ message: "RATE_START_DATE must be within the season dates" });
      if (newEnd && newEnd > sEnd)
        return res
          .status(400)
          .json({ message: "RATE_END_DATE must be within the season dates" });
      if (!newStart && newEnd && newEnd < sStart)
        return res
          .status(400)
          .json({ message: "RATE_END_DATE must be within the season dates" });
      if (newStart && !newEnd && newStart > sEnd)
        return res
          .status(400)
          .json({ message: "RATE_START_DATE must be within the season dates" });
    }

    const now = new Date();
    updateData.CHANGED_ON = now;
    updateData.CHANGED_BY = userFromToken.USER_ID;

    await dbService.update(
      HOTEL_SEASON_RATES_TABLE,
      updateData,
      { RATE_ID, SEASON_ID },
      companyId
    );

    // return updated row with ITEM_NAME
    const sql = `
      SELECT
        r.RATE_ID,
        r.SEASON_ID,
        r.RATE_FOR_ID,
        r.RATE_START_DATE,
        r.RATE_END_DATE,
        r.RATE_AMOUNT,
        r.COMPANY_ID,
        r.CREATED_ON,
        r.CREATED_BY,
        r.CHANGED_ON,
        r.CHANGED_BY,
        li.ITEM_NAME AS ITEM_NAME
      FROM ${HOTEL_SEASON_RATES_TABLE} r
      LEFT JOIN ${LIST_ITEMS_TABLE} li
        ON li.LIST_ITEM_ID = r.RATE_FOR_ID
       AND li.COMPANY_ID = ?
      WHERE r.SEASON_ID = ?
        AND r.RATE_ID = ?
        AND r.COMPANY_ID = ?
      LIMIT 1
    `;

    const [rows] = await pool.query(sql, [
      companyId,
      SEASON_ID,
      RATE_ID,
      companyId,
    ]);

    return res.json({ message: "Season rate updated", RATE: rows[0] || null });
  } catch (err) {
    console.error("updateHotelSeasonRate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// DELETE /api/hotels/:HOTEL_ID/seasons/:SEASON_ID/rates/:RATE_ID
async function deleteHotelSeasonRate(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const SEASON_ID = parseInt(req.params.SEASON_ID, 10);
    const RATE_ID = parseInt(req.params.RATE_ID, 10);

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    if (!SEASON_ID || Number.isNaN(SEASON_ID))
      return res.status(400).json({ message: "Invalid SEASON_ID" });
    if (!RATE_ID || Number.isNaN(RATE_ID))
      return res.status(400).json({ message: "Invalid RATE_ID" });

    const seasons = await dbService.find(
      {
        table: HOTEL_SEASONS_TABLE,
        where: { SEASON_ID, SEASON_HOTEL_ID: HOTEL_ID },
        limit: 1,
      },
      companyId
    );
    if (!seasons.length)
      return res.status(404).json({ message: "Season not found" });

    const season = seasons[0];
    if (isSeasonExpiredRow(season)) {
      return res
        .status(409)
        .json({ message: "Cannot delete rates for an expired season" });
    }

    const existingRates = await dbService.find(
      {
        table: HOTEL_SEASON_RATES_TABLE,
        where: { RATE_ID, SEASON_ID },
        limit: 1,
      },
      companyId
    );
    if (!existingRates.length)
      return res.status(404).json({ message: "Rate not found" });

    await dbService.remove(
      HOTEL_SEASON_RATES_TABLE,
      { RATE_ID, SEASON_ID },
      companyId
    );

    return res.json({ message: "Season rate deleted" });
  } catch (err) {
    console.error("deleteHotelSeasonRate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ----------------------------------------------------
// GET seasons with their rates for a hotel
// GET /api/hotels/:HOTEL_ID/seasons-with-rates
// NOW: returns season rates (not contract rates)
// Auto-expire: exclude seasons where SEASON_END_DATE < today (end date inclusive)
// ----------------------------------------------------
async function getHotelSeasonsWithRates(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null)
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    if (!HOTEL_ID || Number.isNaN(HOTEL_ID))
      return res.status(400).json({ message: "Invalid HOTEL_ID" });

    // 1) Ensure hotel exists for this company
    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (!hotels.length)
      return res.status(404).json({ message: "Hotel not found" });

    // 2) Get ACTIVE CONTRACT (still returned for compatibility with frontend UI)
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
    const activeContract =
      contractRows && contractRows.length ? contractRows[0] : null;

    // 3) Get NON-EXPIRED seasons (end-date inclusive)
    //    Meaning: if season ends today -> included today; tomorrow excluded.
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
        AND DATE(s.SEASON_END_DATE) >= CURDATE()
      ORDER BY s.SEASON_START_DATE ASC, s.SEASON_ID ASC
    `;
    const [seasonRows] = await pool.query(seasonsSql, [
      companyId,
      HOTEL_ID,
      companyId,
    ]);

    // 4) Get all rates for those seasons (one query)
    const seasonIds = seasonRows.map((s) => s.SEASON_ID);
    let ratesBySeason = {};

    if (seasonIds.length > 0) {
      const placeholders = seasonIds.map(() => "?").join(",");
      const ratesSql = `
        SELECT
          r.RATE_ID,
          r.SEASON_ID,
          r.RATE_FOR_ID,
          r.RATE_START_DATE,
          r.RATE_END_DATE,
          r.RATE_AMOUNT,
          r.COMPANY_ID,
          r.CREATED_ON,
          r.CREATED_BY,
          r.CHANGED_ON,
          r.CHANGED_BY,
          li.ITEM_NAME AS ITEM_NAME
        FROM ${HOTEL_SEASON_RATES_TABLE} r
        LEFT JOIN ${LIST_ITEMS_TABLE} li
          ON li.LIST_ITEM_ID = r.RATE_FOR_ID
         AND li.COMPANY_ID = ?
        WHERE r.COMPANY_ID = ?
          AND r.SEASON_ID IN (${placeholders})
        ORDER BY r.SEASON_ID ASC, r.RATE_START_DATE ASC, r.RATE_ID ASC
      `;

      const [rateRows] = await pool.query(ratesSql, [
        companyId,
        companyId,
        ...seasonIds,
      ]);

      ratesBySeason = rateRows.reduce((acc, r) => {
        if (!acc[r.SEASON_ID]) acc[r.SEASON_ID] = [];
        acc[r.SEASON_ID].push(r);
        return acc;
      }, {});
    }

    // 5) Attach rates to seasons
    const seasonsWithRates = seasonRows.map((season) => ({
      ...season,
      RATES: ratesBySeason[season.SEASON_ID] || [],
    }));

    return res.json({
      HOTEL_ID,
      ACTIVE_CONTRACT: activeContract, // still included (optional)
      SEASONS: seasonsWithRates,
    });
  } catch (err) {
    console.error("getHotelSeasonsWithRates error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
// ----------------------------------------------------
// HOTEL ADDITIONAL SERVICES CRUD
// ----------------------------------------------------

// GET /api/hotels/:HOTEL_ID/additional-services
async function listHotelAdditionalServices(req, res) {
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

    // Ensure hotel exists for this company
    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (!hotels.length) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const services = await dbService.find(
      {
        table: HOTEL_ADDITIONAL_SERVICES_TABLE,
        where: { ADDITIONAL_SERVICE_HOTEL_ID: HOTEL_ID },
        fields: [
          "ADDITIONAL_SERVICE_ID",
          "ADDITIONAL_SERVICE_HOTEL_ID",
          "ADDITIONAL_SERVICE_NAME",
          "ADDITIONAL_SERVICE_AMOUNT",
          "ADDITIONAL_SERVICE_DESCRIPTION",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "CHANGED_ON",
          "CHANGED_BY",
        ],
        orderBy: "ADDITIONAL_SERVICE_NAME ASC",
      },
      companyId
    );

    return res.json(services);
  } catch (err) {
    console.error("listHotelAdditionalServices error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/hotels/:HOTEL_ID/additional-services/:ADDITIONAL_SERVICE_ID
async function getHotelAdditionalServiceById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const ADDITIONAL_SERVICE_ID = parseInt(
      req.params.ADDITIONAL_SERVICE_ID,
      10
    );

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!ADDITIONAL_SERVICE_ID || Number.isNaN(ADDITIONAL_SERVICE_ID)) {
      return res.status(400).json({ message: "Invalid ADDITIONAL_SERVICE_ID" });
    }

    // Ensure hotel exists
    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (!hotels.length) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const services = await dbService.find(
      {
        table: HOTEL_ADDITIONAL_SERVICES_TABLE,
        where: {
          ADDITIONAL_SERVICE_ID,
          ADDITIONAL_SERVICE_HOTEL_ID: HOTEL_ID,
        },
        limit: 1,
      },
      companyId
    );

    if (!services.length) {
      return res.status(404).json({ message: "Additional service not found" });
    }

    return res.json(services[0]);
  } catch (err) {
    console.error("getHotelAdditionalServiceById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/hotels/:HOTEL_ID/additional-services
async function createHotelAdditionalService(req, res) {
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

    // Ensure hotel exists
    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (!hotels.length) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const {
      ADDITIONAL_SERVICE_NAME,
      ADDITIONAL_SERVICE_AMOUNT,
      ADDITIONAL_SERVICE_DESCRIPTION,
    } = req.body;

    if (!ADDITIONAL_SERVICE_NAME) {
      return res
        .status(400)
        .json({ message: "ADDITIONAL_SERVICE_NAME is required" });
    }

    if (
      ADDITIONAL_SERVICE_AMOUNT === undefined ||
      ADDITIONAL_SERVICE_AMOUNT === null
    ) {
      return res
        .status(400)
        .json({ message: "ADDITIONAL_SERVICE_AMOUNT is required" });
    }

    const amountNumber = Number(ADDITIONAL_SERVICE_AMOUNT);
    if (Number.isNaN(amountNumber)) {
      return res.status(400).json({
        message: "ADDITIONAL_SERVICE_AMOUNT must be a valid number",
      });
    }

    const now = new Date();

    const result = await dbService.insert(
      HOTEL_ADDITIONAL_SERVICES_TABLE,
      {
        ADDITIONAL_SERVICE_HOTEL_ID: HOTEL_ID,
        ADDITIONAL_SERVICE_NAME,
        ADDITIONAL_SERVICE_AMOUNT: amountNumber,
        ADDITIONAL_SERVICE_DESCRIPTION: ADDITIONAL_SERVICE_DESCRIPTION || null,
        CREATED_ON: now,
        CREATED_BY: userFromToken.USER_ID,
        CHANGED_ON: now,
        CHANGED_BY: userFromToken.USER_ID,
      },
      companyId
    );

    return res.status(201).json({
      message: "Hotel additional service created",
      ADDITIONAL_SERVICE_ID: result.insertId,
    });
  } catch (err) {
    console.error("createHotelAdditionalService error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// PUT /api/hotels/:HOTEL_ID/additional-services/:ADDITIONAL_SERVICE_ID
async function updateHotelAdditionalService(req, res) {
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
    const ADDITIONAL_SERVICE_ID = parseInt(
      req.params.ADDITIONAL_SERVICE_ID,
      10
    );

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!ADDITIONAL_SERVICE_ID || Number.isNaN(ADDITIONAL_SERVICE_ID)) {
      return res.status(400).json({ message: "Invalid ADDITIONAL_SERVICE_ID" });
    }

    // Ensure hotel exists
    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (!hotels.length) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Ensure service exists
    const existingRows = await dbService.find(
      {
        table: HOTEL_ADDITIONAL_SERVICES_TABLE,
        where: {
          ADDITIONAL_SERVICE_ID,
          ADDITIONAL_SERVICE_HOTEL_ID: HOTEL_ID,
        },
        limit: 1,
      },
      companyId
    );
    if (!existingRows.length) {
      return res.status(404).json({ message: "Additional service not found" });
    }

    const {
      ADDITIONAL_SERVICE_NAME,
      ADDITIONAL_SERVICE_AMOUNT,
      ADDITIONAL_SERVICE_DESCRIPTION,
    } = req.body;

    const updateData = {};

    if (ADDITIONAL_SERVICE_NAME !== undefined) {
      updateData.ADDITIONAL_SERVICE_NAME = ADDITIONAL_SERVICE_NAME;
    }

    if (ADDITIONAL_SERVICE_AMOUNT !== undefined) {
      const amountNumber = Number(ADDITIONAL_SERVICE_AMOUNT);
      if (Number.isNaN(amountNumber)) {
        return res.status(400).json({
          message: "ADDITIONAL_SERVICE_AMOUNT must be a valid number",
        });
      }
      updateData.ADDITIONAL_SERVICE_AMOUNT = amountNumber;
    }

    if (ADDITIONAL_SERVICE_DESCRIPTION !== undefined) {
      updateData.ADDITIONAL_SERVICE_DESCRIPTION =
        ADDITIONAL_SERVICE_DESCRIPTION || null;
    }

    const now = new Date();
    updateData.CHANGED_ON = now;
    updateData.CHANGED_BY = userFromToken.USER_ID;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(
        HOTEL_ADDITIONAL_SERVICES_TABLE,
        updateData,
        {
          ADDITIONAL_SERVICE_ID,
          ADDITIONAL_SERVICE_HOTEL_ID: HOTEL_ID,
        },
        companyId
      );
    }

    const updatedRows = await dbService.find(
      {
        table: HOTEL_ADDITIONAL_SERVICES_TABLE,
        where: {
          ADDITIONAL_SERVICE_ID,
          ADDITIONAL_SERVICE_HOTEL_ID: HOTEL_ID,
        },
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Hotel additional service updated",
      SERVICE: updatedRows[0] || null,
    });
  } catch (err) {
    console.error("updateHotelAdditionalService error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// DELETE /api/hotels/:HOTEL_ID/additional-services/:ADDITIONAL_SERVICE_ID
async function deleteHotelAdditionalService(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const HOTEL_ID = parseInt(req.params.HOTEL_ID, 10);
    const ADDITIONAL_SERVICE_ID = parseInt(
      req.params.ADDITIONAL_SERVICE_ID,
      10
    );

    if (!HOTEL_ID || Number.isNaN(HOTEL_ID)) {
      return res.status(400).json({ message: "Invalid HOTEL_ID" });
    }
    if (!ADDITIONAL_SERVICE_ID || Number.isNaN(ADDITIONAL_SERVICE_ID)) {
      return res.status(400).json({ message: "Invalid ADDITIONAL_SERVICE_ID" });
    }

    // Ensure hotel exists
    const hotels = await dbService.find(
      { table: HOTELS_TABLE, where: { HOTEL_ID }, limit: 1 },
      companyId
    );
    if (!hotels.length) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Ensure service exists for this hotel + company
    const services = await dbService.find(
      {
        table: HOTEL_ADDITIONAL_SERVICES_TABLE,
        where: {
          ADDITIONAL_SERVICE_ID,
          ADDITIONAL_SERVICE_HOTEL_ID: HOTEL_ID,
        },
        limit: 1,
      },
      companyId
    );
    if (!services.length) {
      return res.status(404).json({ message: "Additional service not found" });
    }

    await dbService.remove(
      HOTEL_ADDITIONAL_SERVICES_TABLE,
      {
        ADDITIONAL_SERVICE_ID,
        ADDITIONAL_SERVICE_HOTEL_ID: HOTEL_ID,
      },
      companyId
    );

    return res.json({ message: "Hotel additional service deleted" });
  } catch (err) {
    console.error("deleteHotelAdditionalService error:", err);
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

  // Contract rates (deprecated)
  listHotelContractRates,
  getHotelContractRateById,
  createHotelContractRate,
  updateHotelContractRate,
  deleteHotelContractRate,

  // Seasons
  listHotelSeasons,
  getHotelSeasonById,
  createHotelSeason,
  updateHotelSeason,
  deleteHotelSeason,

  // NEW season rates
  listHotelSeasonRates,
  createHotelSeasonRate,
  updateHotelSeasonRate,
  deleteHotelSeasonRate,

  // Pricing
  getHotelSeasonsWithRates,
  //additional services
  listHotelAdditionalServices,
  getHotelAdditionalServiceById,
  createHotelAdditionalService,
  updateHotelAdditionalService,
  deleteHotelAdditionalService,
};
