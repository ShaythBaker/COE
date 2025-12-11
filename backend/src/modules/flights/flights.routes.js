// modules/flights/flights.routes.js
const express = require("express");
const flightsController = require("./flights.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// Live status by callsign
// GET /api/flights/status/RJA123
router.get(
  "/status/:flightNumber",
  authMiddleware,
  // checkPermission("FLIGHT_STATUS", "VIEW"), // optional if you add module/perm
  flightsController.getFlightStatus
);

// Arrivals by airport
// GET /api/flights/arrivals?airport=EDDF&begin=...&end=...
router.get(
  "/arrivals",
  authMiddleware,
  // checkPermission("FLIGHT_STATUS", "VIEW"),
  flightsController.getArrivalsByAirport
);

// Departures by airport
// GET /api/flights/departures?airport=EDDF&begin=...&end=...
router.get(
  "/departures",
  authMiddleware,
  // checkPermission("FLIGHT_STATUS", "VIEW"),
  flightsController.getDeparturesByAirport
);

// Track by aircraft
// GET /api/flights/track/3c4b26?time=0
router.get(
  "/track/:icao24",
  authMiddleware,
  // checkPermission("FLIGHT_STATUS", "VIEW"),
  flightsController.getTrackByAircraft
);

module.exports = router;
