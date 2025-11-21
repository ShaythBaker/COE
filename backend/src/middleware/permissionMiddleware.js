const pool = require("../core/db");

// Map action name -> permission column
const ACTION_COLUMN_MAP = {
  VIEW: "CAN_VIEW",
  CREATE: "CAN_CREATE",
  EDIT: "CAN_EDIT",
  DELETE: "CAN_DELETE",
};

/**
 * checkPermission("HR_USERS", "VIEW")
 * checkPermission("HR_USERS", "CREATE")
 *
 * Requires:
 * - req.user.USER_ID  (from JWT authMiddleware)
 * - COE_TBL_USER_ROLES, COE_TBL_ROLES, COE_TBL_MODULES, COE_TBL_ROLE_PERMISSIONS
 */
function checkPermission(moduleCode, action) {
  const upperAction = action.toUpperCase();
  const permColumn = ACTION_COLUMN_MAP[upperAction];

  if (!permColumn) {
    throw new Error(`Unsupported action "${action}". Use VIEW, CREATE, EDIT, DELETE.`);
  }

  return async function (req, res, next) {
    try {
      // JWT payload (from authMiddleware)
      const user = req.user;
      if (!user || !user.USER_ID) {
        return res.status(401).json({ message: "Unauthorized: USER_ID missing in token" });
      }

      const USER_ID = user.USER_ID;

      // Optional: department-based scoping later
      // const requestDepartmentId = user.DEPATRMENT_ID || null;

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
        return res.status(403).json({ message: "Forbidden: no role on this module" });
      }

      // Check if ANY row grants the requested permission
      const hasPermission = rows.some((row) => row[permColumn] === 1);

      if (!hasPermission) {
        return res.status(403).json({
          message: `Forbidden: missing ${upperAction} permission on module ${moduleCode}`,
        });
      }

      // User is allowed
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
