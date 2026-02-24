// src/modules/extraServices/extraServices.controller.js
const dbService = require("../../core/dbService");

const EXTRA_SERVICES_TABLE = "COE_TBL_TOUR_EXTRA_SERVICES";

// Helper: COMPANY_ID from JWT user or session (backend only)
// Same pattern as attachments/lists controllers
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) return req.user.COMPANY_ID;
  if (req.session && req.session.COMPANY_ID) return req.session.COMPANY_ID;
  return null;
}

/**
 * GET /api/extra-services
 * List all extra services for current COMPANY_ID
 */
async function listExtraServices(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const rows = await dbService.find(
      {
        table: EXTRA_SERVICES_TABLE,
        fields: [
          "EXTRA_SERVICE_ID",
          "EXTRA_SERVICE_NAME",
          "EXTRA_SERVICE_DESCRIPTION",
          "EXTRA_SERVICE_COST_PP",
          "CREATED_BY",
          "UPDATED_BY",
          "CREATED_ON",
          "UPDATED_ON",
        ],
        orderBy: "EXTRA_SERVICE_NAME ASC",
      },
      companyId,
    );

    return res.json(rows);
  } catch (err) {
    console.error("listExtraServices error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/extra-services/:EXTRA_SERVICE_ID
 * Get single extra service by ID
 */
async function getExtraServiceById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const EXTRA_SERVICE_ID = parseInt(req.params.EXTRA_SERVICE_ID, 10);
    if (!EXTRA_SERVICE_ID || Number.isNaN(EXTRA_SERVICE_ID)) {
      return res.status(400).json({ message: "Invalid EXTRA_SERVICE_ID" });
    }

    const rows = await dbService.find(
      {
        table: EXTRA_SERVICES_TABLE,
        where: { EXTRA_SERVICE_ID },
        limit: 1,
      },
      companyId,
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Extra service not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getExtraServiceById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/extra-services
 * BODY:
 * {
 *   "EXTRA_SERVICE_NAME": "Dinner",
 *   "EXTRA_SERVICE_DESCRIPTION": "Open buffet",
 *   "EXTRA_SERVICE_COST_PP": 25.5
 * }
 */
async function createExtraService(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      EXTRA_SERVICE_NAME,
      EXTRA_SERVICE_DESCRIPTION,
      EXTRA_SERVICE_COST_PP,
    } = req.body;

    if (!EXTRA_SERVICE_NAME) {
      return res
        .status(400)
        .json({ message: "EXTRA_SERVICE_NAME is required" });
    }

    if (EXTRA_SERVICE_COST_PP === undefined || EXTRA_SERVICE_COST_PP === null) {
      return res
        .status(400)
        .json({ message: "EXTRA_SERVICE_COST_PP is required" });
    }

    const cost = Number(EXTRA_SERVICE_COST_PP);
    if (Number.isNaN(cost)) {
      return res
        .status(400)
        .json({ message: "EXTRA_SERVICE_COST_PP must be a number" });
    }

    const now = new Date();

    const result = await dbService.insert(
      EXTRA_SERVICES_TABLE,
      {
        EXTRA_SERVICE_NAME,
        EXTRA_SERVICE_DESCRIPTION:
          EXTRA_SERVICE_DESCRIPTION !== undefined
            ? EXTRA_SERVICE_DESCRIPTION
            : null,
        EXTRA_SERVICE_COST_PP: cost,
        CREATED_BY: userFromToken.USER_ID,
        UPDATED_BY: userFromToken.USER_ID,
        CREATED_ON: now,
        UPDATED_ON: now,
      },
      companyId,
    );

    return res.status(201).json({
      message: "Extra service created",
      EXTRA_SERVICE_ID: result.insertId,
    });
  } catch (err) {
    console.error("createExtraService error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/extra-services/:EXTRA_SERVICE_ID
 * BODY: any subset of:
 * {
 *   "EXTRA_SERVICE_NAME": "...",
 *   "EXTRA_SERVICE_DESCRIPTION": "...",
 *   "EXTRA_SERVICE_COST_PP": 30
 * }
 */
async function updateExtraService(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const EXTRA_SERVICE_ID = parseInt(req.params.EXTRA_SERVICE_ID, 10);
    if (!EXTRA_SERVICE_ID || Number.isNaN(EXTRA_SERVICE_ID)) {
      return res.status(400).json({ message: "Invalid EXTRA_SERVICE_ID" });
    }

    const {
      EXTRA_SERVICE_NAME,
      EXTRA_SERVICE_DESCRIPTION,
      EXTRA_SERVICE_COST_PP,
    } = req.body;

    const existingRows = await dbService.find(
      {
        table: EXTRA_SERVICES_TABLE,
        where: { EXTRA_SERVICE_ID },
        limit: 1,
      },
      companyId,
    );

    if (!existingRows.length) {
      return res.status(404).json({ message: "Extra service not found" });
    }

    const updateData = {};

    if (EXTRA_SERVICE_NAME !== undefined) {
      updateData.EXTRA_SERVICE_NAME = EXTRA_SERVICE_NAME;
    }

    if (EXTRA_SERVICE_DESCRIPTION !== undefined) {
      updateData.EXTRA_SERVICE_DESCRIPTION = EXTRA_SERVICE_DESCRIPTION;
    }

    if (EXTRA_SERVICE_COST_PP !== undefined) {
      const cost = Number(EXTRA_SERVICE_COST_PP);
      if (Number.isNaN(cost)) {
        return res
          .status(400)
          .json({ message: "EXTRA_SERVICE_COST_PP must be a number" });
      }
      updateData.EXTRA_SERVICE_COST_PP = cost;
    }

    // Always track who updated and when
    if (Object.keys(updateData).length > 0) {
      const now = new Date();
      updateData.UPDATED_BY = userFromToken.USER_ID;
      updateData.UPDATED_ON = now;

      await dbService.update(
        EXTRA_SERVICES_TABLE,
        updateData,
        { EXTRA_SERVICE_ID },
        companyId,
      );
    }

    const updated = await dbService.find(
      {
        table: EXTRA_SERVICES_TABLE,
        where: { EXTRA_SERVICE_ID },
        fields: [
          "EXTRA_SERVICE_ID",
          "EXTRA_SERVICE_NAME",
          "EXTRA_SERVICE_DESCRIPTION",
          "EXTRA_SERVICE_COST_PP",
          "CREATED_BY",
          "UPDATED_BY",
          "CREATED_ON",
          "UPDATED_ON",
        ],
        limit: 1,
      },
      companyId,
    );

    return res.json({
      message: "Extra service updated",
      EXTRA_SERVICE: updated[0],
    });
  } catch (err) {
    console.error("updateExtraService error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/extra-services/:EXTRA_SERVICE_ID
 * Hard delete (no ACTIVE_STATUS column on this table)
 */
async function deleteExtraService(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const EXTRA_SERVICE_ID = parseInt(req.params.EXTRA_SERVICE_ID, 10);
    if (!EXTRA_SERVICE_ID || Number.isNaN(EXTRA_SERVICE_ID)) {
      return res.status(400).json({ message: "Invalid EXTRA_SERVICE_ID" });
    }

    // Ensure it exists before delete (optional but nicer errors)
    const existingRows = await dbService.find(
      {
        table: EXTRA_SERVICES_TABLE,
        where: { EXTRA_SERVICE_ID },
        limit: 1,
      },
      companyId,
    );

    if (!existingRows.length) {
      return res.status(404).json({ message: "Extra service not found" });
    }

    await dbService.remove(
      EXTRA_SERVICES_TABLE,
      { EXTRA_SERVICE_ID },
      companyId,
    );

    return res.json({ message: "Extra service deleted" });
  } catch (err) {
    console.error("deleteExtraService error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listExtraServices,
  getExtraServiceById,
  createExtraService,
  updateExtraService,
  deleteExtraService,
};
