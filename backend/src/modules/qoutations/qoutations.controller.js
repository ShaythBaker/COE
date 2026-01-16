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
 *
 * Steps:
 * 1) Insert into COE_TBL_QOUTATIONS
 * 2) Fetch inserted qoutation row
 * 3) Fetch client data from COE_VIEW_CLIENTS_LOOKUP
 * 4) Fetch transportation rates from COE_VIEW_TRANSPORTATION_FEES_LOOKUP
 * 5) Calculate days & nights based on arriving/departuring dates
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
      return res
        .status(400)
        .json({
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
          // View column is spelled ACTIVE_STATSUS in your description
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

module.exports = {
  createQoutation,
};
