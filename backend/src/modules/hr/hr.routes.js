const express = require("express");
const hrController = require("./hr.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// List employees
router.get(
  "/employees",
  authMiddleware,
  checkPermission("HR_USERS", "VIEW"),
  hrController.listEmployees
);

// Get employee by ID (with roles)
router.get(
  "/employees/:USER_ID",
  authMiddleware,
  checkPermission("HR_USERS", "VIEW"),
  hrController.getEmployeeById
);

// Create employee
router.post(
  "/employees",
  authMiddleware,
  checkPermission("HR_USERS", "CREATE"),
  hrController.createEmployee
);

// Update employee
router.put(
  "/employees/:USER_ID",
  authMiddleware,
  checkPermission("HR_USERS", "EDIT"),
  hrController.updateEmployee
);

// Dynamic roles list
router.get(
  "/roles",
  authMiddleware,
  checkPermission("HR_USERS", "VIEW"),
  hrController.listRoles
);

module.exports = router;
