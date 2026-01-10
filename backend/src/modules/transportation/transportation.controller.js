// src/modules/transportation/transportation.controller.js
const dbService = require("../../core/dbService");

const TRANSPORTATION_COMPANIES_TABLE = "COE_TBL_TRANSPORTATION";
const TRANSPORTATION_CONTRACTS_TABLE = "COE_TBL_TRANSPORTATION_CONTRACTS";
const TRANSPORTATION_FLEET_TABLE = "COE_TBL_TRANSPORTATION_FLEET";

// Helper: get COMPANY_ID from backend (JWT user or session)
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
 * ========= TRANSPORTATION COMPANIES =========
 *
 * Columns (COE_TBL_TRANSPORTATION):
 *  TRANSPORTATION_COMPANY_ID
 *  TRANSPORTATION_COMPANY_NAME
 *  TRANSPORTATION_PHONE
 *  TRANSPORTATION_COMPANY_EMAIL
 *  TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME
 *  TRANSPORTATION_COMPANY_LOGO
 *  TRANSPORTATION_COMPANY_ACTIVE_STATUS
 *  COMPANY_ID
 *  CREATED_BY
 *  CREATED_ON
 *  UPDATED_ON
 *  UPDATED_BY
 */

/**
 * GET /api/transportation/companies
 * Optional query: ?ACTIVE_STATUS=1
 */
