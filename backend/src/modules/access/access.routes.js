const express = require("express");
const accessController = require("./access.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// We control access via module code ACCESS_ROLES

// Roles
router.get(
  "/roles",
  authMiddleware,
  checkPermission("HR_USERS", "VIEW"),
  accessController.listRoles
);

router.post(
  "/roles",
  authMiddleware,
  checkPermission("HR_USERS", "CREATE"),
  accessController.createRole
);

router.put(
  "/roles/:ROLE_ID",
  authMiddleware,
  checkPermission("HR_USERS", "EDIT"),
  accessController.updateRole
);

// Modules
router.get(
  "/modules",
  authMiddleware,
  checkPermission("HR_USERS", "VIEW"),
  accessController.listModules
);

router.post(
  "/modules",
  authMiddleware,
  checkPermission("HR_USERS", "CREATE"),
  accessController.createModule
);

router.put(
  "/modules/:MODULE_ID",
  authMiddleware,
  checkPermission("HR_USERS", "EDIT"),
  accessController.updateModule
);

// Role permissions
router.get(
  "/roles/:ROLE_ID/permissions",
  authMiddleware,
  checkPermission("HR_USERS", "VIEW"),
  accessController.getRolePermissions
);

router.put(
  "/roles/:ROLE_ID/permissions",
  authMiddleware,
  checkPermission("HR_USERS", "EDIT"),
  accessController.updateRolePermissions
);

// Current user's permissions (no checkPermission → everyone can see own permissions)
router.get(
  "/my-permissions",
  authMiddleware,
  accessController.getMyPermissions
);

// NEW: create single permission (or upsert)
router.post(
  "/roles/:ROLE_ID/permissions",
  authMiddleware,
  checkPermission("ACCESS_ROLES", "EDIT"),
  accessController.createRolePermission
);

router.put(
  "/roles/:ROLE_ID/permissions",
  authMiddleware,
  checkPermission("ACCESS_ROLES", "EDIT"),
  accessController.updateRolePermissions
);

module.exports = router;
