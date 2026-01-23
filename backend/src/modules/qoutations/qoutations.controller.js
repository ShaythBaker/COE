// modules/qoutations/qoutations.controller.js
const dbService = require("../../core/dbService");

const QOUTATIONS_TABLE = "COE_TBL_QOUTATIONS";
const QOUTATIONS_VIEW = "COE_VIEW_QOUTATIONS_LOOKUP";

// Helper to get company id from backend (JWT user or session)
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) {
    return req.user.COMPANY_ID;
  }
  if (req.session && req.session.COMPANY_ID) {
    return req.session.COMPANY_ID;
  }
  return null;
}

// Helper to compute basic stay info (days & nights) from arriving/departuring dates
function calculateStayBasicInfo(arrivingDate, departingDate) {
  if (!arrivingDate || !departingDate) {
    return null;
  }

  const start = new Date(arrivingDate);
  const end = new Date(departingDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return null;
  }

  const MS_IN_DAY = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((end.getTime() - start.getTime()) / MS_IN_DAY);

  // Convention: nights = diff in days, days = nights + 1
  const numberOfNights = diffDays;
  const numberOfDays = diffDays + 1;

  return {
    NUMBER_OF_DAYS: numberOfDays,
    NUMBER_OF_NIGHTS: numberOfNights,
  };
}

// All columns that can be used as filters on the VIEW
const QOUTATIONS_FILTERABLE_COLUMNS = [
  "QOUTATION_ID",
  "QOUTATION_CLIENT_ID",
  "QOUTATION_TRANSPORTATION_COMPANY_ID",
  "QOUTATION_TOTAL_PAX",
  "QOUTATION_GROUP_NAME",
  "QOUTATION_ARRIVING_DATE",
  "QOUTATION_DEPARTURING_DATE",
  "COMPANY_ID",
  "CREATED_ON",
  "UPDATED_ON",
  "ACTIVE_STATUS",
  "CREATED_BY_NAME",
  "UPDATED_BY_NAME",
  "CLIENT_NAME",
  "CLIENT_COUNTRY_ID",
  "CLIENT_COUNTRY_NAME",
  "CLIENT_EMAIL",
  "CLIENT_PHONE",
  "CLIENT_CONTACT_PERSON_NAME",
  "TRANSPORTATION_COMPANY_NAME",
  "TRANSPORTATION_PHONE",
  "TRANSPORTATION_COMPANY_EMAIL",
];

/**
 * GET /api/qoutations
 *
 * Dynamic filter using COE_VIEW_QOUTATIONS.
 * Any query param whose key matches a column in the view
 * is added as an equality filter.
 *
 * /api/qoutations?QOUTATION_CLIENT_ID=10&CLIENT_NAME=ACME
 */
