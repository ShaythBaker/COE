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

module.exports = router;
