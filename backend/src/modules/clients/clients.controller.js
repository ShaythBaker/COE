// src/modules/clients/clients.controller.js
const dbService = require("../../core/dbService");

const CLIENTS_TABLE = "COE_TBL_CLIENTS";
const CLIENTS_VIEW_LOOKUP = "COE_VIEW_CLIENTS_LOOKUP";

// Helper: get COMPANY_ID from JWT user or session (backend only)
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) return req.user.COMPANY_ID;
  if (req.session && req.session.COMPANY_ID) return req.session.COMPANY_ID;
  return null;
}

/**
 * GET /api/clients
 * Optional query: ?ACTIVE_STATUS=1
 */
async function listClients(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const { ACTIVE_STATUS } = req.query;
    const where = {};
    if (ACTIVE_STATUS !== undefined) {
      where.ACTIVE_STATUS = Number(ACTIVE_STATUS);
    }

    const clients = await dbService.find(
      {
        table: CLIENTS_TABLE,
        where,
        fields: [
          "CLIENT_ID",
          "CLIENT_NAME",
          "COUNTRY_ID",
          "EMAIL",
          "PHONE",
          "CLIENT_LOGO",
          "CONTACT_PERSON_NAME",
          "ACTIVE_STATUS",
          "COMPANY_ID",
          "CREATED_BY",
          "CREATED_ON",
          "UPDATED_BY",
          "UPDATED_ON",
        ],
        orderBy: "CREATED_ON DESC",
      },
      companyId
    );

    return res.json(clients);
  } catch (err) {
    console.error("listClients error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/clients/:CLIENT_ID
 */
async function getClientById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const CLIENT_ID = parseInt(req.params.CLIENT_ID, 10);
    if (!CLIENT_ID || Number.isNaN(CLIENT_ID)) {
      return res.status(400).json({ message: "Invalid CLIENT_ID" });
    }

    const clients = await dbService.find(
      {
        table: CLIENTS_VIEW_LOOKUP,
        where: { CLIENT_ID },
        limit: 1,
      },
      companyId
    );

    if (clients.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.json(clients[0]);
  } catch (err) {
    console.error("getClientById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/clients
 * BODY (UPPERCASE):
 * {
 *   "CLIENT_NAME": "ACME CORP",
 *   "COUNTRY_ID": 1,
 *   "EMAIL": "client@example.com",
 *   "PHONE": "00962...",
 *   "CLIENT_LOGO": 123,            // FILE_ID from COE_TBL_ATTACHMENTS
 *   "CONTACT_PERSON_NAME": "John",
 *   "ACTIVE_STATUS": 1
 * }
 */
async function createClient(req, res) {
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
      CLIENT_NAME,
      COUNTRY_ID,
      EMAIL,
      PHONE,
      CLIENT_LOGO,
      CONTACT_PERSON_NAME,
      ACTIVE_STATUS,
    } = req.body;

    if (!CLIENT_NAME) {
      return res.status(400).json({ message: "CLIENT_NAME is required" });
    }

    // Optional: uniqueness check by CLIENT_NAME within company
    const existing = await dbService.find(
      {
        table: CLIENTS_TABLE,
        where: { CLIENT_NAME },
        limit: 1,
      },
      companyId
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "CLIENT_NAME already exists" });
    }

    const now = new Date();

    const insertResult = await dbService.insert(
      CLIENTS_TABLE,
      {
        CLIENT_NAME,
        COUNTRY_ID: COUNTRY_ID || null,
        EMAIL: EMAIL || null,
        PHONE: PHONE || null,
        CLIENT_LOGO: CLIENT_LOGO || null,
        CONTACT_PERSON_NAME: CONTACT_PERSON_NAME || null,
        ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
        CREATED_BY: userFromToken.USER_ID,
        CREATED_ON: now,
        UPDATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
      },
      companyId
    );

    return res.status(201).json({
      message: "Client created",
      CLIENT_ID: insertResult.insertId,
    });
  } catch (err) {
    console.error("createClient error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/clients/:CLIENT_ID
 * BODY: any subset of:
 * {
 *   "CLIENT_NAME": "...",
 *   "COUNTRY_ID": ...,
 *   "EMAIL": "...",
 *   "PHONE": "...",
 *   "CLIENT_LOGO": ...,
 *   "CONTACT_PERSON_NAME": "...",
 *   "ACTIVE_STATUS": 0/1
 * }
 */
async function updateClient(req, res) {
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

    const CLIENT_ID = parseInt(req.params.CLIENT_ID, 10);
    if (!CLIENT_ID || Number.isNaN(CLIENT_ID)) {
      return res.status(400).json({ message: "Invalid CLIENT_ID" });
    }

    const {
      CLIENT_NAME,
      COUNTRY_ID,
      EMAIL,
      PHONE,
      CLIENT_LOGO,
      CONTACT_PERSON_NAME,
      ACTIVE_STATUS,
    } = req.body;

    // Ensure client exists (scoped by COMPANY_ID through dbService)
    const clients = await dbService.find(
      {
        table: CLIENTS_TABLE,
        where: { CLIENT_ID },
        limit: 1,
      },
      companyId
    );

    if (clients.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const updateData = {};
    if (CLIENT_NAME !== undefined) updateData.CLIENT_NAME = CLIENT_NAME;
    if (COUNTRY_ID !== undefined) updateData.COUNTRY_ID = COUNTRY_ID;
    if (EMAIL !== undefined) updateData.EMAIL = EMAIL;
    if (PHONE !== undefined) updateData.PHONE = PHONE;
    if (CLIENT_LOGO !== undefined) updateData.CLIENT_LOGO = CLIENT_LOGO;
    if (CONTACT_PERSON_NAME !== undefined)
      updateData.CONTACT_PERSON_NAME = CONTACT_PERSON_NAME;
    if (ACTIVE_STATUS !== undefined) updateData.ACTIVE_STATUS = ACTIVE_STATUS;

    if (Object.keys(updateData).length > 0) {
      const now = new Date();
      updateData.UPDATED_BY = userFromToken.USER_ID;
      updateData.UPDATED_ON = now;

      await dbService.update(
        CLIENTS_TABLE,
        updateData,
        { CLIENT_ID },
        companyId
      );
    }

    const updated = await dbService.find(
      {
        table: CLIENTS_TABLE,
        where: { CLIENT_ID },
        fields: [
          "CLIENT_ID",
          "CLIENT_NAME",
          "COUNTRY_ID",
          "EMAIL",
          "PHONE",
          "CLIENT_LOGO",
          "CONTACT_PERSON_NAME",
          "ACTIVE_STATUS",
          "COMPANY_ID",
          "CREATED_BY",
          "CREATED_ON",
          "UPDATED_BY",
          "UPDATED_ON",
        ],
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Client updated",
      CLIENT: updated[0],
    });
  } catch (err) {
    console.error("updateClient error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/clients/:CLIENT_ID
 * Soft delete: ACTIVE_STATUS = 0, update metadata
 */
async function deleteClient(req, res) {
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

    const CLIENT_ID = parseInt(req.params.CLIENT_ID, 10);
    if (!CLIENT_ID || Number.isNaN(CLIENT_ID)) {
      return res.status(400).json({ message: "Invalid CLIENT_ID" });
    }

    const clients = await dbService.find(
      {
        table: CLIENTS_TABLE,
        where: { CLIENT_ID },
        limit: 1,
      },
      companyId
    );

    if (clients.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const now = new Date();

    await dbService.update(
      CLIENTS_TABLE,
      {
        ACTIVE_STATUS: 0,
        UPDATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
      },
      { CLIENT_ID },
      companyId
    );

    return res.json({ message: "Client deleted (soft)", CLIENT_ID });
  } catch (err) {
    console.error("deleteClient error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
