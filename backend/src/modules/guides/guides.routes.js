// src/modules/guides/guides.routes.js
const express = require("express");
const guidesController = require("./guides.controller");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

// List guides
router.get("/", authMiddleware, guidesController.listGuides);

// Get single guide
router.get("/:GUIDE_ID", authMiddleware, guidesController.getGuideById);

// Create guide
router.post("/", authMiddleware, guidesController.createGuide);

// Update guide
router.put("/:GUIDE_ID", authMiddleware, guidesController.updateGuide);

// Soft delete guide
router.delete("/:GUIDE_ID", authMiddleware, guidesController.deleteGuide);

module.exports = router;
