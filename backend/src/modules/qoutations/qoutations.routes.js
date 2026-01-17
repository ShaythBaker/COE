// src/modules/qoutations/qoutations.routes.js
const express = require("express");
const qoutationsController = require("./qoutations.controller");
const authMiddleware = require("../../middleware/authMiddleware");
// const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// Create
router.post("/", authMiddleware, qoutationsController.createQoutation);

// Update
router.put(
  "/:QOUTATION_ID",
  authMiddleware,
  qoutationsController.updateQoutation
);

// Deactivate (soft delete)
router.patch(
  "/:QOUTATION_ID/deactivate",
  authMiddleware,
  qoutationsController.deactivateQoutation
);
// Or use DELETE if you prefer:
// router.delete("/:QOUTATION_ID", authMiddleware, qoutationsController.deactivateQoutation);

// Transportation fees lookup
router.get(
  "/transportation-fees/:TRANSPORTATION_COMPANY_ID",
  authMiddleware,
  qoutationsController.getTransportationFeesByCompany
);

module.exports = router;
