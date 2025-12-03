// src/modules/attachments/attachments.routes.js
const express = require("express");
const multer = require("multer");
const attachmentsController = require("./attachments.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// In-memory storage for S3 uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // 10 MB example, adjust to your needs
    fileSize: 10 * 1024 * 1024,
  },
});

// If you want to enforce RBAC later, uncomment and configure:
// const MODULE_CODE = "ATTACHMENTS";

// List current attachments
router.get(
  "/",
  authMiddleware,
  // checkPermission(MODULE_CODE, "VIEW"),
  attachmentsController.listAttachments
);

// Get single attachment by FILE_ID
router.get(
  "/:FILE_ID",
  authMiddleware,
  // checkPermission(MODULE_CODE, "VIEW"),
  attachmentsController.getAttachmentById
);

// Create new attachment (multipart/form-data)
router.post(
  "/",
  authMiddleware,
  // checkPermission(MODULE_CODE, "CREATE"),
  upload.single("file"),
  attachmentsController.createAttachment
);

// Versioned update of attachment (multipart/form-data, file optional)
router.put(
  "/:FILE_ID",
  authMiddleware,
  // checkPermission(MODULE_CODE, "EDIT"),
  upload.single("file"),
  attachmentsController.updateAttachment
);

// Logical delete (set ENDA = NOW())
router.delete(
  "/:FILE_ID",
  authMiddleware,
  // checkPermission(MODULE_CODE, "DELETE"),
  attachmentsController.deleteAttachment
);

module.exports = router;
