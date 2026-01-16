// modules/routes/routes.routes.js
const express = require("express");
const routesController = require("./routes.controller");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

// List routes (with places + entrance fees, optional nationality filter)
router.get("/", authMiddleware, routesController.listRoutes);

// Get one route by id (with places + entrance fees, optional nationality filter)
router.get("/:ROUTE_ID", authMiddleware, routesController.getRouteById);

// Create new route (trip) with its places
router.post("/", authMiddleware, routesController.createRoute);



module.exports = router;
