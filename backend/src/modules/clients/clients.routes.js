// src/modules/clients/clients.routes.js
const express = require("express");
const clientsController = require("./clients.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// List clients
router.get(
  "/",
  authMiddleware,
  checkPermission("CLIENTS", "VIEW"),
  clientsController.listClients
);

// Get single client
router.get(
  "/:CLIENT_ID",
  authMiddleware,
  checkPermission("CLIENTS", "VIEW"),
  clientsController.getClientById
);

// Create client
router.post(
  "/",
  authMiddleware,
  checkPermission("CLIENTS", "CREATE"),
  clientsController.createClient
);

// Update client
router.put(
  "/:CLIENT_ID",
  authMiddleware,
  checkPermission("CLIENTS", "EDIT"),
  clientsController.updateClient
);

// Soft delete client
router.delete(
  "/:CLIENT_ID",
  authMiddleware,
  checkPermission("CLIENTS", "DELETE"),
  clientsController.deleteClient
);

module.exports = router;
