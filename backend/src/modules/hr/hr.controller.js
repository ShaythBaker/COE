const bcrypt = require("bcryptjs");
const dbService = require("../../core/dbService");
const pool = require("../../core/db");

const USERS_TABLE = "COE_TBL_USERS";
const USER_ROLES_TABLE = "COE_TBL_USER_ROLES";

// GET /api/hr/employees
async function listEmployees(req, res) {
  try {
    const employees = await dbService.find({
      table: USERS_TABLE,
      fields: [
        "USER_ID",
        "FIRST_NAME",
        "LAST_NAME",
        "EMAIL",
        "PROFILE_IMG",
        "COMPANY_ID",
        "PHONE_NUMBER",
        "ACTIVE_STATUS",
        "CREATED_AT",
        "UPDATED_AT",
      ],
      orderBy: "CREATED_AT DESC",
    });

    return res.json(employees);
  } catch (err) {
    console.error("listEmployees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/hr/employees
 * Creates a user + links roles (per department)
 *
 * BODY (UPPERCASE):
 * {
 *   "FIRST_NAME": "MOHAMMAD",
 *   "LAST_NAME": "BAKER",
 *   "EMAIL": "shayth@example.com",
 *   "PASSWORD": "StrongPass123!",
 *   "PROFILE_IMG": null,
 *   "COMPANY_ID": 10,
 *   "PHONE_NUMBER": "00962...",
 *   "ACTIVE_STATUS": 1,
 *   "ROLE_IDS": [1, 2]   // list of ROLE_IDs to assign in this department
 * }
 */
async function createEmployee(req, res) {
  try {
    const {
      FIRST_NAME,
      LAST_NAME,
      EMAIL,
      PASSWORD,
      PROFILE_IMG,
      COMPANY_ID,
      PHONE_NUMBER,
      ACTIVE_STATUS,
      ROLE_IDS,
    } = req.body;

    if (!FIRST_NAME || !LAST_NAME || !EMAIL || !PASSWORD) {
      return res.status(400).json({
        message: "FIRST_NAME, LAST_NAME, EMAIL, PASSWORD are required",
      });
    }

    // 1) Check existing user by EMAIL
    const existing = await dbService.find({
      table: USERS_TABLE,
      where: { EMAIL },
      limit: 1,
    });

    if (existing.length > 0) {
      return res.status(409).json({ message: "EMAIL already exists" });
    }

    // 2) Hash password
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    // 3) Insert into COE_TBL_USERS
    const userInsert = await dbService.insert(USERS_TABLE, {
      FIRST_NAME,
      LAST_NAME,
      EMAIL,
      PASSWORD: hashedPassword,
      PROFILE_IMG: PROFILE_IMG || null,
      COMPANY_ID: COMPANY_ID || null,
      PHONE_NUMBER: PHONE_NUMBER || null,
      ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
    });

    const USER_ID = userInsert.insertId;

    // 4) Assign roles in COE_TBL_USER_ROLES for this department
    if (Array.isArray(ROLE_IDS) && ROLE_IDS.length > 0) {
      for (const ROLE_ID of ROLE_IDS) {
        if (!ROLE_ID) continue;

        await dbService.insert(USER_ROLES_TABLE, {
          USER_ID,
          ROLE_ID,
          COMPANY_ID: COMPANY_ID || null,
          ACTIVE_STATUS: 1,
        });
      }
    }

    return res.status(201).json({
      message: "Employee (user) created",
      USER_ID,
      ROLE_IDS: ROLE_IDS || [],
    });
  } catch (err) {
    console.error("createEmployee error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
async function listRoles(req, res) {
  try {
    const roles = await dbService.find({
      table: "COE_TBL_ROLES",
      where: { ACTIVE_STATUS: 1 },
      fields: [
        "ROLE_ID",
        "ROLE_NAME",
        "DESCRIPTION",
        "ACTIVE_STATUS",
        "CREATED_AT",
        "UPDATED_AT",
      ],
      orderBy: "ROLE_NAME ASC",
    });

    return res.json(roles);
  } catch (err) {
    console.error("listRoles error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateEmployee(req, res) {
  try {
    const USER_ID = parseInt(req.params.USER_ID, 10);

    if (!USER_ID || Number.isNaN(USER_ID)) {
      return res.status(400).json({ message: "Invalid USER_ID" });
    }

    const {
      FIRST_NAME,
      LAST_NAME,
      EMAIL,
      PROFILE_IMG,
      COMPANY_ID,
      PHONE_NUMBER,
      ACTIVE_STATUS,
      ROLE_IDS,
    } = req.body;

    // 1) Ensure user exists
    const existingUsers = await dbService.find({
      table: USERS_TABLE,
      where: { USER_ID },
      limit: 1,
    });

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2) Build update data (only provided fields)
    const updateData = {};
    if (FIRST_NAME !== undefined) updateData.FIRST_NAME = FIRST_NAME;
    if (LAST_NAME !== undefined) updateData.LAST_NAME = LAST_NAME;
    if (EMAIL !== undefined) updateData.EMAIL = EMAIL;
    if (PROFILE_IMG !== undefined) updateData.PROFILE_IMG = PROFILE_IMG;
    if (COMPANY_ID !== undefined) updateData.COMPANY_ID = COMPANY_ID;
    if (PHONE_NUMBER !== undefined) updateData.PHONE_NUMBER = PHONE_NUMBER;
    if (ACTIVE_STATUS !== undefined) updateData.ACTIVE_STATUS = ACTIVE_STATUS;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(USERS_TABLE, updateData, { USER_ID });
    }

    // 3) Update roles (per department)
    if (Array.isArray(ROLE_IDS)) {
      if (COMPANY_ID === undefined || COMPANY_ID === null) {
        return res.status(400).json({
          message:
            "COMPANY_ID is required when updating ROLE_IDS for an employee",
        });
      }

      // Soft-disable existing roles for this USER_ID + COMPANY_ID
      await dbService.update(
        USER_ROLES_TABLE,
        { ACTIVE_STATUS: 0 },
        { USER_ID, COMPANY_ID }
      );

      // Insert new active roles for this department
      for (const ROLE_ID of ROLE_IDS) {
        if (!ROLE_ID) continue;

        await dbService.insert(USER_ROLES_TABLE, {
          USER_ID,
          ROLE_ID,
          COMPANY_ID,
          ACTIVE_STATUS: 1,
        });
      }
    }

    // 4) Return updated user (basic) + ROLE_IDS (as sent)
    const updatedUsers = await dbService.find({
      table: USERS_TABLE,
      where: { USER_ID },
      fields: [
        "USER_ID",
        "FIRST_NAME",
        "LAST_NAME",
        "EMAIL",
        "PROFILE_IMG",
        "COMPANY_ID",
        "PHONE_NUMBER",
        "ACTIVE_STATUS",
        "CREATED_AT",
        "UPDATED_AT",
      ],
      limit: 1,
    });

    return res.json({
      message: "Employee updated successfully",
      USER: updatedUsers[0],
      ROLE_IDS: Array.isArray(ROLE_IDS) ? ROLE_IDS : undefined,
    });
  } catch (err) {
    console.error("updateEmployee error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getEmployeeById(req, res) {
  try {
    const USER_ID = parseInt(req.params.USER_ID, 10);

    if (!USER_ID || Number.isNaN(USER_ID)) {
      return res.status(400).json({ message: "Invalid USER_ID" });
    }

    const sql = `
      SELECT
        u.USER_ID,
        u.FIRST_NAME,
        u.LAST_NAME,
        u.EMAIL,
        u.PROFILE_IMG,
        u.COMPANY_ID,
        u.PHONE_NUMBER,
        u.ACTIVE_STATUS,
        u.CREATED_AT,
        u.UPDATED_AT,

        ur.USER_ROLE_ID,
        ur.ROLE_ID,
        ur.COMPANY_ID AS ROLE_DEPARMENT_ID,
        ur.ACTIVE_STATUS AS USER_ROLE_ACTIVE_STATUS,

        r.ROLE_CODE,
        r.ROLE_NAME,
        r.DESCRIPTION AS ROLE_DESCRIPTION
      FROM COE_TBL_USERS u
      LEFT JOIN COE_TBL_USER_ROLES ur
        ON ur.USER_ID = u.USER_ID
       AND ur.ACTIVE_STATUS = 1
      LEFT JOIN COE_TBL_ROLES r
        ON r.ROLE_ID = ur.ROLE_ID
       AND r.ACTIVE_STATUS = 1
      WHERE u.USER_ID = ?
      LIMIT 100
    `;

    const [rows] = await pool.query(sql, [USER_ID]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Base user from first row
    const base = rows[0];

    const USER = {
      USER_ID: base.USER_ID,
      FIRST_NAME: base.FIRST_NAME,
      LAST_NAME: base.LAST_NAME,
      EMAIL: base.EMAIL,
      PROFILE_IMG: base.PROFILE_IMG,
      COMPANY_ID: base.COMPANY_ID,
      PHONE_NUMBER: base.PHONE_NUMBER,
      ACTIVE_STATUS: base.ACTIVE_STATUS,
      CREATED_AT: base.CREATED_AT,
      UPDATED_AT: base.UPDATED_AT,
    };

    const ROLES = rows
      .filter((r) => r.ROLE_ID) // only rows with a role
      .map((r) => ({
        USER_ROLE_ID: r.USER_ROLE_ID,
        ROLE_ID: r.ROLE_ID,
        ROLE_CODE: r.ROLE_CODE,
        ROLE_NAME: r.ROLE_NAME,
        ROLE_DESCRIPTION: r.ROLE_DESCRIPTION,
        COMPANY_ID: r.ROLE_DEPARMENT_ID,
      }));

    return res.json({
      USER,
      ROLES,
    });
  } catch (err) {
    console.error("getEmployeeById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listEmployees,
  createEmployee,
  listRoles,
  updateEmployee,
  getEmployeeById,
};
