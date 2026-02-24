// src/modules/qoutations/qoutations.routes.js
const express = require("express");
const qoutationsController = require("./qoutations.controller");
const qoutationsStep1Controller = require("./qoutations.step1.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const qoutationsStep2Controller = require("./qoutations.step2.controller");
const qoutationsStep3Controller = require("./quotations.step3.controller");
// const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();
console.log("qoutations.routes loaded");

// List qoutations
router.get("/", authMiddleware, qoutationsController.listQoutations);

// Get single qoutation by ID
router.get(
  "/:QOUTATION_ID",
  authMiddleware,
  qoutationsController.getQoutationById,
);

// Create qoutation
router.post("/", authMiddleware, qoutationsController.createQoutation);

// Update qoutation
router.put(
  "/:QOUTATION_ID",
  authMiddleware,
  qoutationsController.updateQoutation,
);

// Soft delete qoutation
router.delete(
  "/:QOUTATION_ID",
  authMiddleware,
  qoutationsController.deleteQoutation,
);

// STEP 1: load data for the multi-step form
router.get(
  "/:QOUTATION_ID/step1",
  authMiddleware,
  qoutationsStep1Controller.getQoutationStep1,
);

// STEP 1: save quotation details (routes/places/meals/extra services)
router.post(
  "/step1",
  authMiddleware,
  qoutationsStep1Controller.saveQoutationStep1,
);

router.get(
  "/:QOUTATION_ID/step1/submitted",
  authMiddleware,
  qoutationsStep1Controller.getQoutationStep1Submitted,
);

router.get(
  "/step2/hotel-season-rates",
  authMiddleware,
  qoutationsStep2Controller.listHotelSeasonRates,
);

router.post(
  "/step2/:QOUTATION_ID/accommodation",
  authMiddleware,
  qoutationsStep2Controller.saveQuotationAccommodation,
);

router.get(
  "/step2/:QOUTATION_ID/accommodation",
  authMiddleware,
  qoutationsStep2Controller.getQuotationAccommodation,
);

//step3

// GET list (from VIEW)
router.get(
  "/step3/:QOUTATION_ID/extra-services",
  authMiddleware,
  qoutationsStep3Controller.listQuotationExtraServices,
);

// CREATE (insert into TABLE)
router.post(
  "/step3/:QOUTATION_ID/extra-services",
  authMiddleware,
  qoutationsStep3Controller.createQuotationExtraService,
);

// UPDATE by PK
router.put(
  "/step3/extra-services/:QOUTATION_EXTRA_SERVICE_ID",
  authMiddleware,
  qoutationsStep3Controller.updateQuotationExtraService,
);

// DELETE by PK
router.delete(
  "/step3/extra-services/:QOUTATION_EXTRA_SERVICE_ID",
  authMiddleware,
  qoutationsStep3Controller.deleteQuotationExtraService,
);

//GET QUOTATION DETAILS
router.get(
  "/:QOUTATION_ID/details",
  authMiddleware,
  // checkPermission("QOUTATIONS", "VIEW"),
  qoutationsController.getQuotationDetails
);

module.exports = router;
