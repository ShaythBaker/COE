// src/modules/lists/lists.routes.js
const express = require("express");
const listsController = require("./lists.controller");
const authMiddleware = require("../../middleware/authMiddleware");
const { checkPermission } = require("../../middleware/permissionMiddleware");

const router = express.Router();

// Lists
router.get("/", authMiddleware, listsController.listLists);

router.post("/", authMiddleware, listsController.createList);

router.get("/:LIST_ID", authMiddleware, listsController.getListById);

router.put("/:LIST_ID", authMiddleware, listsController.updateList);

router.delete("/:LIST_ID", authMiddleware, listsController.deleteList);

// List items under a specific list
router.get("/:LIST_ID/items", authMiddleware, listsController.listItems);

router.post("/:LIST_ID/items", authMiddleware, listsController.createItem);

router.put(
  "/:LIST_ID/items/:LIST_ITEM_ID",
  authMiddleware,
  listsController.updateItem
);

router.delete(
  "/:LIST_ID/items/:LIST_ITEM_ID",
  authMiddleware,
  listsController.deleteItem
);

module.exports = router;