async function listTransportationCompanies(req, res) {
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
      where.TRANSPORTATION_COMPANY_ACTIVE_STATUS = Number(ACTIVE_STATUS);
    }

    const rows = await dbService.find(
      {
        table: TRANSPORTATION_COMPANIES_TABLE,
        where,
        fields: [
          "TRANSPORTATION_COMPANY_ID",
          "TRANSPORTATION_COMPANY_NAME",
          "TRANSPORTATION_PHONE",
          "TRANSPORTATION_COMPANY_EMAIL",
          "TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME",
          "TRANSPORTATION_COMPANY_LOGO",
          "TRANSPORTATION_COMPANY_ACTIVE_STATUS",
          "COMPANY_ID",
          "CREATED_BY",
          "CREATED_ON",
          "UPDATED_ON",
          "UPDATED_BY",
        ],
        orderBy: "TRANSPORTATION_COMPANY_NAME ASC",
      },
      companyId
    );

    return res.json(rows);
  } catch (err) {
    console.error("listTransportationCompanies error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/transportation/companies
 * BODY:
 * {
 *   "TRANSPORTATION_COMPANY_NAME": "...",  // required
 *   "TRANSPORTATION_PHONE": "...",
 *   "TRANSPORTATION_COMPANY_EMAIL": "...",
 *   "TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME": "...",
 *   "TRANSPORTATION_COMPANY_LOGO": "...",
 *   "TRANSPORTATION_COMPANY_ACTIVE_STATUS": 0/1
 * }
 */
async function createTransportationCompany(req, res) {
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
      TRANSPORTATION_COMPANY_NAME,
      TRANSPORTATION_PHONE,
      TRANSPORTATION_COMPANY_EMAIL,
      TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME,
      TRANSPORTATION_COMPANY_LOGO,
      TRANSPORTATION_COMPANY_ACTIVE_STATUS,
    } = req.body;

    if (!TRANSPORTATION_COMPANY_NAME) {
      return res
        .status(400)
        .json({ message: "TRANSPORTATION_COMPANY_NAME is required" });
    }

    const now = new Date();

    const result = await dbService.insert(
      TRANSPORTATION_COMPANIES_TABLE,
      {
        TRANSPORTATION_COMPANY_NAME,
        TRANSPORTATION_PHONE: TRANSPORTATION_PHONE || null,
        TRANSPORTATION_COMPANY_EMAIL: TRANSPORTATION_COMPANY_EMAIL || null,
        TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME:
          TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME || null,
        TRANSPORTATION_COMPANY_LOGO: TRANSPORTATION_COMPANY_LOGO || null,
        TRANSPORTATION_COMPANY_ACTIVE_STATUS:
          TRANSPORTATION_COMPANY_ACTIVE_STATUS ?? 1,
        CREATED_BY: userFromToken.USER_ID,
        CREATED_ON: now,
      },
      companyId
    );

    return res.status(201).json({
      message: "Transportation company created",
      TRANSPORTATION_COMPANY_ID: result.insertId,
    });
  } catch (err) {
    console.error("createTransportationCompany error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/transportation/companies/:TRANSPORTATION_COMPANY_ID
 */
async function getTransportationCompanyById(req, res) {
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

    if (!TRANSPORTATION_COMPANY_ID || Number.isNaN(TRANSPORTATION_COMPANY_ID)) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_COMPANY_ID" });
    }

    const rows = await dbService.find(
      {
        table: TRANSPORTATION_COMPANIES_TABLE,
        where: { TRANSPORTATION_COMPANY_ID },
        fields: [
          "TRANSPORTATION_COMPANY_ID",
          "TRANSPORTATION_COMPANY_NAME",
          "TRANSPORTATION_PHONE",
          "TRANSPORTATION_COMPANY_EMAIL",
          "TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME",
          "TRANSPORTATION_COMPANY_LOGO",
          "TRANSPORTATION_COMPANY_ACTIVE_STATUS",
          "COMPANY_ID",
          "CREATED_BY",
          "CREATED_ON",
          "UPDATED_ON",
          "UPDATED_BY",
        ],
        limit: 1,
      },
      companyId
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ message: "Transportation company not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getTransportationCompanyById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/transportation/companies/:TRANSPORTATION_COMPANY_ID
 * BODY: any subset of the company columns
 */
async function updateTransportationCompany(req, res) {
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

    const TRANSPORTATION_COMPANY_ID = parseInt(
      req.params.TRANSPORTATION_COMPANY_ID,
      10
    );

    if (!TRANSPORTATION_COMPANY_ID || Number.isNaN(TRANSPORTATION_COMPANY_ID)) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_COMPANY_ID" });
    }

    const existing = await dbService.find(
      {
        table: TRANSPORTATION_COMPANIES_TABLE,
        where: { TRANSPORTATION_COMPANY_ID },
        limit: 1,
      },
      companyId
    );

    if (!existing.length) {
      return res
        .status(404)
        .json({ message: "Transportation company not found" });
    }

    const {
      TRANSPORTATION_COMPANY_NAME,
      TRANSPORTATION_PHONE,
      TRANSPORTATION_COMPANY_EMAIL,
      TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME,
      TRANSPORTATION_COMPANY_LOGO,
      TRANSPORTATION_COMPANY_ACTIVE_STATUS,
    } = req.body;

    const updateData = {};
    if (TRANSPORTATION_COMPANY_NAME !== undefined) {
      updateData.TRANSPORTATION_COMPANY_NAME = TRANSPORTATION_COMPANY_NAME;
    }
    if (TRANSPORTATION_PHONE !== undefined) {
      updateData.TRANSPORTATION_PHONE = TRANSPORTATION_PHONE;
    }
    if (TRANSPORTATION_COMPANY_EMAIL !== undefined) {
      updateData.TRANSPORTATION_COMPANY_EMAIL = TRANSPORTATION_COMPANY_EMAIL;
    }
    if (TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME !== undefined) {
      updateData.TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME =
        TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME;
    }
    if (TRANSPORTATION_COMPANY_LOGO !== undefined) {
      updateData.TRANSPORTATION_COMPANY_LOGO = TRANSPORTATION_COMPANY_LOGO;
    }
    if (TRANSPORTATION_COMPANY_ACTIVE_STATUS !== undefined) {
      updateData.TRANSPORTATION_COMPANY_ACTIVE_STATUS =
        TRANSPORTATION_COMPANY_ACTIVE_STATUS;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.UPDATED_BY = userFromToken.USER_ID;
      updateData.UPDATED_ON = new Date();

      await dbService.update(
        TRANSPORTATION_COMPANIES_TABLE,
        updateData,
        { TRANSPORTATION_COMPANY_ID },
        companyId
      );
    }

    const updated = await dbService.find(
      {
        table: TRANSPORTATION_COMPANIES_TABLE,
        where: { TRANSPORTATION_COMPANY_ID },
        fields: [
          "TRANSPORTATION_COMPANY_ID",
          "TRANSPORTATION_COMPANY_NAME",
          "TRANSPORTATION_PHONE",
          "TRANSPORTATION_COMPANY_EMAIL",
          "TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME",
          "TRANSPORTATION_COMPANY_LOGO",
          "TRANSPORTATION_COMPANY_ACTIVE_STATUS",
          "COMPANY_ID",
          "CREATED_BY",
          "CREATED_ON",
          "UPDATED_ON",
          "UPDATED_BY",
        ],
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Transportation company updated",
      COMPANY: updated[0],
    });
  } catch (err) {
    console.error("updateTransportationCompany error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/transportation/companies/:TRANSPORTATION_COMPANY_ID
 * Soft delete => TRANSPORTATION_COMPANY_ACTIVE_STATUS = 0
 */
async function deleteTransportationCompany(req, res) {
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

    const TRANSPORTATION_COMPANY_ID = parseInt(
      req.params.TRANSPORTATION_COMPANY_ID,
      10
    );

    if (!TRANSPORTATION_COMPANY_ID || Number.isNaN(TRANSPORTATION_COMPANY_ID)) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_COMPANY_ID" });
    }

    const existing = await dbService.find(
      {
        table: TRANSPORTATION_COMPANIES_TABLE,
        where: { TRANSPORTATION_COMPANY_ID },
        limit: 1,
      },
      companyId
    );

    if (!existing.length) {
      return res
        .status(404)
        .json({ message: "Transportation company not found" });
    }

    const now = new Date();

    await dbService.update(
      TRANSPORTATION_COMPANIES_TABLE,
      {
        TRANSPORTATION_COMPANY_ACTIVE_STATUS: 0,
        UPDATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
      },
      { TRANSPORTATION_COMPANY_ID },
      companyId
    );

    return res.json({ message: "Transportation company deactivated" });
  } catch (err) {
    console.error("deleteTransportationCompany error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * ========= TRANSPORTATION CONTRACTS =========
 *
 * Columns (COE_TBL_TRANSPORTATION_CONTRACTS):
 *  TRANSPORTATION_CONTRACT_ID
 *  TRANSPORTATION_CONTRACT_COMPANY_ID  (FK -> TRANSPORTATION_COMPANY_ID)
 *  TRANSPORTATION_CONTRACT_ATTACHMENT  (likely FILE_ID)
 *  TRANSPORTATION_CONTRACT_START_DATE
 *  TRANSPORTATION_CONTRACT_END_DATE
 *  COMPANY_ID
 *  CREATED_ON
 *  CRAETED_BY   (note spelling in DB)
 *  UPDATED_ON
 *  UPDATED_BY
 */

/**
 * GET /api/transportation/companies/:TRANSPORTATION_COMPANY_ID/contracts
 */
async function listContractsForCompany(req, res) {
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

    if (!TRANSPORTATION_COMPANY_ID || Number.isNaN(TRANSPORTATION_COMPANY_ID)) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_COMPANY_ID" });
    }

    // Ensure the transportation company exists & belongs to this COMPANY_ID
    const companies = await dbService.find(
      {
        table: TRANSPORTATION_COMPANIES_TABLE,
        where: { TRANSPORTATION_COMPANY_ID },
        limit: 1,
      },
      companyId
    );

    if (!companies.length) {
      return res
        .status(404)
        .json({ message: "Transportation company not found" });
    }

    const rows = await dbService.find(
      {
        table: TRANSPORTATION_CONTRACTS_TABLE,
        where: {
          TRANSPORTATION_CONTRACT_COMPANY_ID: TRANSPORTATION_COMPANY_ID,
        },
        fields: [
          "TRANSPORTATION_CONTRACT_ID",
          "TRANSPORTATION_CONTRACT_COMPANY_ID",
          "TRANSPORTATION_CONTRACT_ATTACHMENT",
          "TRANSPORTATION_CONTRACT_START_DATE",
          "TRANSPORTATION_CONTRACT_END_DATE",
          "COMPANY_ID",
          "CREATED_ON",
          "CRAETED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
        ],
        orderBy: "TRANSPORTATION_CONTRACT_START_DATE DESC",
      },
      companyId
    );

    return res.json(rows);
  } catch (err) {
    console.error("listContractsForCompany error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/transportation/companies/:TRANSPORTATION_COMPANY_ID/contracts
 * BODY:
 * {
 *   "TRANSPORTATION_CONTRACT_ATTACHMENT": <FILE_ID | null>,
 *   "TRANSPORTATION_CONTRACT_START_DATE": "YYYY-MM-DD",
 *   "TRANSPORTATION_CONTRACT_END_DATE": "YYYY-MM-DD" | null
 * }
 */
async function createContractForCompany(req, res) {
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

    const TRANSPORTATION_COMPANY_ID = parseInt(
      req.params.TRANSPORTATION_COMPANY_ID,
      10
    );

    if (!TRANSPORTATION_COMPANY_ID || Number.isNaN(TRANSPORTATION_COMPANY_ID)) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_COMPANY_ID" });
    }

    const companies = await dbService.find(
      {
        table: TRANSPORTATION_COMPANIES_TABLE,
        where: { TRANSPORTATION_COMPANY_ID },
        limit: 1,
      },
      companyId
    );

    if (!companies.length) {
      return res
        .status(404)
        .json({ message: "Transportation company not found" });
    }

    const {
      TRANSPORTATION_CONTRACT_ATTACHMENT,
      TRANSPORTATION_CONTRACT_START_DATE,
      TRANSPORTATION_CONTRACT_END_DATE,
    } = req.body;

    if (!TRANSPORTATION_CONTRACT_START_DATE) {
      return res.status(400).json({
        message: "TRANSPORTATION_CONTRACT_START_DATE is required",
      });
    }

    const now = new Date();

    const result = await dbService.insert(
      TRANSPORTATION_CONTRACTS_TABLE,
      {
        TRANSPORTATION_CONTRACT_COMPANY_ID: TRANSPORTATION_COMPANY_ID,
        TRANSPORTATION_CONTRACT_ATTACHMENT:
          TRANSPORTATION_CONTRACT_ATTACHMENT || null,
        TRANSPORTATION_CONTRACT_START_DATE,
        TRANSPORTATION_CONTRACT_END_DATE:
          TRANSPORTATION_CONTRACT_END_DATE || null,
        CREATED_ON: now,
        CRAETED_BY: userFromToken.USER_ID, // matches DB column spelling
      },
      companyId
    );

    return res.status(201).json({
      message: "Transportation contract created",
      TRANSPORTATION_CONTRACT_ID: result.insertId,
    });
  } catch (err) {
    console.error("createContractForCompany error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/transportation/contracts/:TRANSPORTATION_CONTRACT_ID
 */
async function getContractById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const TRANSPORTATION_CONTRACT_ID = parseInt(
      req.params.TRANSPORTATION_CONTRACT_ID,
      10
    );

    if (
      !TRANSPORTATION_CONTRACT_ID ||
      Number.isNaN(TRANSPORTATION_CONTRACT_ID)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_CONTRACT_ID" });
    }

    const rows = await dbService.find(
      {
        table: TRANSPORTATION_CONTRACTS_TABLE,
        where: { TRANSPORTATION_CONTRACT_ID },
        fields: [
          "TRANSPORTATION_CONTRACT_ID",
          "TRANSPORTATION_CONTRACT_COMPANY_ID",
          "TRANSPORTATION_CONTRACT_ATTACHMENT",
          "TRANSPORTATION_CONTRACT_START_DATE",
          "TRANSPORTATION_CONTRACT_END_DATE",
          "COMPANY_ID",
          "CREATED_ON",
          "CRAETED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
        ],
        limit: 1,
      },
      companyId
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ message: "Transportation contract not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getContractById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/transportation/contracts/:TRANSPORTATION_CONTRACT_ID
 * BODY: any subset of contract columns
 */
async function updateContract(req, res) {
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

    const TRANSPORTATION_CONTRACT_ID = parseInt(
      req.params.TRANSPORTATION_CONTRACT_ID,
      10
    );

    if (
      !TRANSPORTATION_CONTRACT_ID ||
      Number.isNaN(TRANSPORTATION_CONTRACT_ID)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_CONTRACT_ID" });
    }

    const existing = await dbService.find(
      {
        table: TRANSPORTATION_CONTRACTS_TABLE,
        where: { TRANSPORTATION_CONTRACT_ID },
        limit: 1,
      },
      companyId
    );

    if (!existing.length) {
      return res
        .status(404)
        .json({ message: "Transportation contract not found" });
    }

    const {
      TRANSPORTATION_CONTRACT_COMPANY_ID,
      TRANSPORTATION_CONTRACT_ATTACHMENT,
      TRANSPORTATION_CONTRACT_START_DATE,
      TRANSPORTATION_CONTRACT_END_DATE,
    } = req.body;

    const updateData = {};
    if (TRANSPORTATION_CONTRACT_COMPANY_ID !== undefined) {
      updateData.TRANSPORTATION_CONTRACT_COMPANY_ID =
        TRANSPORTATION_CONTRACT_COMPANY_ID;
    }
    if (TRANSPORTATION_CONTRACT_ATTACHMENT !== undefined) {
      updateData.TRANSPORTATION_CONTRACT_ATTACHMENT =
        TRANSPORTATION_CONTRACT_ATTACHMENT;
    }
    if (TRANSPORTATION_CONTRACT_START_DATE !== undefined) {
      updateData.TRANSPORTATION_CONTRACT_START_DATE =
        TRANSPORTATION_CONTRACT_START_DATE;
    }
    if (TRANSPORTATION_CONTRACT_END_DATE !== undefined) {
      updateData.TRANSPORTATION_CONTRACT_END_DATE =
        TRANSPORTATION_CONTRACT_END_DATE;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.UPDATED_BY = userFromToken.USER_ID;
      updateData.UPDATED_ON = new Date();

      await dbService.update(
        TRANSPORTATION_CONTRACTS_TABLE,
        updateData,
        { TRANSPORTATION_CONTRACT_ID },
        companyId
      );
    }

    const updated = await dbService.find(
      {
        table: TRANSPORTATION_CONTRACTS_TABLE,
        where: { TRANSPORTATION_CONTRACT_ID },
        fields: [
          "TRANSPORTATION_CONTRACT_ID",
          "TRANSPORTATION_CONTRACT_COMPANY_ID",
          "TRANSPORTATION_CONTRACT_ATTACHMENT",
          "TRANSPORTATION_CONTRACT_START_DATE",
          "TRANSPORTATION_CONTRACT_END_DATE",
          "COMPANY_ID",
          "CREATED_ON",
          "CRAETED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
        ],
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Transportation contract updated",
      CONTRACT: updated[0],
    });
  } catch (err) {
    console.error("updateContract error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/transportation/contracts/:TRANSPORTATION_CONTRACT_ID
 * Physical delete (no ACTIVE_STATUS column on this table)
 */
async function deleteContract(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const TRANSPORTATION_CONTRACT_ID = parseInt(
      req.params.TRANSPORTATION_CONTRACT_ID,
      10
    );

    if (
      !TRANSPORTATION_CONTRACT_ID ||
      Number.isNaN(TRANSPORTATION_CONTRACT_ID)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_CONTRACT_ID" });
    }

    const existing = await dbService.find(
      {
        table: TRANSPORTATION_CONTRACTS_TABLE,
        where: { TRANSPORTATION_CONTRACT_ID },
        limit: 1,
      },
      companyId
    );

    if (!existing.length) {
      return res
        .status(404)
        .json({ message: "Transportation contract not found" });
    }

    await dbService.remove(
      TRANSPORTATION_CONTRACTS_TABLE,
      { TRANSPORTATION_CONTRACT_ID },
      companyId
    );

    return res.json({ message: "Transportation contract deleted" });
  } catch (err) {
    console.error("deleteContract error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * ========= TRANSPORTATION FLEET (VEHICLES) =========
 *
 * Columns (COE_TBL_TRANSPORTATION_FLEET):
 *  VEHICLE_ID
 *  VEHICLE_PLATE_NUMBER
 *  VEHICLE_MAKE
 *  VEHICLE_MODEL
 *  VEHICLE_PAX
 *  VEHICLE_TYPE_ID
 *  VEHICLE_HOUR_RATE
 *  VEHICLE_TRANSPORTATION_COMAPNY_ID  (note COMAPNY spelling)
 *  COMPANY_ID
 *  CREATED_ON
 *  CREATED_BY
 *  UPDATED_ON
 *  UPDATED_BY
 *  VEHICLE_ACTIVE_STATUS
 */

/**
 * GET /api/transportation/companies/:TRANSPORTATION_COMPANY_ID/vehicles
 * Optional query: ?ACTIVE_STATUS=1
 */
async function listVehiclesForCompany(req, res) {
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

    if (!TRANSPORTATION_COMPANY_ID || Number.isNaN(TRANSPORTATION_COMPANY_ID)) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_COMPANY_ID" });
    }

    // Ensure company exists for this tenant
    const companies = await dbService.find(
      {
        table: TRANSPORTATION_COMPANIES_TABLE,
        where: { TRANSPORTATION_COMPANY_ID },
        limit: 1,
      },
      companyId
    );

    if (!companies.length) {
      return res
        .status(404)
        .json({ message: "Transportation company not found" });
    }

    const { ACTIVE_STATUS } = req.query;
    const where = {
      VEHICLE_TRANSPORTATION_COMAPNY_ID: TRANSPORTATION_COMPANY_ID,
    };
    if (ACTIVE_STATUS !== undefined) {
      where.VEHICLE_ACTIVE_STATUS = Number(ACTIVE_STATUS);
    }

    const rows = await dbService.find(
      {
        table: TRANSPORTATION_FLEET_TABLE,
        where,
        fields: [
          "VEHICLE_ID",
          "VEHICLE_PLATE_NUMBER",
          "VEHICLE_MAKE",
          "VEHICLE_MODEL",
          "VEHICLE_PAX",
          "VEHICLE_TYPE_ID",
          "VEHICLE_HOUR_RATE",
          "VEHICLE_TRANSPORTATION_COMAPNY_ID",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "VEHICLE_ACTIVE_STATUS",
        ],
        orderBy: "VEHICLE_PLATE_NUMBER ASC",
      },
      companyId
    );

    return res.json(rows);
  } catch (err) {
    console.error("listVehiclesForCompany error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/transportation/companies/:TRANSPORTATION_COMPANY_ID/vehicles
 * BODY:
 * {
 *   "VEHICLE_PLATE_NUMBER": "...",      // required
 *   "VEHICLE_MAKE": "...",
 *   "VEHICLE_MODEL": "...",
 *   "VEHICLE_PAX": 4,
 *   "VEHICLE_TYPE_ID": 1,
 *   "VEHICLE_HOUR_RATE": 50,
 *   "VEHICLE_ACTIVE_STATUS": 0/1
 * }
 */
async function createVehicleForCompany(req, res) {
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

    const TRANSPORTATION_COMPANY_ID = parseInt(
      req.params.TRANSPORTATION_COMPANY_ID,
      10
    );

    if (!TRANSPORTATION_COMPANY_ID || Number.isNaN(TRANSPORTATION_COMPANY_ID)) {
      return res
        .status(400)
        .json({ message: "Invalid TRANSPORTATION_COMPANY_ID" });
    }

    const companies = await dbService.find(
      {
        table: TRANSPORTATION_COMPANIES_TABLE,
        where: { TRANSPORTATION_COMPANY_ID },
        limit: 1,
      },
      companyId
    );

    if (!companies.length) {
      return res
        .status(404)
        .json({ message: "Transportation company not found" });
    }

    const {
      VEHICLE_PLATE_NUMBER,
      VEHICLE_MAKE,
      VEHICLE_MODEL,
      VEHICLE_PAX,
      VEHICLE_TYPE_ID,
      VEHICLE_HOUR_RATE,
      VEHICLE_ACTIVE_STATUS,
    } = req.body;

    if (!VEHICLE_PLATE_NUMBER) {
      return res
        .status(400)
        .json({ message: "VEHICLE_PLATE_NUMBER is required" });
    }

    const now = new Date();

    const result = await dbService.insert(
      TRANSPORTATION_FLEET_TABLE,
      {
        VEHICLE_PLATE_NUMBER,
        VEHICLE_MAKE: VEHICLE_MAKE || null,
        VEHICLE_MODEL: VEHICLE_MODEL || null,
        VEHICLE_PAX:
          VEHICLE_PAX !== undefined && VEHICLE_PAX !== null
            ? Number(VEHICLE_PAX)
            : null,
        VEHICLE_TYPE_ID:
          VEHICLE_TYPE_ID !== undefined && VEHICLE_TYPE_ID !== null
            ? Number(VEHICLE_TYPE_ID)
            : null,
        VEHICLE_HOUR_RATE:
          VEHICLE_HOUR_RATE !== undefined && VEHICLE_HOUR_RATE !== null
            ? Number(VEHICLE_HOUR_RATE)
            : null,
        VEHICLE_TRANSPORTATION_COMAPNY_ID: TRANSPORTATION_COMPANY_ID,
        VEHICLE_ACTIVE_STATUS: VEHICLE_ACTIVE_STATUS ?? 1,
        CREATED_ON: now,
        CREATED_BY: userFromToken.USER_ID,
      },
      companyId
    );

    return res.status(201).json({
      message: "Vehicle created",
      VEHICLE_ID: result.insertId,
    });
  } catch (err) {
    console.error("createVehicleForCompany error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/transportation/vehicles/:VEHICLE_ID
 */
async function getVehicleById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const VEHICLE_ID = parseInt(req.params.VEHICLE_ID, 10);

    if (!VEHICLE_ID || Number.isNaN(VEHICLE_ID)) {
      return res.status(400).json({ message: "Invalid VEHICLE_ID" });
    }

    const rows = await dbService.find(
      {
        table: TRANSPORTATION_FLEET_TABLE,
        where: { VEHICLE_ID },
        fields: [
          "VEHICLE_ID",
          "VEHICLE_PLATE_NUMBER",
          "VEHICLE_MAKE",
          "VEHICLE_MODEL",
          "VEHICLE_PAX",
          "VEHICLE_TYPE_ID",
          "VEHICLE_HOUR_RATE",
          "VEHICLE_TRANSPORTATION_COMAPNY_ID",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "VEHICLE_ACTIVE_STATUS",
        ],
        limit: 1,
      },
      companyId
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getVehicleById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/transportation/vehicles/:VEHICLE_ID
 * BODY: any subset of vehicle columns
 */
async function updateVehicle(req, res) {
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

    const VEHICLE_ID = parseInt(req.params.VEHICLE_ID, 10);

    if (!VEHICLE_ID || Number.isNaN(VEHICLE_ID)) {
      return res.status(400).json({ message: "Invalid VEHICLE_ID" });
    }

    const existing = await dbService.find(
      {
        table: TRANSPORTATION_FLEET_TABLE,
        where: { VEHICLE_ID },
        limit: 1,
      },
      companyId
    );

    if (!existing.length) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const {
      VEHICLE_PLATE_NUMBER,
      VEHICLE_MAKE,
      VEHICLE_MODEL,
      VEHICLE_PAX,
      VEHICLE_TYPE_ID,
      VEHICLE_HOUR_RATE,
      VEHICLE_TRANSPORTATION_COMAPNY_ID,
      VEHICLE_ACTIVE_STATUS,
    } = req.body;

    const updateData = {};
    if (VEHICLE_PLATE_NUMBER !== undefined) {
      updateData.VEHICLE_PLATE_NUMBER = VEHICLE_PLATE_NUMBER;
    }
    if (VEHICLE_MAKE !== undefined) {
      updateData.VEHICLE_MAKE = VEHICLE_MAKE;
    }
    if (VEHICLE_MODEL !== undefined) {
      updateData.VEHICLE_MODEL = VEHICLE_MODEL;
    }
    if (VEHICLE_PAX !== undefined) {
      updateData.VEHICLE_PAX =
        VEHICLE_PAX !== null ? Number(VEHICLE_PAX) : null;
    }
    if (VEHICLE_TYPE_ID !== undefined) {
      updateData.VEHICLE_TYPE_ID =
        VEHICLE_TYPE_ID !== null ? Number(VEHICLE_TYPE_ID) : null;
    }
    if (VEHICLE_HOUR_RATE !== undefined) {
      updateData.VEHICLE_HOUR_RATE =
        VEHICLE_HOUR_RATE !== null ? Number(VEHICLE_HOUR_RATE) : null;
    }
    if (VEHICLE_TRANSPORTATION_COMAPNY_ID !== undefined) {
      updateData.VEHICLE_TRANSPORTATION_COMAPNY_ID =
        VEHICLE_TRANSPORTATION_COMAPNY_ID;
    }
    if (VEHICLE_ACTIVE_STATUS !== undefined) {
      updateData.VEHICLE_ACTIVE_STATUS = VEHICLE_ACTIVE_STATUS;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.UPDATED_BY = userFromToken.USER_ID;
      updateData.UPDATED_ON = new Date();

      await dbService.update(
        TRANSPORTATION_FLEET_TABLE,
        updateData,
        { VEHICLE_ID },
        companyId
      );
    }

    const updated = await dbService.find(
      {
        table: TRANSPORTATION_FLEET_TABLE,
        where: { VEHICLE_ID },
        fields: [
          "VEHICLE_ID",
          "VEHICLE_PLATE_NUMBER",
          "VEHICLE_MAKE",
          "VEHICLE_MODEL",
          "VEHICLE_PAX",
          "VEHICLE_TYPE_ID",
          "VEHICLE_HOUR_RATE",
          "VEHICLE_TRANSPORTATION_COMAPNY_ID",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "VEHICLE_ACTIVE_STATUS",
        ],
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Vehicle updated",
      VEHICLE: updated[0],
    });
  } catch (err) {
    console.error("updateVehicle error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/transportation/vehicles/:VEHICLE_ID
 * Soft delete => VEHICLE_ACTIVE_STATUS = 0
 */
async function deleteVehicle(req, res) {
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

    const VEHICLE_ID = parseInt(req.params.VEHICLE_ID, 10);

    if (!VEHICLE_ID || Number.isNaN(VEHICLE_ID)) {
      return res.status(400).json({ message: "Invalid VEHICLE_ID" });
    }

    const existing = await dbService.find(
      {
        table: TRANSPORTATION_FLEET_TABLE,
        where: { VEHICLE_ID },
        limit: 1,
      },
      companyId
    );

    if (!existing.length) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const now = new Date();

    await dbService.update(
      TRANSPORTATION_FLEET_TABLE,
      {
        VEHICLE_ACTIVE_STATUS: 0,
        UPDATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
      },
      { VEHICLE_ID },
      companyId
    );

    return res.json({ message: "Vehicle deactivated" });
  } catch (err) {
    console.error("deleteVehicle error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  // Companies
  listTransportationCompanies,
  createTransportationCompany,
  getTransportationCompanyById,
  updateTransportationCompany,
  deleteTransportationCompany,

  // Contracts
  listContractsForCompany,
  createContractForCompany,
  getContractById,
  updateContract,
  deleteContract,

  // Vehicles
  listVehiclesForCompany,
  createVehicleForCompany,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
