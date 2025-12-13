// src/modules/hotels/hotels.controller.js
const dbService = require("../../core/dbService");

const HOTELS_TABLE = "COE_TBL_HOTELS";

const HOTELS_VIEW = "COE_VIEW_HOTEL_PROFILE_LOOKUP";

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
      HOTEL_CONTRACT,
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

    const result = await dbService.insert(
      HOTELS_TABLE,
      {
        HOTEL_NAME,
        HOTEL_ADDRESS: HOTEL_ADDRESS || null,
        HOTEL_AREA: HOTEL_AREA || null,
        HOTEL_STARS: HOTEL_STARS ?? null,
        HOTEL_PHONE: HOTEL_PHONE || null,
        HOTEL_CONTRACT: HOTEL_CONTRACT || null,
        HOTEL_RESERVATION_EMAIL: HOTEL_RESERVATION_EMAIL || null,
        HOTEL_LAT: HOTEL_LAT || null,
        HOTEL_LAN: HOTEL_LAN || null,
        HOTEL_CHAIN: HOTEL_CHAIN || null,
        HOTEL_LOGO: HOTEL_LOGO || null,
        HOTEL_CONTACT_PERSON_NAME: HOTEL_CONTACT_PERSON_NAME || null,
        ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
        CREATED_BY: userFromToken.USER_ID,
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

module.exports = {
  listHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
};
