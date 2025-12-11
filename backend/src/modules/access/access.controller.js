const dbService = require("../../core/dbService");
const pool = require("../../core/db");

const ROLES_TABLE = "COE_TBL_ROLES";
const MODULES_TABLE = "COE_TBL_MODULES";
const ROLE_PERMISSIONS_TABLE = "COE_TBL_ROLE_PERMISSIONS";

/**
 * POST /api/access/roles/:ROLE_ID/permissions
 *
 * BODY:
 * {
 *   "MODULE_ID": 1,
 *   "CAN_VIEW": 1,
 *   "CAN_CREATE": 0,
 *   "CAN_EDIT": 0,
 *   "CAN_DELETE": 0,
 *   "ACTIVE_STATUS": 1
 * }
 *
 * Creates (or upserts) a single ROLE/MODULE permission row
 */
async function createRolePermission(req, res) {
  try {
    const ROLE_ID = parseInt(req.params.ROLE_ID, 10);
    if (!ROLE_ID || Number.isNaN(ROLE_ID)) {
      return res.status(400).json({ message: "Invalid ROLE_ID" });
    }

    const {
      MODULE_ID,
      CAN_VIEW,
      CAN_CREATE,
      CAN_EDIT,
      CAN_DELETE,
      ACTIVE_STATUS,
    } = req.body;

    if (!MODULE_ID) {
      return res.status(400).json({ message: "MODULE_ID is required" });
    }

    // 1) Ensure role exists
    const roles = await dbService.find({
      table: ROLES_TABLE,
      where: { ROLE_ID },
      limit: 1,
    });

    if (roles.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    // 2) Ensure module exists
    const modules = await dbService.find({
      table: MODULES_TABLE,
      where: { MODULE_ID },
      limit: 1,
    });

    if (modules.length === 0) {
      return res.status(404).json({ message: "Module not found" });
    }

    // 3) Normalize flags to 0/1
    const view = CAN_VIEW ? 1 : 0;
    const create = CAN_CREATE ? 1 : 0;
    const edit = CAN_EDIT ? 1 : 0;
    const del = CAN_DELETE ? 1 : 0;
    const active =
      ACTIVE_STATUS === 0 || ACTIVE_STATUS === 1 ? ACTIVE_STATUS : 1;

    // 4) Insert or update (upsert) single permission row
    const sql = `
      INSERT INTO ${ROLE_PERMISSIONS_TABLE}
        (ROLE_ID, MODULE_ID, CAN_VIEW, CAN_CREATE, CAN_EDIT, CAN_DELETE, ACTIVE_STATUS)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        CAN_VIEW = VALUES(CAN_VIEW),
        CAN_CREATE = VALUES(CAN_CREATE),
        CAN_EDIT = VALUES(CAN_EDIT),
        CAN_DELETE = VALUES(CAN_DELETE),
        ACTIVE_STATUS = VALUES(ACTIVE_STATUS)
    `;

    await pool.query(sql, [
      ROLE_ID,
      MODULE_ID,
      view,
      create,
      edit,
      del,
      active,
    ]);

    return res.status(201).json({
      message: "Role permission created/updated",
      ROLE_ID,
      MODULE_ID,
      CAN_VIEW: view,
      CAN_CREATE: create,
      CAN_EDIT: edit,
      CAN_DELETE: del,
      ACTIVE_STATUS: active,
    });
  } catch (err) {
    console.error("createRolePermission error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/access/roles
 * Optional query: ?ACTIVE_STATUS=1
 */
async function listRoles(req, res) {
  try {
    const { ACTIVE_STATUS } = req.query;
    const where = {};
    if (ACTIVE_STATUS !== undefined) {
      where.ACTIVE_STATUS = Number(ACTIVE_STATUS);
    }

    const roles = await dbService.find({
      table: ROLES_TABLE,
      where,
      fields: [
        "ROLE_ID",
        "ROLE_CODE",
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

/**
 * POST /api/access/roles
 * BODY:
 * {
 *   "ROLE_CODE": "HR_VIEWER",
 *   "ROLE_NAME": "HR Viewer",
 *   "DESCRIPTION": "View-only access",
 *   "ACTIVE_STATUS": 1
 * }
 */
async function createRole(req, res) {
  try {
    const { ROLE_CODE, ROLE_NAME, DESCRIPTION, ACTIVE_STATUS } = req.body;

    if (!ROLE_CODE || !ROLE_NAME) {
      return res.status(400).json({
        message: "ROLE_CODE and ROLE_NAME are required",
      });
    }

    // Check uniqueness
    const existing = await dbService.find({
      table: ROLES_TABLE,
      where: { ROLE_CODE },
      limit: 1,
    });

    if (existing.length > 0) {
      return res.status(409).json({ message: "ROLE_CODE already exists" });
    }

    const result = await dbService.insert(ROLES_TABLE, {
      ROLE_CODE,
      ROLE_NAME,
      DESCRIPTION: DESCRIPTION || null,
      ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
    });

    return res.status(201).json({
      message: "Role created",
      ROLE_ID: result.insertId,
    });
  } catch (err) {
    console.error("createRole error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/access/roles/:ROLE_ID
 * BODY: any subset of:
 * {
 *   "ROLE_CODE": "...",
 *   "ROLE_NAME": "...",
 *   "DESCRIPTION": "...",
 *   "ACTIVE_STATUS": 0/1
 * }
 */
async function updateRole(req, res) {
  try {
    const ROLE_ID = parseInt(req.params.ROLE_ID, 10);
    if (!ROLE_ID || Number.isNaN(ROLE_ID)) {
      return res.status(400).json({ message: "Invalid ROLE_ID" });
    }

    const { ROLE_CODE, ROLE_NAME, DESCRIPTION, ACTIVE_STATUS } = req.body;

    // Ensure role exists
    const roles = await dbService.find({
      table: ROLES_TABLE,
      where: { ROLE_ID },
      limit: 1,
    });

    if (roles.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    const updateData = {};

    // Optional uniqueness check when changing code
    if (ROLE_CODE !== undefined) {
      const existing = await dbService.find({
        table: ROLES_TABLE,
        where: { ROLE_CODE },
        limit: 1,
      });

      if (existing.length > 0 && existing[0].ROLE_ID !== ROLE_ID) {
        return res.status(409).json({ message: "ROLE_CODE already exists" });
      }

      updateData.ROLE_CODE = ROLE_CODE;
    }

    if (ROLE_NAME !== undefined) updateData.ROLE_NAME = ROLE_NAME;
    if (DESCRIPTION !== undefined) updateData.DESCRIPTION = DESCRIPTION;
    if (ACTIVE_STATUS !== undefined) updateData.ACTIVE_STATUS = ACTIVE_STATUS;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(ROLES_TABLE, updateData, { ROLE_ID });
    }

    const updated = await dbService.find({
      table: ROLES_TABLE,
      where: { ROLE_ID },
      fields: [
        "ROLE_ID",
        "ROLE_CODE",
        "ROLE_NAME",
        "DESCRIPTION",
        "ACTIVE_STATUS",
        "CREATED_AT",
        "UPDATED_AT",
      ],
      limit: 1,
    });

    return res.json({
      message: "Role updated",
      ROLE: updated[0],
    });
  } catch (err) {
    console.error("updateRole error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/access/modules
 */
async function listModules(req, res) {
  try {
    const modules = await dbService.find({
      table: MODULES_TABLE,
      fields: [
        "MODULE_ID",
        "MODULE_CODE",
        "MODULE_NAME",
        "DESCRIPTION",
        "ACTIVE_STATUS",
        "CREATED_AT",
        "UPDATED_AT",
      ],
      orderBy: "MODULE_NAME ASC",
    });

    return res.json(modules);
  } catch (err) {
    console.error("listModules error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/access/modules
 * BODY:
 * {
 *   "MODULE_CODE": "HR_USERS",
 *   "MODULE_NAME": "HR - Users",
 *   "DESCRIPTION": "Manage HR users",
 *   "ACTIVE_STATUS": 1
 * }
 */
async function createModule(req, res) {
  try {
    const { MODULE_CODE, MODULE_NAME, DESCRIPTION, ACTIVE_STATUS } = req.body;

    if (!MODULE_CODE || !MODULE_NAME) {
      return res
        .status(400)
        .json({ message: "MODULE_CODE and MODULE_NAME are required" });
    }

    const existing = await dbService.find({
      table: MODULES_TABLE,
      where: { MODULE_CODE },
      limit: 1,
    });

    if (existing.length > 0) {
      return res.status(409).json({ message: "MODULE_CODE already exists" });
    }

    const result = await dbService.insert(MODULES_TABLE, {
      MODULE_CODE,
      MODULE_NAME,
      DESCRIPTION: DESCRIPTION || null,
      ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
    });

    return res.status(201).json({
      message: "Module created",
      MODULE_ID: result.insertId,
    });
  } catch (err) {
    console.error("createModule error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/access/modules/:MODULE_ID
 * BODY: subset of:
 * {
 *   "MODULE_CODE": "...",
 *   "MODULE_NAME": "...",
 *   "DESCRIPTION": "...",
 *   "ACTIVE_STATUS": 1
 * }
 */
async function updateModule(req, res) {
  try {
    const MODULE_ID = parseInt(req.params.MODULE_ID, 10);
    if (!MODULE_ID || Number.isNaN(MODULE_ID)) {
      return res.status(400).json({ message: "Invalid MODULE_ID" });
    }

    const { MODULE_CODE, MODULE_NAME, DESCRIPTION, ACTIVE_STATUS } = req.body;

    const modules = await dbService.find({
      table: MODULES_TABLE,
      where: { MODULE_ID },
      limit: 1,
    });

    if (modules.length === 0) {
      return res.status(404).json({ message: "Module not found" });
    }

    const updateData = {};

    // Optional uniqueness check when changing code
    if (MODULE_CODE !== undefined) {
      const existing = await dbService.find({
        table: MODULES_TABLE,
        where: { MODULE_CODE },
        limit: 1,
      });

      if (existing.length > 0 && existing[0].MODULE_ID !== MODULE_ID) {
        return res.status(409).json({ message: "MODULE_CODE already exists" });
      }

      updateData.MODULE_CODE = MODULE_CODE;
    }

    if (MODULE_NAME !== undefined) updateData.MODULE_NAME = MODULE_NAME;
    if (DESCRIPTION !== undefined) updateData.DESCRIPTION = DESCRIPTION;
    if (ACTIVE_STATUS !== undefined) updateData.ACTIVE_STATUS = ACTIVE_STATUS;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(MODULES_TABLE, updateData, { MODULE_ID });
    }

    const updated = await dbService.find({
      table: MODULES_TABLE,
      where: { MODULE_ID },
      fields: [
        "MODULE_ID",
        "MODULE_CODE",
        "MODULE_NAME",
        "DESCRIPTION",
        "ACTIVE_STATUS",
        "CREATED_AT",
        "UPDATED_AT",
      ],
      limit: 1,
    });

    return res.json({
      message: "Module updated",
      MODULE: updated[0],
    });
  } catch (err) {
    console.error("updateModule error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/access/roles/:ROLE_ID/permissions
 * Returns all modules with this role's permissions
 */
async function getRolePermissions(req, res) {
  try {
    const ROLE_ID = parseInt(req.params.ROLE_ID, 10);
    if (!ROLE_ID || Number.isNaN(ROLE_ID)) {
      return res.status(400).json({ message: "Invalid ROLE_ID" });
    }

    const sql = `
      SELECT
        m.MODULE_ID,
        m.MODULE_CODE,
        m.MODULE_NAME,
        m.DESCRIPTION AS MODULE_DESCRIPTION,
        m.ACTIVE_STATUS AS MODULE_ACTIVE_STATUS,
        COALESCE(rp.CAN_VIEW, 0) AS CAN_VIEW,
        COALESCE(rp.CAN_CREATE, 0) AS CAN_CREATE,
        COALESCE(rp.CAN_EDIT, 0) AS CAN_EDIT,
        COALESCE(rp.CAN_DELETE, 0) AS CAN_DELETE,
        COALESCE(rp.ACTIVE_STATUS, 0) AS PERMISSION_ACTIVE_STATUS
      FROM ${MODULES_TABLE} m
      LEFT JOIN ${ROLE_PERMISSIONS_TABLE} rp
        ON rp.MODULE_ID = m.MODULE_ID
       AND rp.ROLE_ID = ?
      WHERE m.ACTIVE_STATUS = 1
      ORDER BY m.MODULE_NAME ASC
    `;

    const [rows] = await pool.query(sql, [ROLE_ID]);

    return res.json({
      ROLE_ID,
      PERMISSIONS: rows,
    });
  } catch (err) {
    console.error("getRolePermissions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/access/roles/:ROLE_ID/permissions
 *
 * BODY:
 * {
 *   "PERMISSIONS": [
 *     {
 *       "MODULE_ID": 1,
 *       "CAN_VIEW": 1,
 *       "CAN_CREATE": 0,
 *       "CAN_EDIT": 0,
 *       "CAN_DELETE": 0,
 *       "ACTIVE_STATUS": 1
 *     },
 *     ...
 *   ]
 * }
 */
async function updateRolePermissions(req, res) {
  let connection;
  try {
    const ROLE_ID = parseInt(req.params.ROLE_ID, 10);
    if (!ROLE_ID || Number.isNaN(ROLE_ID)) {
      return res.status(400).json({ message: "Invalid ROLE_ID" });
    }

    const { PERMISSIONS } = req.body;

    if (!Array.isArray(PERMISSIONS)) {
      return res.status(400).json({ message: "PERMISSIONS must be an array" });
    }

    // Optional safety limit to avoid abuse
    if (PERMISSIONS.length > 200) {
      return res
        .status(400)
        .json({ message: "Too many permissions in one request (max 200)" });
    }

    // Ensure role exists (avoid orphan permissions)
    const roles = await dbService.find({
      table: ROLES_TABLE,
      where: { ROLE_ID },
      limit: 1,
    });

    if (roles.length === 0) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Validate that all items have MODULE_ID (no silent skip)
    const invalidItem = PERMISSIONS.find((perm) => !perm || !perm.MODULE_ID);
    if (invalidItem) {
      return res.status(400).json({
        message: "Each permission item must include MODULE_ID",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const perm of PERMISSIONS) {
      const MODULE_ID = perm.MODULE_ID;

      const CAN_VIEW = perm.CAN_VIEW ? 1 : 0;
      const CAN_CREATE = perm.CAN_CREATE ? 1 : 0;
      const CAN_EDIT = perm.CAN_EDIT ? 1 : 0;
      const CAN_DELETE = perm.CAN_DELETE ? 1 : 0;
      const ACTIVE_STATUS =
        perm.ACTIVE_STATUS === 0 || perm.ACTIVE_STATUS === 1
          ? perm.ACTIVE_STATUS
          : 1;

      const sql = `
        INSERT INTO ${ROLE_PERMISSIONS_TABLE}
          (ROLE_ID, MODULE_ID, CAN_VIEW, CAN_CREATE, CAN_EDIT, CAN_DELETE, ACTIVE_STATUS)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          CAN_VIEW = VALUES(CAN_VIEW),
          CAN_CREATE = VALUES(CAN_CREATE),
          CAN_EDIT = VALUES(CAN_EDIT),
          CAN_DELETE = VALUES(CAN_DELETE),
          ACTIVE_STATUS = VALUES(ACTIVE_STATUS)
      `;

      await connection.query(sql, [
        ROLE_ID,
        MODULE_ID,
        CAN_VIEW,
        CAN_CREATE,
        CAN_EDIT,
        CAN_DELETE,
        ACTIVE_STATUS,
      ]);
    }

    await connection.commit();

    return res.json({
      message: "Role permissions updated",
      ROLE_ID,
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error("updateRolePermissions rollback error:", rollbackErr);
      }
    }
    console.error("updateRolePermissions error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// GET /api/access/my-permissions
// Returns the current user's effective permissions per module
async function getMyPermissions(req, res) {
  try {
    const user = req.user; // from authMiddleware
    if (!user || !user.USER_ID) {
      return res
        .status(401)
        .json({ message: "Unauthorized: USER_ID missing in token" });
    }

    const USER_ID = user.USER_ID;

    const sql = `
      SELECT
        m.MODULE_ID,
        m.MODULE_CODE,
        m.MODULE_NAME,
        m.DESCRIPTION AS MODULE_DESCRIPTION,

        ur.COMPANY_ID,
        r.ROLE_ID,
        r.ROLE_CODE,
        r.ROLE_NAME,

        rp.CAN_VIEW,
        rp.CAN_CREATE,
        rp.CAN_EDIT,
        rp.CAN_DELETE
      FROM COE_TBL_USER_ROLES ur
      JOIN COE_TBL_ROLES r
        ON ur.ROLE_ID = r.ROLE_ID
       AND r.ACTIVE_STATUS = 1
      JOIN COE_TBL_ROLE_PERMISSIONS rp
        ON rp.ROLE_ID = r.ROLE_ID
       AND rp.ACTIVE_STATUS = 1
      JOIN COE_TBL_MODULES m
        ON m.MODULE_ID = rp.MODULE_ID
       AND m.ACTIVE_STATUS = 1
      WHERE ur.USER_ID = ?
        AND ur.ACTIVE_STATUS = 1
      ORDER BY m.MODULE_NAME ASC, r.ROLE_NAME ASC
    `;

    const [rows] = await pool.query(sql, [USER_ID]);

    // Aggregate per module
    const modulesMap = {};

    for (const row of rows) {
      const key = row.MODULE_ID;

      if (!modulesMap[key]) {
        modulesMap[key] = {
          MODULE_ID: row.MODULE_ID,
          MODULE_CODE: row.MODULE_CODE,
          MODULE_NAME: row.MODULE_NAME,
          MODULE_DESCRIPTION: row.MODULE_DESCRIPTION,
          // Effective permissions (OR across all roles)
          CAN_VIEW: row.CAN_VIEW ? 1 : 0,
          CAN_CREATE: row.CAN_CREATE ? 1 : 0,
          CAN_EDIT: row.CAN_EDIT ? 1 : 0,
          CAN_DELETE: row.CAN_DELETE ? 1 : 0,
          // Details per role/department
          ROLES: [],
        };
      } else {
        // OR permissions
        modulesMap[key].CAN_VIEW =
          modulesMap[key].CAN_VIEW || (row.CAN_VIEW ? 1 : 0);
        modulesMap[key].CAN_CREATE =
          modulesMap[key].CAN_CREATE || (row.CAN_CREATE ? 1 : 0);
        modulesMap[key].CAN_EDIT =
          modulesMap[key].CAN_EDIT || (row.CAN_EDIT ? 1 : 0);
        modulesMap[key].CAN_DELETE =
          modulesMap[key].CAN_DELETE || (row.CAN_DELETE ? 1 : 0);
      }

      modulesMap[key].ROLES.push({
        ROLE_ID: row.ROLE_ID,
        ROLE_CODE: row.ROLE_CODE,
        ROLE_NAME: row.ROLE_NAME,
        COMPANY_ID: row.COMPANY_ID,
        CAN_VIEW: row.CAN_VIEW ? 1 : 0,
        CAN_CREATE: row.CAN_CREATE ? 1 : 0,
        CAN_EDIT: row.CAN_EDIT ? 1 : 0,
        CAN_DELETE: row.CAN_DELETE ? 1 : 0,
      });
    }

    const MODULES = Object.values(modulesMap);

    return res.json({
      USER_ID,
      MODULES,
    });
  } catch (err) {
    console.error("getMyPermissions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listRoles,
  createRole,
  updateRole,
  listModules,
  createModule,
  updateModule,
  getRolePermissions,
  updateRolePermissions,
  getMyPermissions,
  createRolePermission,
};
