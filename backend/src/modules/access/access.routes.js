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
  checkPermission("ACCESS_ROLES", "VIEW"),
  accessController.listRoles
);

router.post(
  "/roles",
  authMiddleware,
  checkPermission("ACCESS_ROLES", "CREATE"),
  accessController.createRole
);

router.put(
  "/roles/:ROLE_ID",
  authMiddleware,
  checkPermission("ACCESS_ROLES", "EDIT"),
  accessController.updateRole
);

// Modules
router.get(
  "/modules",
  authMiddleware,
  checkPermission("ACCESS_ROLES", "VIEW"),
  accessController.listModules
);

router.post(
  "/modules",
  authMiddleware,
  checkPermission("ACCESS_ROLES", "CREATE"),
  accessController.createModule
);

router.put(
  "/modules/:MODULE_ID",
  authMiddleware,
  checkPermission("ACCESS_ROLES", "EDIT"),
  accessController.updateModule
);

// Role permissions
router.get(
  "/roles/:ROLE_ID/permissions",
  authMiddleware,
  checkPermission("ACCESS_ROLES", "VIEW"),
  accessController.getRolePermissions
);

router.put(
  "/roles/:ROLE_ID/permissions",
  authMiddleware,
  checkPermission("ACCESS_ROLES", "EDIT"),
  accessController.updateRolePermissions
);

// Current user's permissions (no checkPermission → everyone can see own permissions)
router.get(
  "/my-permissions",
  authMiddleware,
  accessController.getMyPermissions
);

module.exports = router;