async function listQoutations(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const where = {};
    const query = req.query || {};

    // Build dynamic WHERE from query params (only columns in the view)
    for (const key of Object.keys(query)) {
      if (QOUTATIONS_FILTERABLE_COLUMNS.includes(key)) {
        where[key] = query[key];
      }
    }

    // Optional pagination: ?limit=&offset=
    let limit;
    let offset;

    if (query.limit !== undefined) {
      const parsedLimit = parseInt(query.limit, 10);
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    if (query.offset !== undefined) {
      const parsedOffset = parseInt(query.offset, 10);
      if (!Number.isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }

    const rows = await dbService.find(
      {
        table: QOUTATIONS_VIEW,
        where,
        orderBy: "QOUTATION_ID DESC",
        limit,
        offset,
      },
      companyId
    );

    // RESPONSE DATA FROM VIEW
    return res.json(rows);
  } catch (err) {
    console.error("listQoutations error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/qoutations/:QOUTATION_ID
 *
 * Uses COE_VIEW_QOUTATIONS (enriched row).
 */
async function getQoutationById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const QOUTATION_ID = parseInt(req.params.QOUTATION_ID, 10);
    if (!QOUTATION_ID || Number.isNaN(QOUTATION_ID)) {
      return res.status(400).json({ message: "Invalid QOUTATION_ID" });
    }

    const rows = await dbService.find(
      {
        table: QOUTATIONS_VIEW,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    // RESPONSE DATA FROM VIEW
    return res.json(rows[0]);
  } catch (err) {
    console.error("getQoutationById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/qoutations
 *
 * BODY:
 * {
 *   "QOUTATION_CLIENT_ID": 123,              // required
 *   "QOUTATION_TOTAL_PAX": 25,
 *   "QOUTATION_TRANSPORTATION_COMPANY_ID": 5,
 *   "QOUTATION_GROUP_NAME": "Group A",      // required
 *   "QOUTATION_ARRIVING_DATE": "2026-01-01",
 *   "QOUTATION_DEPARTURING_DATE": "2026-01-07",
 *   "ACTIVE_STATUS": 1
 * }
 *
 * Backend handles:
 *   COMPANY_ID (from token/session via dbService)
 *   CREATED_ON, CREATED_BY, UPDATED_ON, UPDATED_BY
 *
 * RESPONSE: created row FROM VIEW.
 */
async function createQoutation(req, res) {
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
      QOUTATION_CLIENT_ID,
      QOUTATION_TOTAL_PAX,
      QOUTATION_TRANSPORTATION_COMPANY_ID,
      QOUTATION_GROUP_NAME,
      QOUTATION_ARRIVING_DATE,
      QOUTATION_DEPARTURING_DATE,
      ACTIVE_STATUS,
    } = req.body;

    if (!QOUTATION_CLIENT_ID || !QOUTATION_GROUP_NAME) {
      return res.status(400).json({
        message: "QOUTATION_CLIENT_ID and QOUTATION_GROUP_NAME are required",
      });
    }

    const now = new Date();

    const insertData = {
      QOUTATION_CLIENT_ID,
      QOUTATION_TOTAL_PAX:
        QOUTATION_TOTAL_PAX !== undefined ? QOUTATION_TOTAL_PAX : null,
      QOUTATION_TRANSPORTATION_COMPANY_ID:
        QOUTATION_TRANSPORTATION_COMPANY_ID !== undefined
          ? QOUTATION_TRANSPORTATION_COMPANY_ID
          : null,
      QOUTATION_GROUP_NAME,
      QOUTATION_ARRIVING_DATE:
        QOUTATION_ARRIVING_DATE !== undefined ? QOUTATION_ARRIVING_DATE : null,
      QOUTATION_DEPARTURING_DATE:
        QOUTATION_DEPARTURING_DATE !== undefined
          ? QOUTATION_DEPARTURING_DATE
          : null,
      ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
      CREATED_BY: userFromToken.USER_ID,
      CREATED_ON: now,
      UPDATED_BY: userFromToken.USER_ID,
      UPDATED_ON: now,
      // COMPANY_ID will be injected by dbService.insert using companyId param
    };

    const result = await dbService.insert(
      QOUTATIONS_TABLE,
      insertData,
      companyId
    );

    const QOUTATION_ID = result.insertId;

    // RESPONSE DATA FROM VIEW
    const rows = await dbService.find(
      {
        table: QOUTATIONS_VIEW,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId
    );

    const createdQoutation = rows[0] || null;

    // Compute STAY_INFO -> STAY_BASIC_INFO based on arriving/departuring dates
    let stayBasicInfo = null;
    if (createdQoutation) {
      stayBasicInfo = calculateStayBasicInfo(
        createdQoutation.QOUTATION_ARRIVING_DATE,
        createdQoutation.QOUTATION_DEPARTURING_DATE
      );
    } else if (req.body) {
      // Fallback: use body if for some reason view row is missing
      stayBasicInfo = calculateStayBasicInfo(
        req.body.QOUTATION_ARRIVING_DATE,
        req.body.QOUTATION_DEPARTURING_DATE
      );
    }

    const responseBody = {
      message: "Qoutation created",
      QOUTATION: createdQoutation,
    };

    if (stayBasicInfo) {
      responseBody.STAY_INFO = {
        STAY_BASIC_INFO: stayBasicInfo,
      };
    }

    return res.status(201).json(responseBody);
  } catch (err) {
    console.error("createQoutation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/qoutations/:QOUTATION_ID
 *
 * BODY (any subset):
 * {
 *   "QOUTATION_CLIENT_ID": ...,
 *   "QOUTATION_TOTAL_PAX": ...,
 *   "QOUTATION_TRANSPORTATION_COMPANY_ID": ...,
 *   "QOUTATION_GROUP_NAME": "...",
 *   "QOUTATION_ARRIVING_DATE": "...",
 *   "QOUTATION_DEPARTURING_DATE": "...",
 *   "ACTIVE_STATUS": 0/1
 * }
 *
 * RESPONSE: updated row FROM VIEW.
 */
async function updateQoutation(req, res) {
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

    const QOUTATION_ID = parseInt(req.params.QOUTATION_ID, 10);
    if (!QOUTATION_ID || Number.isNaN(QOUTATION_ID)) {
      return res.status(400).json({ message: "Invalid QOUTATION_ID" });
    }

    // Ensure row exists for this company (table is fine, no response)
    const existing = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    const {
      QOUTATION_CLIENT_ID,
      QOUTATION_TOTAL_PAX,
      QOUTATION_TRANSPORTATION_COMPANY_ID,
      QOUTATION_GROUP_NAME,
      QOUTATION_ARRIVING_DATE,
      QOUTATION_DEPARTURING_DATE,
      ACTIVE_STATUS,
    } = req.body;

    const updateData = {};

    if (QOUTATION_CLIENT_ID !== undefined) {
      updateData.QOUTATION_CLIENT_ID = QOUTATION_CLIENT_ID;
    }
    if (QOUTATION_TOTAL_PAX !== undefined) {
      updateData.QOUTATION_TOTAL_PAX = QOUTATION_TOTAL_PAX;
    }
    if (QOUTATION_TRANSPORTATION_COMPANY_ID !== undefined) {
      updateData.QOUTATION_TRANSPORTATION_COMPANY_ID =
        QOUTATION_TRANSPORTATION_COMPANY_ID;
    }
    if (QOUTATION_GROUP_NAME !== undefined) {
      updateData.QOUTATION_GROUP_NAME = QOUTATION_GROUP_NAME;
    }
    if (QOUTATION_ARRIVING_DATE !== undefined) {
      updateData.QOUTATION_ARRIVING_DATE = QOUTATION_ARRIVING_DATE;
    }
    if (QOUTATION_DEPARTURING_DATE !== undefined) {
      updateData.QOUTATION_DEPARTURING_DATE = QOUTATION_DEPARTURING_DATE;
    }
    if (ACTIVE_STATUS !== undefined) {
      updateData.ACTIVE_STATUS = ACTIVE_STATUS;
    }

    const now = new Date();
    updateData.UPDATED_BY = userFromToken.USER_ID;
    updateData.UPDATED_ON = now;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    await dbService.update(
      QOUTATIONS_TABLE,
      updateData,
      { QOUTATION_ID },
      companyId
    );

    // RESPONSE DATA FROM VIEW
    const updated = await dbService.find(
      {
        table: QOUTATIONS_VIEW,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Qoutation updated",
      QOUTATION: updated[0] || null,
    });
  } catch (err) {
    console.error("updateQoutation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/qoutations/:QOUTATION_ID
 *
 * Soft delete: ACTIVE_STATUS = 0
 * (No need to return data; only a message.)
 */
async function deleteQoutation(req, res) {
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

    const QOUTATION_ID = parseInt(req.params.QOUTATION_ID, 10);
    if (!QOUTATION_ID || Number.isNaN(QOUTATION_ID)) {
      return res.status(400).json({ message: "Invalid QOUTATION_ID" });
    }

    const existing = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    const now = new Date();

    await dbService.update(
      QOUTATIONS_TABLE,
      {
        ACTIVE_STATUS: 0,
        UPDATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
      },
      { QOUTATION_ID },
      companyId
    );

    return res.json({ message: "Qoutation deleted (soft)" });
  } catch (err) {
    console.error("deleteQoutation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listQoutations,
  getQoutationById,
  createQoutation,
  updateQoutation,
  deleteQoutation,
};
