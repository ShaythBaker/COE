// src/modules/guides/guides.controller.js
const dbService = require("../../core/dbService");

const GUIDES_TABLE = "COE_TBL_GUIDES";
const GUIDES_VIEW = "COE_VIEW_GUIDES_LOOKUP";

// Helper to get COMPANY_ID from backend (JWT user or session)
// Same idea as lists/attachments controllers
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
 * GET /api/guides
 * Optional query: ?GUIDE_ACTIVE_STATUS=1
 *
 * Uses COMPANY_ID from JWT/session (not from frontend)
 */
async function listGuides(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const { GUIDE_ACTIVE_STATUS } = req.query;
    const where = {};
    if (GUIDE_ACTIVE_STATUS !== undefined) {
      where.GUIDE_ACTIVE_STATUS = Number(GUIDE_ACTIVE_STATUS);
    }

    const guides = await dbService.find(
      {
        table: GUIDES_TABLE,
        where,
        fields: [
          "GUIDE_ID",
          "GUIDE_NAME",
          "GUIDE_LANGUAGE_ID",
          "GUIDE_DAILY_RATE",
          "GUIDE_PHONE_NUMBER",
          "GUIDE_EMAIL",
          "GUIDE_PROFILE_IMAGE",
          "GUIDE_ACTIVE_STATUS",
          "COMPANY_ID",
          "CREATED_BY",
          "CREATED_ON",
          "UPDATED_ON",
          "UPDATED_AT",
        ],
        orderBy: "GUIDE_NAME ASC",
      },
      companyId // 👈 scopes by COMPANY_ID
    );

    return res.json(guides);
  } catch (err) {
    console.error("listGuides error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/guides/:GUIDE_ID
 */
async function getGuideById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const GUIDE_ID = parseInt(req.params.GUIDE_ID, 10);
    if (!GUIDE_ID || Number.isNaN(GUIDE_ID)) {
      return res.status(400).json({ message: "Invalid GUIDE_ID" });
    }

    const guides = await dbService.find(
      {
        table: GUIDES_VIEW,
        where: { GUIDE_ID },
        fields: [
          "GUIDE_ID",
          "GUIDE_NAME",
          "GUIDE_LANGUAGE_ID",
          "GUIDE_LANGUAGE_NAME", // from COE_VW_GUIDES
          "GUIDE_DAILY_RATE",
          "GUIDE_PHONE_NUMBER",
          "GUIDE_EMAIL",
          "GUIDE_PROFILE_IMAGE",
          "GUIDE_ACTIVE_STATUS",
          "COMPANY_ID",

          "CREATED_BY",
          "CREATED_BY_NAME", // from COE_VW_GUIDES
          "CREATED_BY_EMAIL", // from COE_VW_GUIDES
          "CREATED_BY_PHONE", // from COE_VW_GUIDES

          "CREATED_ON",
          "UPDATED_ON",
          "UPDATED_AT",
        ],
        limit: 1,
      },
      companyId // still enforce COMPANY_ID via core dbService
    );

    if (guides.length === 0) {
      return res.status(404).json({ message: "Guide not found" });
    }

    return res.json(guides[0]);
  } catch (err) {
    console.error("getGuideById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/guides
 * BODY (UPPERCASE, similar style to other modules):
 * {
 *   "GUIDE_NAME": "John Doe",
 *   "GUIDE_LANGUAGE_ID": 1,
 *   "GUIDE_DAILY_RATE": 100.0,
 *   "GUIDE_PHONE_NUMBER": "00962...",
 *   "GUIDE_EMAIL": "guide@example.com",
 *   "GUIDE_PROFILE_IMAGE": "https://...",
 *   "GUIDE_ACTIVE_STATUS": 1
 * }
 */
async function createGuide(req, res) {
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
      GUIDE_NAME,
      GUIDE_LANGUAGE_ID,
      GUIDE_DAILY_RATE,
      GUIDE_PHONE_NUMBER,
      GUIDE_EMAIL,
      GUIDE_PROFILE_IMAGE,
      GUIDE_ACTIVE_STATUS,
    } = req.body;

    if (!GUIDE_NAME) {
      return res.status(400).json({
        message: "GUIDE_NAME is required",
      });
    }

    const now = new Date();

    const result = await dbService.insert(
      GUIDES_TABLE,
      {
        GUIDE_NAME,
        GUIDE_LANGUAGE_ID: GUIDE_LANGUAGE_ID || null,
        GUIDE_DAILY_RATE: GUIDE_DAILY_RATE || null,
        GUIDE_PHONE_NUMBER: GUIDE_PHONE_NUMBER || null,
        GUIDE_EMAIL: GUIDE_EMAIL || null,
        GUIDE_PROFILE_IMAGE: GUIDE_PROFILE_IMAGE || null,
        GUIDE_ACTIVE_STATUS: GUIDE_ACTIVE_STATUS ?? 1,
        CREATED_BY: userFromToken.USER_ID,
        // Let DB handle CREATED_ON/UPDATED_* if it has defaults/triggers
        CREATED_ON: now,
      },
      companyId
    );

    return res.status(201).json({
      message: "Guide created",
      GUIDE_ID: result.insertId,
    });
  } catch (err) {
    console.error("createGuide error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/guides/:GUIDE_ID
 * BODY: any subset of:
 * {
 *   "GUIDE_NAME": "...",
 *   "GUIDE_LANGUAGE_ID": ...,
 *   "GUIDE_DAILY_RATE": ...,
 *   "GUIDE_PHONE_NUMBER": "...",
 *   "GUIDE_EMAIL": "...",
 *   "GUIDE_PROFILE_IMAGE": "...",
 *   "GUIDE_ACTIVE_STATUS": 0/1
 * }
 */
async function updateGuide(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const GUIDE_ID = parseInt(req.params.GUIDE_ID, 10);
    if (!GUIDE_ID || Number.isNaN(GUIDE_ID)) {
      return res.status(400).json({ message: "Invalid GUIDE_ID" });
    }

    const {
      GUIDE_NAME,
      GUIDE_LANGUAGE_ID,
      GUIDE_DAILY_RATE,
      GUIDE_PHONE_NUMBER,
      GUIDE_EMAIL,
      GUIDE_PROFILE_IMAGE,
      GUIDE_ACTIVE_STATUS,
    } = req.body;

    // Ensure guide exists (scoped by company)
    const existing = await dbService.find(
      {
        table: GUIDES_TABLE,
        where: { GUIDE_ID },
        limit: 1,
      },
      companyId
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Guide not found" });
    }

    const updateData = {};
    if (GUIDE_NAME !== undefined) updateData.GUIDE_NAME = GUIDE_NAME;
    if (GUIDE_LANGUAGE_ID !== undefined)
      updateData.GUIDE_LANGUAGE_ID = GUIDE_LANGUAGE_ID;
    if (GUIDE_DAILY_RATE !== undefined)
      updateData.GUIDE_DAILY_RATE = GUIDE_DAILY_RATE;
    if (GUIDE_PHONE_NUMBER !== undefined)
      updateData.GUIDE_PHONE_NUMBER = GUIDE_PHONE_NUMBER;
    if (GUIDE_EMAIL !== undefined) updateData.GUIDE_EMAIL = GUIDE_EMAIL;
    if (GUIDE_PROFILE_IMAGE !== undefined)
      updateData.GUIDE_PROFILE_IMAGE = GUIDE_PROFILE_IMAGE;
    if (GUIDE_ACTIVE_STATUS !== undefined)
      updateData.GUIDE_ACTIVE_STATUS = GUIDE_ACTIVE_STATUS;

    if (Object.keys(updateData).length > 0) {
      updateData.UPDATED_ON = new Date();
      await dbService.update(GUIDES_TABLE, updateData, { GUIDE_ID }, companyId);
    }

    const updated = await dbService.find(
      {
        table: GUIDES_TABLE,
        where: { GUIDE_ID },
        fields: [
          "GUIDE_ID",
          "GUIDE_NAME",
          "GUIDE_LANGUAGE_ID",
          "GUIDE_DAILY_RATE",
          "GUIDE_PHONE_NUMBER",
          "GUIDE_EMAIL",
          "GUIDE_PROFILE_IMAGE",
          "GUIDE_ACTIVE_STATUS",
          "COMPANY_ID",
          "CREATED_BY",
          "CREATED_ON",
          "UPDATED_ON",
          "UPDATED_AT",
        ],
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Guide updated",
      GUIDE: updated[0],
    });
  } catch (err) {
    console.error("updateGuide error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/guides/:GUIDE_ID
 * Soft delete: set GUIDE_ACTIVE_STATUS = 0
 */
async function deleteGuide(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const GUIDE_ID = parseInt(req.params.GUIDE_ID, 10);
    if (!GUIDE_ID || Number.isNaN(GUIDE_ID)) {
      return res.status(400).json({ message: "Invalid GUIDE_ID" });
    }

    // Ensure guide exists for this company
    const existing = await dbService.find(
      {
        table: GUIDES_TABLE,
        where: { GUIDE_ID },
        limit: 1,
      },
      companyId
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Guide not found" });
    }

    await dbService.update(
      GUIDES_TABLE,
      {
        GUIDE_ACTIVE_STATUS: 0,
        UPDATED_ON: new Date(),
      },
      { GUIDE_ID },
      companyId
    );

    return res.json({ message: "Guide deleted (soft)" });
  } catch (err) {
    console.error("deleteGuide error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide,
};
