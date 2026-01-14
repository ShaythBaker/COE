const express = require("express");
const placesController = require("./places.controller");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

// Dynamic entrance fee listing (by place or country)
router.get(
  "/entrance-fees",
  authMiddleware,
  placesController.listEntranceFees
);

// Places
router.get("/", authMiddleware, placesController.listPlaces);
router.post("/", authMiddleware, placesController.createPlace);

// Entrance fees under a specific place
router.get(
  "/:PLACE_ID/entrance-fees",
  authMiddleware,
  placesController.listPlaceEntranceFees
);
router.get(
  "/:PLACE_ID/entrance-fees/:PLACE_ENTRANCE_FEE_ID",
  authMiddleware,
  placesController.getPlaceEntranceFeeById
);
router.post(
  "/:PLACE_ID/entrance-fees",
  authMiddleware,
  placesController.createPlaceEntranceFees
);
router.put(
  "/:PLACE_ID/entrance-fees/:PLACE_ENTRANCE_FEE_ID",
  authMiddleware,
  placesController.updatePlaceEntranceFee
);
router.delete(
  "/:PLACE_ID/entrance-fees/:PLACE_ENTRANCE_FEE_ID",
  authMiddleware,
  placesController.deletePlaceEntranceFee
);

// Single place CRUD (keep this AFTER the static /entrance-fees route)
router.get("/:PLACE_ID", authMiddleware, placesController.getPlaceById);
router.put("/:PLACE_ID", authMiddleware, placesController.updatePlace);
router.delete("/:PLACE_ID", authMiddleware, placesController.deletePlace);

module.exports = router;
