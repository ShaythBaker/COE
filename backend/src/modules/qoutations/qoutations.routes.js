// src/modules/qoutations/qoutations.routes.js
const express = require("express");
const qoutationsController = require("./qoutations.controller");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

// Create a new qoutation
router.post("/", authMiddleware, qoutationsController.createQoutation);

module.exports = router;
