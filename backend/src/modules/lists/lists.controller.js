// src/modules/lists/lists.controller.js
const dbService = require("../../core/dbService");

const LISTS_TABLE = "COE_TBL_LISTS";
const LIST_ITEMS_TABLE = "COE_TBL_LIST_ITEMS";

// Helper to get company id from backend (JWT user or session)
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) {
    return req.user.COMPANY_ID;
  }
  if (req.session && req.session.COMPANY_ID) {
    return req.session.COMPANY_ID;
  }
  return null;
}

/**
 * GET /api/lists
 * Optional query: ?ACTIVE_STATUS=1
 */
async function listLists(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const { ACTIVE_STATUS } = req.query;
    const where = {};
    if (ACTIVE_STATUS !== undefined) {
      where.ACTIVE_STATUS = Number(ACTIVE_STATUS);
    }

    const lists = await dbService.find(
      {
        table: LISTS_TABLE,
        where,
        fields: [
          "LIST_ID",
          "LIST_NAME",
          "LIST_KEY",
          "DESCRIPTION",
          "ACTIVE_STATUS",
          "CREATED_AT",
          "UPDATED_AT",
        ],
        orderBy: "LIST_NAME ASC",
      },
      companyId
    );

    return res.json(lists);
  } catch (err) {
    console.error("listLists error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/lists
 * BODY:
 * {
 *   "LIST_NAME": "Countries",
 *   "LIST_KEY": "COUNTRIES",
 *   "DESCRIPTION": "List of countries",
 *   "ACTIVE_STATUS": 1
 * }
 */
async function createList(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const { LIST_NAME, LIST_KEY, DESCRIPTION, ACTIVE_STATUS } = req.body;

    if (!LIST_NAME || !LIST_KEY) {
      return res.status(400).json({
        message: "LIST_NAME and LIST_KEY are required",
      });
    }

    // Ensure LIST_KEY is unique per company
    const existing = await dbService.find(
      {
        table: LISTS_TABLE,
        where: { LIST_KEY },
        limit: 1,
      },
      companyId
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "LIST_KEY already exists" });
    }

    const result = await dbService.insert(
      LISTS_TABLE,
      {
        LIST_NAME,
        LIST_KEY,
        DESCRIPTION: DESCRIPTION || null,
        ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
      },
      companyId
    );

    return res.status(201).json({
      message: "List created",
      LIST_ID: result.insertId,
    });
  } catch (err) {
    console.error("createList error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/lists/:LIST_ID
 * Returns list + its items
 */
async function getListById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const LIST_ID = parseInt(req.params.LIST_ID, 10);
    if (!LIST_ID || Number.isNaN(LIST_ID)) {
      return res.status(400).json({ message: "Invalid LIST_ID" });
    }

    const lists = await dbService.find(
      {
        table: LISTS_TABLE,
        where: { LIST_ID },
        limit: 1,
      },
      companyId
    );

    if (lists.length === 0) {
      return res.status(404).json({ message: "List not found" });
    }

    const items = await dbService.find(
      {
        table: LIST_ITEMS_TABLE,
        where: { LIST_ID },
        fields: [
          "LIST_ITEM_ID",
          "LIST_ID",
          "ITEM_NAME",
          "ACTIVE_STATUS",
          "CREATED_AT",
          "UPDATED_AT",
        ],
        orderBy: "ITEM_NAME ASC",
      },
      companyId
    );

    return res.json({
      LIST: lists[0],
      ITEMS: items,
    });
  } catch (err) {
    console.error("getListById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/lists/:LIST_ID
 * BODY: any subset of:
 * {
 *   "LIST_NAME": "...",
 *   "LIST_KEY": "...",
 *   "DESCRIPTION": "...",
 *   "ACTIVE_STATUS": 0/1
 * }
 */
async function updateList(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const LIST_ID = parseInt(req.params.LIST_ID, 10);
    if (!LIST_ID || Number.isNaN(LIST_ID)) {
      return res.status(400).json({ message: "Invalid LIST_ID" });
    }

    const { LIST_NAME, LIST_KEY, DESCRIPTION, ACTIVE_STATUS } = req.body;

    const lists = await dbService.find(
      {
        table: LISTS_TABLE,
        where: { LIST_ID },
        limit: 1,
      },
      companyId
    );

    if (lists.length === 0) {
      return res.status(404).json({ message: "List not found" });
    }

    const updateData = {};
    if (LIST_NAME !== undefined) updateData.LIST_NAME = LIST_NAME;
    if (LIST_KEY !== undefined) updateData.LIST_KEY = LIST_KEY;
    if (DESCRIPTION !== undefined) updateData.DESCRIPTION = DESCRIPTION;
    if (ACTIVE_STATUS !== undefined) updateData.ACTIVE_STATUS = ACTIVE_STATUS;

    // If LIST_KEY changed, make sure it's unique (per company)
    if (LIST_KEY !== undefined) {
      const existing = await dbService.find(
        {
          table: LISTS_TABLE,
          where: { LIST_KEY },
          limit: 1,
        },
        companyId
      );

      if (existing.length > 0 && existing[0].LIST_ID !== LIST_ID) {
        return res.status(409).json({ message: "LIST_KEY already exists" });
      }
    }

    if (Object.keys(updateData).length > 0) {
      await dbService.update(
        LISTS_TABLE,
        updateData,
        { LIST_ID },
        companyId
      );
    }

    const updated = await dbService.find(
      {
        table: LISTS_TABLE,
        where: { LIST_ID },
        fields: [
          "LIST_ID",
          "LIST_NAME",
          "LIST_KEY",
          "DESCRIPTION",
          "ACTIVE_STATUS",
          "CREATED_AT",
          "UPDATED_AT",
        ],
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "List updated",
      LIST: updated[0],
    });
  } catch (err) {
    console.error("updateList error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/lists/:LIST_ID
 * Soft-delete: set ACTIVE_STATUS = 0 on list and its items
 */
async function deleteList(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const LIST_ID = parseInt(req.params.LIST_ID, 10);
    if (!LIST_ID || Number.isNaN(LIST_ID)) {
      return res.status(400).json({ message: "Invalid LIST_ID" });
    }

    const lists = await dbService.find(
      {
        table: LISTS_TABLE,
        where: { LIST_ID },
        limit: 1,
      },
      companyId
    );

    if (lists.length === 0) {
      return res.status(404).json({ message: "List not found" });
    }

    // Soft delete list
    await dbService.update(
      LISTS_TABLE,
      { ACTIVE_STATUS: 0 },
      { LIST_ID },
      companyId
    );
    // Soft delete items under this list
    await dbService.update(
      LIST_ITEMS_TABLE,
      { ACTIVE_STATUS: 0 },
      { LIST_ID },
      companyId
    );

    return res.json({ message: "List deleted (soft)" });
  } catch (err) {
    console.error("deleteList error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/lists/:LIST_ID/items
 * Optional query: ?ACTIVE_STATUS=1
 */
async function listItems(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const LIST_ID = parseInt(req.params.LIST_ID, 10);
    if (!LIST_ID || Number.isNaN(LIST_ID)) {
      return res.status(400).json({ message: "Invalid LIST_ID" });
    }

    const { ACTIVE_STATUS } = req.query;
    const where = { LIST_ID };
    if (ACTIVE_STATUS !== undefined) {
      where.ACTIVE_STATUS = Number(ACTIVE_STATUS);
    }

    const items = await dbService.find(
      {
        table: LIST_ITEMS_TABLE,
        where,
        fields: [
          "LIST_ITEM_ID",
          "LIST_ID",
          "ITEM_NAME",
          "ACTIVE_STATUS",
          "CREATED_AT",
          "UPDATED_AT",
        ],
        orderBy: "ITEM_NAME ASC",
      },
      companyId
    );

    return res.json(items);
  } catch (err) {
    console.error("listItems error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/lists/:LIST_ID/items
 * BODY:
 * {
 *   "ITEM_NAME": "Jordan",
 *   "ACTIVE_STATUS": 1
 * }
 */
async function createItem(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const LIST_ID = parseInt(req.params.LIST_ID, 10);
    if (!LIST_ID || Number.isNaN(LIST_ID)) {
      return res.status(400).json({ message: "Invalid LIST_ID" });
    }

    const { ITEM_NAME, ACTIVE_STATUS } = req.body;

    if (!ITEM_NAME) {
      return res.status(400).json({ message: "ITEM_NAME is required" });
    }

    // Ensure list exists (for this company)
    const lists = await dbService.find(
      {
        table: LISTS_TABLE,
        where: { LIST_ID },
        limit: 1,
      },
      companyId
    );

    if (lists.length === 0) {
      return res.status(404).json({ message: "List not found" });
    }

    const result = await dbService.insert(
      LIST_ITEMS_TABLE,
      {
        LIST_ID,
        ITEM_NAME,
        ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
      },
      companyId
    );

    return res.status(201).json({
      message: "Item created",
      LIST_ITEM_ID: result.insertId,
    });
  } catch (err) {
    console.error("createItem error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/lists/:LIST_ID/items/:LIST_ITEM_ID
 * BODY: subset of:
 * {
 *   "ITEM_NAME": "...",
 *   "ACTIVE_STATUS": 0/1
 * }
 */
async function updateItem(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const LIST_ID = parseInt(req.params.LIST_ID, 10);
    const LIST_ITEM_ID = parseInt(req.params.LIST_ITEM_ID, 10);

    if (!LIST_ID || Number.isNaN(LIST_ID)) {
      return res.status(400).json({ message: "Invalid LIST_ID" });
    }
    if (!LIST_ITEM_ID || Number.isNaN(LIST_ITEM_ID)) {
      return res.status(400).json({ message: "Invalid LIST_ITEM_ID" });
    }

    const { ITEM_NAME, ACTIVE_STATUS } = req.body;

    const items = await dbService.find(
      {
        table: LIST_ITEMS_TABLE,
        where: { LIST_ITEM_ID, LIST_ID },
        limit: 1,
      },
      companyId
    );

    if (items.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    const updateData = {};
    if (ITEM_NAME !== undefined) updateData.ITEM_NAME = ITEM_NAME;
    if (ACTIVE_STATUS !== undefined) updateData.ACTIVE_STATUS = ACTIVE_STATUS;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(
        LIST_ITEMS_TABLE,
        updateData,
        { LIST_ITEM_ID, LIST_ID },
        companyId
      );
    }

    const updated = await dbService.find(
      {
        table: LIST_ITEMS_TABLE,
        where: { LIST_ITEM_ID, LIST_ID },
        fields: [
          "LIST_ITEM_ID",
          "LIST_ID",
          "ITEM_NAME",
          "ACTIVE_STATUS",
          "CREATED_AT",
          "UPDATED_AT",
        ],
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Item updated",
      ITEM: updated[0],
    });
  } catch (err) {
    console.error("updateItem error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/lists/:LIST_ID/items/:LIST_ITEM_ID
 * Soft delete item (ACTIVE_STATUS = 0)
 */
async function deleteItem(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const LIST_ID = parseInt(req.params.LIST_ID, 10);
    const LIST_ITEM_ID = parseInt(req.params.LIST_ITEM_ID, 10);

    if (!LIST_ID || Number.isNaN(LIST_ID)) {
      return res.status(400).json({ message: "Invalid LIST_ID" });
    }
    if (!LIST_ITEM_ID || Number.isNaN(LIST_ITEM_ID)) {
      return res.status(400).json({ message: "Invalid LIST_ITEM_ID" });
    }

    const items = await dbService.find(
      {
        table: LIST_ITEMS_TABLE,
        where: { LIST_ITEM_ID, LIST_ID },
        limit: 1,
      },
      companyId
    );

    if (items.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    await dbService.update(
      LIST_ITEMS_TABLE,
      { ACTIVE_STATUS: 0 },
      { LIST_ITEM_ID, LIST_ID },
      companyId
    );

    return res.json({ message: "Item deleted (soft)" });
  } catch (err) {
    console.error("deleteItem error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


/**
 * GET /api/lists/by-key/:LIST_KEY
 * or can be wired to any route you want
 *
 * 1) Takes LIST_KEY from params
 * 2) Uses COMPANY_ID from backend (JWT/session)
 * 3) Returns the list and its items
 */
async function getListByKey(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const LIST_KEY = req.params.LIST_KEY || req.query.LIST_KEY;
    if (!LIST_KEY) {
      return res.status(400).json({ message: "LIST_KEY is required" });
    }

    // 1) Find the list by LIST_KEY scoped by COMPANY_ID
    const lists = await dbService.find(
      {
        table: LISTS_TABLE,
        where: { LIST_KEY },
        fields: [
          "LIST_ID",
          "LIST_NAME",
          "LIST_KEY",
          "DESCRIPTION",
          "ACTIVE_STATUS",
          "CREATED_AT",
          "UPDATED_AT",
        ],
        limit: 1,
      },
      companyId
    );

    if (lists.length === 0) {
      return res.status(404).json({ message: "List not found" });
    }

    const list = lists[0];
    const LIST_ID = list.LIST_ID;

    // 2) Get list items by the unique LIST_ID (scoped by COMPANY_ID)
    const items = await dbService.find(
      {
        table: LIST_ITEMS_TABLE,
        where: { LIST_ID },
        fields: [
          "LIST_ITEM_ID",
          "LIST_ID",
          "ITEM_NAME",
          "ACTIVE_STATUS",
          "CREATED_AT",
          "UPDATED_AT",
        ],
        orderBy: "ITEM_NAME ASC",
      },
      companyId
    );

    return res.json({
      LIST: list,
      ITEMS: items,
    });
  } catch (err) {
    console.error("getListByKey error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}



module.exports = {
  listLists,
  createList,
  getListById,
  updateList,
  deleteList,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  getListByKey,
};
