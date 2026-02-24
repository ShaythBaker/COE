// modules/flights/quotationStep3.controller.js

const dbService = require("../../core/dbService");

const EXTRA_SERVICES_TABLE = "COE_TBL_QOUTATION_EXTRA_SERVICES";
const EXTRA_SERVICES_VIEW = "COE_VIEW_QOUTATION_EXTRA_SERVICES_LOOKUP";

// Helper: get COMPANY_ID from backend (JWT user or session ONLY)
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
 * GET /api/flights/quotations/:QOUTATION_ID/extra-services
 * Optional query: ?ROUTE_ID=...
 *
 * Data is read from the VIEW:
 *   COE_VIEW_QOUTATION_EXTRA_SERVICES_LOOKUP
 */
async function listQuotationExtraServices(req, res) {
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

    const where = { QOUTATION_ID };

    if (req.query.ROUTE_ID !== undefined) {
      const ROUTE_ID = parseInt(req.query.ROUTE_ID, 10);
      if (!ROUTE_ID || Number.isNaN(ROUTE_ID)) {
        return res.status(400).json({ message: "Invalid ROUTE_ID" });
      }
      where.ROUTE_ID = ROUTE_ID;
    }

    const rows = await dbService.find(
      {
        table: EXTRA_SERVICES_VIEW,
        where,
        fields: [
          "QOUTATION_EXTRA_SERVICE_ID",
          "EXTRA_SERVICE_ID",
          "EXTRA_SERVICE_NAME",
          "EXTRA_SERVICE_DESCRIPTION",
          "EXTRA_SERVICE_COST_PP",
          "QOUTATION_ID",
          "ROUTE_ID",
          "COMPANY_ID",
          "CREATED_ON",
          "UPDATED_ON",
          "CREATED_BY",
          "UPDATED_BY",
        ],
        orderBy: "QOUTATION_EXTRA_SERVICE_ID ASC",
      },
      companyId,
    );

    return res.json(rows);
  } catch (err) {
    console.error("listQuotationExtraServices error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/flights/quotations/:QOUTATION_ID/extra-services
 *
 * BODY (UPPERCASE):
 * {
 *   "EXTRA_SERVICE_ID": 1,
 *   "EXTRA_SERVICE_COST_PP": 10.5,
 *   "ROUTE_ID": 123
 * }
 *
 * Writes to TABLE:
 *   COE_TBL_QOUTATION_EXTRA_SERVICES
 */
async function createQuotationExtraService(req, res) {
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

    const { EXTRA_SERVICE_ID, EXTRA_SERVICE_COST_PP, ROUTE_ID } = req.body;

    if (!EXTRA_SERVICE_ID) {
      return res.status(400).json({ message: "EXTRA_SERVICE_ID is required" });
    }

    // if (!ROUTE_ID) {
    //   return res.status(400).json({ message: "ROUTE_ID is required" });
    // }

    // const parsedRouteId = parseInt(ROUTE_ID, 10);
    // if (!parsedRouteId || Number.isNaN(parsedRouteId)) {
    //   return res.status(400).json({ message: "Invalid ROUTE_ID" });
    // }

    const now = new Date();

    // Insert into TABLE, dbService will inject COMPANY_ID
    const insertResult = await dbService.insert(
      EXTRA_SERVICES_TABLE,
      {
        EXTRA_SERVICE_ID,
        EXTRA_SERVICE_COST_PP:
          EXTRA_SERVICE_COST_PP !== undefined
            ? Number(EXTRA_SERVICE_COST_PP)
            : 0,
        QOUTATION_ID,
        //ROUTE_ID: parsedRouteId,
        CREATED_ON: now,
        UPDATED_ON: now,
        CREATED_BY: userFromToken.USER_ID,
        UPDATED_BY: userFromToken.USER_ID,
      },
      companyId,
    );

    const QOUTATION_EXTRA_SERVICE_ID = insertResult.insertId;

    // Re-read from VIEW so frontend gets NAME/DESCRIPTION etc
    const rows = await dbService.find(
      {
        table: EXTRA_SERVICES_VIEW,
        where: { QOUTATION_EXTRA_SERVICE_ID },
        limit: 1,
      },
      companyId,
    );

    return res.status(201).json({
      message: "Quotation extra service created",
      QOUTATION_EXTRA_SERVICE_ID,
      EXTRA_SERVICE: rows[0] || null,
    });
  } catch (err) {
    console.error("createQuotationExtraService error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/flights/quotations/extra-services/:QOUTATION_EXTRA_SERVICE_ID
 *
 * BODY (any subset):
 * {
 *   "EXTRA_SERVICE_ID": 1,
 *   "EXTRA_SERVICE_COST_PP": 15,
 *   "ROUTE_ID": 123
 * }
 *
 * Updates TABLE:
 *   COE_TBL_QOUTATION_EXTRA_SERVICES
 */
async function updateQuotationExtraService(req, res) {
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

    const QOUTATION_EXTRA_SERVICE_ID = parseInt(
      req.params.QOUTATION_EXTRA_SERVICE_ID,
      10,
    );
    if (
      !QOUTATION_EXTRA_SERVICE_ID ||
      Number.isNaN(QOUTATION_EXTRA_SERVICE_ID)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid QOUTATION_EXTRA_SERVICE_ID" });
    }

    const { EXTRA_SERVICE_ID, EXTRA_SERVICE_COST_PP } = req.body;

    // Ensure row exists (scoped by COMPANY_ID)
    const existing = await dbService.find(
      {
        table: EXTRA_SERVICES_TABLE,
        where: { QOUTATION_EXTRA_SERVICE_ID },
        limit: 1,
      },
      companyId,
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ message: "Quotation extra service not found" });
    }

    const updateData = {};
    if (EXTRA_SERVICE_ID !== undefined) {
      updateData.EXTRA_SERVICE_ID = EXTRA_SERVICE_ID;
    }
    if (EXTRA_SERVICE_COST_PP !== undefined) {
      updateData.EXTRA_SERVICE_COST_PP = Number(EXTRA_SERVICE_COST_PP);
    }
    // if (ROUTE_ID !== undefined) {
    //   const parsedRoute = parseInt(ROUTE_ID, 10);
    //   if (!parsedRoute || Number.isNaN(parsedRoute)) {
    //     return res.status(400).json({ message: "Invalid ROUTE_ID" });
    //   }
    //   updateData.ROUTE_ID = parsedRoute;
    // }

    const now = new Date();
    updateData.UPDATED_ON = now;
    updateData.UPDATED_BY = userFromToken.USER_ID;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(
        EXTRA_SERVICES_TABLE,
        updateData,
        { QOUTATION_EXTRA_SERVICE_ID },
        companyId,
      );
    }

    const rows = await dbService.find(
      {
        table: EXTRA_SERVICES_VIEW,
        where: { QOUTATION_EXTRA_SERVICE_ID },
        limit: 1,
      },
      companyId,
    );

    return res.json({
      message: "Quotation extra service updated",
      EXTRA_SERVICE: rows[0] || null,
    });
  } catch (err) {
    console.error("updateQuotationExtraService error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/flights/quotations/extra-services/:QOUTATION_EXTRA_SERVICE_ID
 *
 * Hard delete from TABLE:
 *   COE_TBL_QOUTATION_EXTRA_SERVICES
 * (there is no ACTIVE_STATUS column to soft-delete here)
 */
async function deleteQuotationExtraService(req, res) {
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

    const QOUTATION_EXTRA_SERVICE_ID = parseInt(
      req.params.QOUTATION_EXTRA_SERVICE_ID,
      10,
    );
    if (
      !QOUTATION_EXTRA_SERVICE_ID ||
      Number.isNaN(QOUTATION_EXTRA_SERVICE_ID)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid QOUTATION_EXTRA_SERVICE_ID" });
    }

    // Check existence first (scoped by COMPANY_ID)
    const existing = await dbService.find(
      {
        table: EXTRA_SERVICES_TABLE,
        where: { QOUTATION_EXTRA_SERVICE_ID },
        limit: 1,
      },
      companyId,
    );

    if (existing.length === 0) {
      return res
        .status(404)
        .json({ message: "Quotation extra service not found" });
    }

    await dbService.remove(
      EXTRA_SERVICES_TABLE,
      { QOUTATION_EXTRA_SERVICE_ID },
      companyId,
    );

    return res.json({ message: "Quotation extra service deleted" });
  } catch (err) {
    console.error("deleteQuotationExtraService error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listQuotationExtraServices,
  createQuotationExtraService,
  updateQuotationExtraService,
  deleteQuotationExtraService,
};
