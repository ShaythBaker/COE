const pool = require("../core/db");

// Map action name -> permission column
const ACTION_COLUMN_MAP = {
  VIEW: "CAN_VIEW",
  CREATE: "CAN_CREATE",
  EDIT: "CAN_EDIT",
  DELETE: "CAN_DELETE",
};

/**
 * Returns true if the user:
 * - has a role with ROLE_CODE = 'SYS_ADMIN'
 * - AND that role has any permission on module 'ACCESS_ROLES'
 */
async function userIsSysAdminWithAccessRoles(USER_ID) {
  const sql = `
    SELECT 1
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
      AND r.ROLE_CODE = 'SYS_ADMIN'
      AND m.MODULE_CODE = 'ACCESS_ROLES'
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [USER_ID]);
  return rows && rows.length > 0;
}

/**
 * checkPermission("HR_USERS", "VIEW")
 * checkPermission("HR_USERS", "CREATE")
 *
 * Requires:
 * - req.user.USER_ID  (from JWT authMiddleware)
 */
function checkPermission(moduleCode, action) {
  const upperAction = action.toUpperCase();
  const permColumn = ACTION_COLUMN_MAP[upperAction];

  if (!permColumn) {
    throw new Error(`Unsupported action "${action}". Use VIEW, CREATE, EDIT, DELETE.`);
  }

  return async function (req, res, next) {
    try {
      const user = req.user;
      if (!user || !user.USER_ID) {
        return res.status(401).json({ message: "Unauthorized: USER_ID missing in token" });
      }

      const USER_ID = user.USER_ID;

      // 1) Special bypass for SYS_ADMIN + ACCESS_ROLES
      const isSysAdmin = await userIsSysAdminWithAccessRoles(USER_ID);
      if (isSysAdmin) {
        console.log(
          `Permission bypass: USER_ID=${USER_ID} is SYS_ADMIN with ACCESS_ROLES, allowing ${moduleCode}:${upperAction}`
        );
        return next();
      }

      // 2) Normal permission check
      const sql = `
        SELECT
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
          AND m.MODULE_CODE = ?
      `;

      const [rows] = await pool.query(sql, [USER_ID, moduleCode]);

      if (!rows || rows.length === 0) {
        return res
          .status(403)
          .json({ message: "Forbidden: no role on this module" });
      }

      const hasPermission = rows.some((row) => row[permColumn] === 1);

      if (!hasPermission) {
        return res.status(403).json({
          message: `Forbidden: missing ${upperAction} permission on module ${moduleCode}`,
        });
      }

      return next();
    } catch (err) {
      console.error("checkPermission error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
}

module.exports = {
  checkPermission,
};
