// src/modules/hotels/hotels.routes.js
const express = require("express");
const hotelsController = require("./hotels.controller");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

// List hotels
router.get("/", authMiddleware, hotelsController.listHotels);

// Get single hotel
router.get("/:HOTEL_ID", authMiddleware, hotelsController.getHotelById);

// Create hotel
router.post("/", authMiddleware, hotelsController.createHotel);

// Update hotel
router.put("/:HOTEL_ID", authMiddleware, hotelsController.updateHotel);

// Soft delete hotel
router.delete("/:HOTEL_ID", authMiddleware, hotelsController.deleteHotel);

// ----------------------------------------------------
// Hotel contracts CRUD (kept as-is)
// ----------------------------------------------------
router.get("/:HOTEL_ID/contracts", authMiddleware, hotelsController.listHotelContracts);

router.get("/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID", authMiddleware, hotelsController.getHotelContractById);

router.post("/:HOTEL_ID/contracts", authMiddleware, hotelsController.createHotelContract);

router.put("/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID", authMiddleware, hotelsController.updateHotelContract);

router.delete("/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID", authMiddleware, hotelsController.deleteHotelContract);

// Contract rates endpoints (deprecated but kept)
router.get("/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates", authMiddleware, hotelsController.listHotelContractRates);

router.get("/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates/:RATE_ID", authMiddleware, hotelsController.getHotelContractRateById);

router.post("/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates", authMiddleware, hotelsController.createHotelContractRate);

router.put("/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates/:RATE_ID", authMiddleware, hotelsController.updateHotelContractRate);

router.delete("/:HOTEL_ID/contracts/:HOTEL_CONTRACT_ID/rates/:RATE_ID", authMiddleware, hotelsController.deleteHotelContractRate);

// ----------------------------------------------------
// Hotel seasons CRUD (nested under hotel)
// ----------------------------------------------------
router.get("/:HOTEL_ID/seasons", authMiddleware, hotelsController.listHotelSeasons);

router.get("/:HOTEL_ID/seasons/:SEASON_ID", authMiddleware, hotelsController.getHotelSeasonById);

router.post("/:HOTEL_ID/seasons", authMiddleware, hotelsController.createHotelSeason);

router.put("/:HOTEL_ID/seasons/:SEASON_ID", authMiddleware, hotelsController.updateHotelSeason);

router.delete("/:HOTEL_ID/seasons/:SEASON_ID", authMiddleware, hotelsController.deleteHotelSeason);

// ----------------------------------------------------
// NEW: Season Rates CRUD (nested under season)
// ----------------------------------------------------
router.get("/:HOTEL_ID/seasons/:SEASON_ID/rates", authMiddleware, hotelsController.listHotelSeasonRates);

router.post("/:HOTEL_ID/seasons/:SEASON_ID/rates", authMiddleware, hotelsController.createHotelSeasonRate);

router.put("/:HOTEL_ID/seasons/:SEASON_ID/rates/:RATE_ID", authMiddleware, hotelsController.updateHotelSeasonRate);

router.delete("/:HOTEL_ID/seasons/:SEASON_ID/rates/:RATE_ID", authMiddleware, hotelsController.deleteHotelSeasonRate);

// ----------------------------------------------------
// Pricing: seasons with nested rates
// Auto-expire: expired seasons not returned
// ----------------------------------------------------
router.get("/:HOTEL_ID/seasons-with-rates", authMiddleware, hotelsController.getHotelSeasonsWithRates);

// ----------------------------------------------------
// Hotel Additional Services CRUD
// ----------------------------------------------------

router.get(
  "/:HOTEL_ID/additional-services",
  authMiddleware,
  hotelsController.listHotelAdditionalServices
);

router.get(
  "/:HOTEL_ID/additional-services/:ADDITIONAL_SERVICE_ID",
  authMiddleware,
  hotelsController.getHotelAdditionalServiceById
);

router.post(
  "/:HOTEL_ID/additional-services",
  authMiddleware,
  hotelsController.createHotelAdditionalService
);

router.put(
  "/:HOTEL_ID/additional-services/:ADDITIONAL_SERVICE_ID",
  authMiddleware,
  hotelsController.updateHotelAdditionalService
);

router.delete(
  "/:HOTEL_ID/additional-services/:ADDITIONAL_SERVICE_ID",
  authMiddleware,
  hotelsController.deleteHotelAdditionalService
);


module.exports = router;
