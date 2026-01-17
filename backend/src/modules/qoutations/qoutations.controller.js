// src/modules/qoutations/qoutations.controller.js
const dbService = require("../../core/dbService");

const QOUTATIONS_TABLE = "COE_TBL_QOUTATIONS";
const CLIENTS_VIEW = "COE_VIEW_CLIENTS_LOOKUP";
const TRANSPORTATION_FEES_VIEW = "COE_VIEW_TRANSPORTATION_FEES_LOOKUP";

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

/**
 * POST /api/qoutations
 *
 * BODY:
 * {
 *   "CLIENT_ID": "",
 *   "ARRIVING_DATE": "",
 *   "DEPARTURING_DATE": "",
 *   "TRANSPORTATION_COMPANY_ID": "",
 *   "GROUP_NAME": ""
 * }
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
      CLIENT_ID,
      ARRIVING_DATE,
      DEPARTURING_DATE,
      TRANSPORTATION_COMPANY_ID,
      GROUP_NAME,
    } = req.body;

    // Basic validation
    if (
      !CLIENT_ID ||
      !ARRIVING_DATE ||
      !DEPARTURING_DATE ||
      !TRANSPORTATION_COMPANY_ID
    ) {
      return res.status(400).json({
        message:
          "CLIENT_ID, ARRIVING_DATE, DEPARTURING_DATE and TRANSPORTATION_COMPANY_ID are required",
      });
    }

    const arriving = new Date(ARRIVING_DATE);
    const departing = new Date(DEPARTURING_DATE);

    if (isNaN(arriving.getTime()) || isNaN(departing.getTime())) {
      return res.status(400).json({
        message: "ARRIVING_DATE and DEPARTURING_DATE must be valid dates",
      });
    }

    // 1) Insert into COE_TBL_QOUTATIONS
    const now = new Date();
    const insertResult = await dbService.insert(
      QOUTATIONS_TABLE,
      {
        QOUTATION_CLIENT_ID: CLIENT_ID,
        QOUTATION_TRANSPORTATION_COMPANY_ID: TRANSPORTATION_COMPANY_ID,
        QOUTATION_GROUP_NAME: GROUP_NAME || null,
        QOUTATION_ARRIVING_DATE: ARRIVING_DATE,
        QOUTATION_DEPARTURING_DATE: DEPARTURING_DATE,
        CREATED_ON: now,
        CREATED_BY: userFromToken.USER_ID,
        ACTIVE_STATUS: 1,
      },
      companyId
    );

    const QOUTATION_ID = insertResult.insertId;

    // 2) Get the inserted qoutation
    const qoutationRows = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: { QOUTATION_ID },
        fields: [
          "QOUTATION_ID",
          "QOUTATION_CLIENT_ID",
          "QOUTATION_TRANSPORTATION_COMPANY_ID",
          "QOUTATION_GROUP_NAME",
          "QOUTATION_ARRIVING_DATE",
          "QOUTATION_DEPARTURING_DATE",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "ACTIVE_STATUS",
        ],
        limit: 1,
      },
      companyId
    );

    if (!qoutationRows.length) {
      return res.status(500).json({
        message: "Qoutation inserted but could not be retrieved",
      });
    }

    const qoutation = qoutationRows[0];

    // 3) Get the client data from COE_VIEW_CLIENTS_LOOKUP
    const clientRows = await dbService.find(
      {
        table: CLIENTS_VIEW,
        where: { CLIENT_ID },
        fields: [
          "CLIENT_ID",
          "CLIENT_NAME",
          "EMAIL",
          "PHONE",
          "CLIENT_LOGO",
          "CONTACT_PERSON_NAME",
          "ACTIVE_STATUS",
          "COMPANY_ID",
          "COUNTRY_ID",
          "COUNTRY_NAME",
          "CREATED_BY",
          "CREATED_BY_NAME",
          "CREATED_ON",
          "UPDATED_BY",
          "UPDATED_BY_NAME",
          "UPDATED_ON",
        ],
        limit: 1,
      },
      companyId
    );

    const client = clientRows.length ? clientRows[0] : null;

    // 4) Get the rates for the transportation company
    const transportationFees = await dbService.find(
      {
        table: TRANSPORTATION_FEES_VIEW,
        where: {
          TRANSPORTATION_FEE_COMPANY_ID: TRANSPORTATION_COMPANY_ID,
          // View column is spelled ACTIVE_STATSUS
          ACTIVE_STATSUS: 1,
        },
        fields: [
          "TRANSPORTATION_FEE_ID",
          "TRANSPORTATION_FEE_COMPANY_ID",
          "TRANSPORTATION_COMPANY_NAME",
          "TRANSPORTATION_FEE_VECHLE_TYPE",
          "VEHICLE_TYPE_NAME",
          "TRANSPORTATION_FEE_TYPE",
          "TRANSPORTATION_FEE_TYPE_NAME",
          "TRANSPORTATION_FEE_AMOUNT",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "ACTIVE_STATSUS",
        ],
        orderBy: "TRANSPORTATION_FEE_VECHLE_TYPE ASC",
      },
      companyId
    );

    // 5) Calculate days & nights of stay
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffMs = departing - arriving;

    let nights = 0;
    let days = 0;

    if (diffMs > 0) {
      nights = Math.round(diffMs / msPerDay);
      days = nights + 1;
    }

    return res.status(201).json({
      message: "Qoutation created",
      QOUTATION: qoutation,
      CLIENT: client,
      TRANSPORTATION_FEES: transportationFees,
      STAY: {
        ARRIVING_DATE,
        DEPARTURING_DATE,
        days,
        nights,
      },
    });
  } catch (err) {
    console.error("createQoutation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/qoutations/:QOUTATION_ID
 *
 * BODY: any subset of
 * {
 *   "CLIENT_ID": "",
 *   "ARRIVING_DATE": "",
 *   "DEPARTURING_DATE": "",
 *   "TRANSPORTATION_COMPANY_ID": "",
 *   "GROUP_NAME": "",
 *   "ACTIVE_STATUS": 0/1   // optional
 * }
 *
 * Returns same structure as createQoutation
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

    // 1) Ensure qoutation exists (scoped by COMPANY_ID)
    const existingRows = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId
    );

    if (!existingRows.length) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    const existing = existingRows[0];

    const {
      CLIENT_ID,
      ARRIVING_DATE,
      DEPARTURING_DATE,
      TRANSPORTATION_COMPANY_ID,
      GROUP_NAME,
      ACTIVE_STATUS,
    } = req.body;

    const updateData = {};

    if (CLIENT_ID !== undefined) {
      updateData.QOUTATION_CLIENT_ID = CLIENT_ID;
    }

    let arrivingDateToUse = existing.QOUTATION_ARRIVING_DATE;
    let departuringDateToUse = existing.QOUTATION_DEPARTURING_DATE;

    if (ARRIVING_DATE !== undefined) {
      const arriving = new Date(ARRIVING_DATE);
      if (isNaN(arriving.getTime())) {
        return res
          .status(400)
          .json({ message: "ARRIVING_DATE must be a valid date" });
      }
      updateData.QOUTATION_ARRIVING_DATE = ARRIVING_DATE;
      arrivingDateToUse = ARRIVING_DATE;
    }

    if (DEPARTURING_DATE !== undefined) {
      const departing = new Date(DEPARTURING_DATE);
      if (isNaN(departing.getTime())) {
        return res
          .status(400)
          .json({ message: "DEPARTURING_DATE must be a valid date" });
      }
      updateData.QOUTATION_DEPARTURING_DATE = DEPARTURING_DATE;
      departuringDateToUse = DEPARTURING_DATE;
    }

    if (TRANSPORTATION_COMPANY_ID !== undefined) {
      updateData.QOUTATION_TRANSPORTATION_COMPANY_ID =
        TRANSPORTATION_COMPANY_ID;
    }

    if (GROUP_NAME !== undefined) {
      updateData.QOUTATION_GROUP_NAME = GROUP_NAME || null;
    }

    if (ACTIVE_STATUS !== undefined) {
      updateData.ACTIVE_STATUS = ACTIVE_STATUS;
    }

    // Metadata
    const now = new Date();
    updateData.UPDATED_ON = now;
    updateData.UPDATED_BY = userFromToken.USER_ID;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(
        QOUTATIONS_TABLE,
        updateData,
        { QOUTATION_ID },
        companyId
      );
    }

    // Re-fetch updated qoutation
    const updatedRows = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: { QOUTATION_ID },
        fields: [
          "QOUTATION_ID",
          "QOUTATION_CLIENT_ID",
          "QOUTATION_TRANSPORTATION_COMPANY_ID",
          "QOUTATION_GROUP_NAME",
          "QOUTATION_ARRIVING_DATE",
          "QOUTATION_DEPARTURING_DATE",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "ACTIVE_STATUS",
        ],
        limit: 1,
      },
      companyId
    );

    const qoutation = updatedRows[0];

    const finalClientId = qoutation.QOUTATION_CLIENT_ID;
    const finalTransportationCompanyId =
      qoutation.QOUTATION_TRANSPORTATION_COMPANY_ID;

    // Fetch client
    const clientRows = await dbService.find(
      {
        table: CLIENTS_VIEW,
        where: { CLIENT_ID: finalClientId },
        fields: [
          "CLIENT_ID",
          "CLIENT_NAME",
          "EMAIL",
          "PHONE",
          "CLIENT_LOGO",
          "CONTACT_PERSON_NAME",
          "ACTIVE_STATUS",
          "COMPANY_ID",
          "COUNTRY_ID",
          "COUNTRY_NAME",
          "CREATED_BY",
          "CREATED_BY_NAME",
          "CREATED_ON",
          "UPDATED_BY",
          "UPDATED_BY_NAME",
          "UPDATED_ON",
        ],
        limit: 1,
      },
      companyId
    );

    const client = clientRows.length ? clientRows[0] : null;

    // Fetch transportation fees for final company
    const transportationFees = await dbService.find(
      {
        table: TRANSPORTATION_FEES_VIEW,
        where: {
          TRANSPORTATION_FEE_COMPANY_ID: finalTransportationCompanyId,
          ACTIVE_STATSUS: 1,
        },
        fields: [
          "TRANSPORTATION_FEE_ID",
          "TRANSPORTATION_FEE_COMPANY_ID",
          "TRANSPORTATION_COMPANY_NAME",
          "TRANSPORTATION_FEE_VECHLE_TYPE",
          "VEHICLE_TYPE_NAME",
          "TRANSPORTATION_FEE_TYPE",
          "TRANSPORTATION_FEE_TYPE_NAME",
          "TRANSPORTATION_FEE_AMOUNT",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "ACTIVE_STATSUS",
        ],
        orderBy: "TRANSPORTATION_FEE_VECHLE_TYPE ASC",
      },
      companyId
    );

    // Recalculate stay using (possibly) updated dates
    const arriving = new Date(qoutation.QOUTATION_ARRIVING_DATE || arrivingDateToUse);
    const departing = new Date(
      qoutation.QOUTATION_DEPARTURING_DATE || departuringDateToUse
    );

    let nights = 0;
    let days = 0;

    if (!isNaN(arriving.getTime()) && !isNaN(departing.getTime())) {
      const diffMs = departing - arriving;
      if (diffMs > 0) {
        const msPerDay = 24 * 60 * 60 * 1000;
        nights = Math.round(diffMs / msPerDay);
        days = nights + 1;
      }
    }

    return res.json({
      message: "Qoutation updated",
      QOUTATION: qoutation,
      CLIENT: client,
      TRANSPORTATION_FEES: transportationFees,
      STAY: {
        ARRIVING_DATE: qoutation.QOUTATION_ARRIVING_DATE,
        DEPARTURING_DATE: qoutation.QOUTATION_DEPARTURING_DATE,
        days,
        nights,
      },
    });
  } catch (err) {
    console.error("updateQoutation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PATCH /api/qoutations/:QOUTATION_ID/deactivate
 * or   DELETE /api/qoutations/:QOUTATION_ID  (if you prefer soft delete)
 *
 * Sets ACTIVE_STATUS = 0
 */
