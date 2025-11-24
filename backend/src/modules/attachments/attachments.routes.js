// src/modules/attachments/attachments.routes.js
const express = require("express");
const attachmentsController = require("./attachments.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// Module code for RBAC
const MODULE_CODE = "ATTACHMENTS";

// List current attachments
router.get(
  "/",
  authMiddleware,
  checkPermission(MODULE_CODE, "VIEW"),
  attachmentsController.listAttachments
);

// Get single attachment by FILE_ID
router.get(
  "/:FILE_ID",
  authMiddleware,
  checkPermission(MODULE_CODE, "VIEW"),
  attachmentsController.getAttachmentById
);

// Create new attachment
router.post(
  "/",
  authMiddleware,
  checkPermission(MODULE_CODE, "CREATE"),
  attachmentsController.createAttachment
);

// Versioned update of attachment
router.put(
  "/:FILE_ID",
  authMiddleware,
  checkPermission(MODULE_CODE, "EDIT"),
  attachmentsController.updateAttachment
);

// Logical delete (set ENDA = NOW())
router.delete(
  "/:FILE_ID",
  authMiddleware,
  checkPermission(MODULE_CODE, "DELETE"),
  attachmentsController.deleteAttachment
);

module.exports = router;
