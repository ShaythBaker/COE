// src/modules/extraServices/extraServices.routes.js
const express = require("express");
const extraServicesController = require("./extraServices.controller");
const authMiddleware = require("../../middleware/authMiddleware");
// If you later add permissions, you can also use:
// const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// List all extra services
router.get(
  "/",
  authMiddleware,
  extraServicesController.listExtraServices
);

// Get one extra service
router.get(
  "/:EXTRA_SERVICE_ID",
  authMiddleware,
  extraServicesController.getExtraServiceById
);

// Create new extra service
router.post(
  "/",
  authMiddleware,
  extraServicesController.createExtraService
);

// Update extra service
router.put(
  "/:EXTRA_SERVICE_ID",
  authMiddleware,
  extraServicesController.updateExtraService
);

// Delete extra service
router.delete(
  "/:EXTRA_SERVICE_ID",
  authMiddleware,
  extraServicesController.deleteExtraService
);

module.exports = router;