async function deactivateQoutation(req, res) {
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

    // Ensure it exists
    const existingRows = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId
    );

    if (!existingRows.length) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    const now = new Date();

    await dbService.update(
      QOUTATIONS_TABLE,
      {
        ACTIVE_STATUS: 0,
        UPDATED_ON: now,
        UPDATED_BY: userFromToken.USER_ID,
      },
      { QOUTATION_ID },
      companyId
    );

    const updatedRows = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: { QOUTATION_ID },
        fields: [
          "QOUTATION_ID",
          "QOUTATION_CLIENT_ID",
          "QOUTATION_TRANSPORTATION_COMPANY_ID",
          "QOUTATION_GROUP_NAME",
          "QOUTATION_ARRIVING_DATE",
          "QOUTATION_DEPARTURING_DATE",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "ACTIVE_STATUS",
        ],
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Qoutation deactivated",
      QOUTATION: updatedRows[0],
    });
  } catch (err) {
    console.error("deactivateQoutation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/qoutations/transportation-fees/:TRANSPORTATION_COMPANY_ID
 *
 * Returns transportation fees for a given TRANSPORTATION_FEE_COMPANY_ID
 * from COE_VIEW_TRANSPORTATION_FEES_LOOKUP, scoped by COMPANY_ID.
 */
async function getTransportationFeesByCompany(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const TRANSPORTATION_COMPANY_ID = parseInt(
      req.params.TRANSPORTATION_COMPANY_ID,
      10
    );

    if (
      !TRANSPORTATION_COMPANY_ID ||
      Number.isNaN(TRANSPORTATION_COMPANY_ID)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_COMPANY_ID" });
    }

    const fees = await dbService.find(
      {
        table: TRANSPORTATION_FEES_VIEW,
        where: {
          TRANSPORTATION_FEE_COMPANY_ID: TRANSPORTATION_COMPANY_ID,
          // if you only want active:
          ACTIVE_STATSUS: 1,
        },
        fields: [
          "TRANSPORTATION_FEE_ID",
          "TRANSPORTATION_FEE_COMPANY_ID",
          "TRANSPORTATION_COMPANY_NAME",
          "TRANSPORTATION_FEE_VECHLE_TYPE",
          "VEHICLE_TYPE_NAME",
          "TRANSPORTATION_FEE_TYPE",
          "TRANSPORTATION_FEE_TYPE_NAME",
          "TRANSPORTATION_FEE_AMOUNT",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "ACTIVE_STATSUS",
        ],
        orderBy: "TRANSPORTATION_FEE_VECHLE_TYPE ASC",
      },
      companyId
    );

    return res.json({
      TRANSPORTATION_COMPANY_ID,
      TRANSPORTATION_FEES: fees,
    });
  } catch (err) {
    console.error("getTransportationFeesByCompany error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createQoutation,
  updateQoutation,
  deactivateQoutation,
  getTransportationFeesByCompany,
};
