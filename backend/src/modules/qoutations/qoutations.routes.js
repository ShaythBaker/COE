// src/modules/qoutations/qoutations.routes.js
const express = require("express");
const qoutationsController = require("./qoutations.controller");
const qoutationsStep1Controller = require("./qoutations.step1.controller");
const authMiddleware = require("../../middleware/authMiddleware");
// const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// List qoutations
router.get("/", authMiddleware, qoutationsController.listQoutations);

// Get single qoutation by ID
router.get(
  "/:QOUTATION_ID",
  authMiddleware,
  qoutationsController.getQoutationById
);

// Create qoutation
router.post("/", authMiddleware, qoutationsController.createQoutation);

// Update qoutation
router.put(
  "/:QOUTATION_ID",
  authMiddleware,
  qoutationsController.updateQoutation
);

// Soft delete qoutation
router.delete(
  "/:QOUTATION_ID",
  authMiddleware,
  qoutationsController.deleteQoutation
);

// STEP 1: load data for the multi-step form
router.get(
  "/:QOUTATION_ID/step1",
  authMiddleware,
  qoutationsStep1Controller.getQoutationStep1
);

// STEP 1: save quotation details (routes/places/meals/extra services)
router.post(
  "/step1",
  authMiddleware,
  qoutationsStep1Controller.saveQoutationStep1
);

router.get(
  "/:QOUTATION_ID/step1/submitted",
  authMiddleware,
  qoutationsStep1Controller
  .getQoutationStep1Submitted
);

module.exports = router;
