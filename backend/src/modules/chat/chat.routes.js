// modules/chat/chat.routes.js
const express = require("express");
const chatController = require("./chat.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// Module code for permissions (ensure this module exists in your ACCESS tables)
const MODULE_CODE = "CHAT";

// List chats (DM + groups)
router.get(
  "/chats",
  authMiddleware,
  checkPermission(MODULE_CODE, "VIEW"),
  chatController.listChats
);

// List groups
router.get(
  "/groups",
  authMiddleware,
  checkPermission(MODULE_CODE, "VIEW"),
  chatController.listGroups
);

// List contacts
router.get(
  "/contacts",
  authMiddleware,
  checkPermission(MODULE_CODE, "VIEW"),
  chatController.listContacts
);

// Get messages in room
router.get(
  "/messages/:ROOM_ID",
  authMiddleware,
  checkPermission(MODULE_CODE, "VIEW"),
  chatController.getMessages
);

// Send message (new or existing room)
router.post(
  "/messages",
  authMiddleware,
  checkPermission(MODULE_CODE, "CREATE"),
  chatController.sendMessage
);

// Delete message
router.delete(
  "/messages/:MESSAGE_ID",
  authMiddleware,
  checkPermission(MODULE_CODE, "DELETE"),
  chatController.deleteMessage
);

// Notifications
router.get(
  "/notifications",
  authMiddleware,
  checkPermission(MODULE_CODE, "VIEW"),
  chatController.listNotifications
);

router.post(
  "/notifications/read",
  authMiddleware,
  checkPermission(MODULE_CODE, "EDIT"),
  chatController.markNotificationsRead
);

module.exports = router;
