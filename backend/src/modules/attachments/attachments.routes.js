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
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// List current attachments
router.get("/", authMiddleware, attachmentsController.listAttachments);

// Get single attachment by FILE_ID (metadata only)
router.get(
  "/:FILE_ID",
  authMiddleware,
  attachmentsController.getAttachmentById
);

// NEW: Get presigned URL for attachment
router.get(
  "/:FILE_ID/url",
  authMiddleware,
  attachmentsController.getAttachmentPresignedUrl
);

// Create new attachment
router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  attachmentsController.createAttachment
);

// Versioned update of attachment
router.put(
  "/:FILE_ID",
  authMiddleware,
  upload.single("file"),
  attachmentsController.updateAttachment
);

// Logical delete (set ENDA = NOW())
router.delete(
  "/:FILE_ID",
  authMiddleware,
  attachmentsController.deleteAttachment
);

module.exports = router;
