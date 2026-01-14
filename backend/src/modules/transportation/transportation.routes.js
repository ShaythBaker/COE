// src/modules/transportation/transportation.routes.js
const express = require("express");
const transportationController = require("./transportation.controller");
const authMiddleware = require("../../middleware/authMiddleware");
// const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// ===== Transportation companies =====
router.get(
  "/companies",
  authMiddleware,
  transportationController.listTransportationCompanies
);

router.post(
  "/companies",
  authMiddleware,
  transportationController.createTransportationCompany
);

router.get(
  "/companies/:TRANSPORTATION_COMPANY_ID",
  authMiddleware,
  transportationController.getTransportationCompanyById
);

router.put(
  "/companies/:TRANSPORTATION_COMPANY_ID",
  authMiddleware,
  transportationController.updateTransportationCompany
);

router.delete(
  "/companies/:TRANSPORTATION_COMPANY_ID",
  authMiddleware,
  transportationController.deleteTransportationCompany
);

// ===== Contracts =====
router.get(
  "/companies/:TRANSPORTATION_COMPANY_ID/contracts",
  authMiddleware,
  transportationController.listContractsForCompany
);

router.post(
  "/companies/:TRANSPORTATION_COMPANY_ID/contracts",
  authMiddleware,
  transportationController.createContractForCompany
);

router.get(
  "/contracts/:TRANSPORTATION_CONTRACT_ID",
  authMiddleware,
  transportationController.getContractById
);

router.put(
  "/contracts/:TRANSPORTATION_CONTRACT_ID",
  authMiddleware,
  transportationController.updateContract
);

router.delete(
  "/contracts/:TRANSPORTATION_CONTRACT_ID",
  authMiddleware,
  transportationController.deleteContract
);

// ===== Vehicles =====
router.get(
  "/companies/:TRANSPORTATION_COMPANY_ID/vehicles",
  authMiddleware,
  transportationController.listVehiclesForCompany
);

router.post(
  "/companies/:TRANSPORTATION_COMPANY_ID/vehicles",
  authMiddleware,
  transportationController.createVehicleForCompany
);

router.get(
  "/vehicles/:VEHICLE_ID",
  authMiddleware,
  transportationController.getVehicleById
);

router.put(
  "/vehicles/:VEHICLE_ID",
  authMiddleware,
  transportationController.updateVehicle
);

router.delete(
  "/vehicles/:VEHICLE_ID",
  authMiddleware,
  transportationController.deleteVehicle
);

// ===== Fees =====
router.get(
  "/companies/:TRANSPORTATION_COMPANY_ID/fees",
  authMiddleware,
  transportationController.listFeesForCompany
);

router.post(
  "/companies/:TRANSPORTATION_COMPANY_ID/fees",
  authMiddleware,
  transportationController.createFeeForCompany
);

router.get(
  "/fees/:TRANSPORTATION_FEE_ID",
  authMiddleware,
  transportationController.getFeeById
);

router.put(
  "/fees/:TRANSPORTATION_FEE_ID",
  authMiddleware,
  transportationController.updateFee
);

router.delete(
  "/fees/:TRANSPORTATION_FEE_ID",
  authMiddleware,
  transportationController.deleteFee
);


module.exports = router;
