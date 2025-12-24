// src/modules/hotels/hotels.routes.js
const express = require("express");
const hotelsController = require("./hotels.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// If you later create a MODULE_CODE 'HOTELS' in COE_TBL_MODULES,
// you can wrap routes with checkPermission("HOTELS", "VIEW"/"CREATE"/"EDIT"/"DELETE")

// List hotels
router.get(
  "/",
  authMiddleware,
  // checkPermission("HOTELS", "VIEW"), // optional permission hook
  hotelsController.listHotels
);

// Get single hotel
router.get(
  "/:HOTEL_ID",
  authMiddleware,
  // checkPermission("HOTELS", "VIEW"),
  hotelsController.getHotelById
);

// Create hotel
router.post(
  "/",
  authMiddleware,
  // checkPermission("HOTELS", "CREATE"),
  hotelsController.createHotel
);

// Update hotel
router.put(
  "/:HOTEL_ID",
  authMiddleware,
  // checkPermission("HOTELS", "EDIT"),
  hotelsController.updateHotel
);

// Soft delete hotel
router.delete(
  "/:HOTEL_ID",
  authMiddleware,
  // checkPermission("HOTELS", "DELETE"),
  hotelsController.deleteHotel
);

// Hotel contracts CRUD
router.get(
  "/:HOTEL_ID/contracts",
  authMiddleware,
  hotelsController.listHotelContracts
);

router.get(
  "/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID",
  authMiddleware,
  hotelsController.getHotelContractById
);

router.post(
  "/:HOTEL_ID/contracts",
  authMiddleware,
  hotelsController.createHotelContract
);

router.put(
  "/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID",
  authMiddleware,
  hotelsController.updateHotelContract
);

router.delete(
  "/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID",
  authMiddleware,
  hotelsController.deleteHotelContract
);

router.get(
  "/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates",
  authMiddleware,
  hotelsController.listHotelContractRates
);

router.get(
  "/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates/:RATE_ID",
  authMiddleware,
  hotelsController.getHotelContractRateById
);

router.post(
  "/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates",
  authMiddleware,
  hotelsController.createHotelContractRate
);

router.put(
  "/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates/:RATE_ID",
  authMiddleware,
  hotelsController.updateHotelContractRate
);

router.delete(
  "/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates/:RATE_ID",
  authMiddleware,
  hotelsController.deleteHotelContractRate
);
// ----------------------------------------------------
// Hotel seasons CRUD (nested under hotel)
// ----------------------------------------------------
router.get(
  "/:HOTEL_ID/seasons",
  authMiddleware,
  // checkPermission("HOTELS", "VIEW"), // optional
  hotelsController.listHotelSeasons
);

router.get(
  "/:HOTEL_ID/seasons/:SEASON_ID",
  authMiddleware,
  // checkPermission("HOTELS", "VIEW"), // optional
  hotelsController.getHotelSeasonById
);

router.post(
  "/:HOTEL_ID/seasons",
  authMiddleware,
  // checkPermission("HOTELS", "CREATE"), // optional
  hotelsController.createHotelSeason
);

router.put(
  "/:HOTEL_ID/seasons/:SEASON_ID",
  authMiddleware,
  // checkPermission("HOTELS", "EDIT"), // optional
  hotelsController.updateHotelSeason
);

router.delete(
  "/:HOTEL_ID/seasons/:SEASON_ID",
  authMiddleware,
  // checkPermission("HOTELS", "DELETE"), // optional
  hotelsController.deleteHotelSeason
);

router.get(
  "/:HOTEL_ID/seasons-with-rates",
  authMiddleware,
  // checkPermission("HOTELS", "VIEW"), // optional
  hotelsController.getHotelSeasonsWithRates
);

module.exports = router;
