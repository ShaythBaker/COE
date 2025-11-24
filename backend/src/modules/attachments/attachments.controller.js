// src/modules/attachments/attachments.controller.js
const dbService = require("../../core/dbService");
const pool = require("../../core/db");

const ATTACHMENTS_TABLE = "COE_TBL_ATTACHMENTS";
const FAR_FUTURE_ENDA = "9999-12-31 00:00:00";

/**
 * GET /api/attachments
 * Optional query:
 *   ?USER_ID=...
 *   ?FILE_CATEGORY=...
 *
 * Returns only "current" rows where NOW() is between BEGDA and ENDA
 */
async function listAttachments(req, res) {
  try {
    const { USER_ID, FILE_CATEGORY } = req.query;
    const now = new Date();

    let sql = `
      SELECT
        FILE_ID,
        FILE_NAME,
        FILE_URL,
        FILE_TYPE,
        USER_ID,
        FILE_CATEGORY,
        CREATED_BY,
        CREATED_ON,
        UPDATED_ON,
        BEGDA,
        ENDA
      FROM ${ATTACHMENTS_TABLE}
      WHERE BEGDA <= ?
        AND (ENDA IS NULL OR ENDA >= ?)
    `;

    const params = [now, now];

    if (USER_ID) {
      sql += " AND USER_ID = ?";
      params.push(USER_ID);
    }

    if (FILE_CATEGORY) {
      sql += " AND FILE_CATEGORY = ?";
      params.push(FILE_CATEGORY);
    }

    sql += " ORDER BY CREATED_ON DESC";

    const [rows] = await pool.query(sql, params);

    return res.json(rows);
  } catch (err) {
    console.error("listAttachments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/attachments/:FILE_ID
 * Returns a single row by primary key (any version)
 */
async function getAttachmentById(req, res) {
  try {
    const FILE_ID = parseInt(req.params.FILE_ID, 10);

    if (!FILE_ID || Number.isNaN(FILE_ID)) {
      return res.status(400).json({ message: "Invalid FILE_ID" });
    }

    const rows = await dbService.find({
      table: ATTACHMENTS_TABLE,
      where: { FILE_ID },
      limit: 1,
    });

    if (!rows.length) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getAttachmentById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/attachments
 *
 * BODY:
 * {
 *   "FILE_NAME": "file.pdf",
 *   "FILE_URL": "/path/file.pdf",
 *   "FILE_TYPE": "application/pdf",
 *   "USER_ID": "12345",
 *   "FILE_CATEGORY": "CV"
 * }
 *
 * Rules:
 * - CREATED_BY = session user (req.user.USER_ID)
 * - BEGDA = NOW() (always, frontend should NOT send it)
 * - ENDA  = 9999-12-31 00:00:00
 */
async function createAttachment(req, res) {
  try {
    const {
      FILE_NAME,
      FILE_URL,
      FILE_TYPE,
      USER_ID,
      FILE_CATEGORY,
    } = req.body;

    if (!FILE_NAME || !FILE_URL || !FILE_TYPE || !USER_ID) {
      return res.status(400).json({
        message: "FILE_NAME, FILE_URL, FILE_TYPE, and USER_ID are required",
      });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = new Date();

    const result = await dbService.insert(ATTACHMENTS_TABLE, {
      FILE_NAME,
      FILE_URL,
      FILE_TYPE,
      USER_ID,
      FILE_CATEGORY: FILE_CATEGORY || null,
      CREATED_BY: userFromToken.USER_ID,
      BEGDA: now,               // always current time
      ENDA: FAR_FUTURE_ENDA,    // open-ended validity
    });

    return res.status(201).json({
      message: "Attachment created",
      FILE_ID: result.insertId,
    });
  } catch (err) {
    console.error("createAttachment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/attachments/:FILE_ID
 *
 * Versioned "update":
 * - We do NOT modify existing row.
 * - We set ENDA of old row to NOW() (+ UPDATED_ON = NOW()).
 * - Then insert a NEW row with updated data and:
 *     BEGDA = NOW(), ENDA = 9999-12-31 00:00:00
 *
 * BODY: any subset of
 * {
 *   "FILE_NAME": "...",
 *   "FILE_URL": "...",
 *   "FILE_TYPE": "...",
 *   "USER_ID": "...",
 *   "FILE_CATEGORY": "..."
 * }
 */
async function updateAttachment(req, res) {
  try {
    const FILE_ID = parseInt(req.params.FILE_ID, 10);

    if (!FILE_ID || Number.isNaN(FILE_ID)) {
      return res.status(400).json({ message: "Invalid FILE_ID" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1) Get the current record from DB by ID
    const existingRows = await dbService.find({
      table: ATTACHMENTS_TABLE,
      where: { FILE_ID },
      limit: 1,
    });

    if (!existingRows.length) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const oldRow = existingRows[0];

    // Step 1: close the existing record
    const now = new Date();

    await dbService.update(
      ATTACHMENTS_TABLE,
      {
        ENDA: now,                      // delimits the old record
        UPDATED_BY: userFromToken.USER_ID, // logged-in user
        UPDATED_ON: now,                // same as ENDA
      },
      { FILE_ID }
    );

    // Step 2: insert the new record
    // Body can contain any subset of fields; fallback to old values if not provided
    const {
      FILE_NAME,
      FILE_URL,
      FILE_TYPE,
      USER_ID,
      FILE_CATEGORY,
    } = req.body;

    const newRow = {
      FILE_NAME: FILE_NAME !== undefined ? FILE_NAME : oldRow.FILE_NAME,
      FILE_URL: FILE_URL !== undefined ? FILE_URL : oldRow.FILE_URL,
      FILE_TYPE: FILE_TYPE !== undefined ? FILE_TYPE : oldRow.FILE_TYPE,
      USER_ID: USER_ID !== undefined ? USER_ID : oldRow.USER_ID,
      FILE_CATEGORY:
        FILE_CATEGORY !== undefined ? FILE_CATEGORY : oldRow.FILE_CATEGORY,
      CREATED_BY: userFromToken.USER_ID, // who created this new version
      BEGDA: now,                        // current time for new record
      ENDA: FAR_FUTURE_ENDA,             // open-ended
    };

    const insertResult = await dbService.insert(ATTACHMENTS_TABLE, newRow);

    return res.json({
      message: "Attachment updated (old record delimited, new record inserted)",
      OLD_FILE_ID: FILE_ID,
      NEW_FILE_ID: insertResult.insertId,
    });
  } catch (err) {
    console.error("updateAttachment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/attachments/:FILE_ID
 *
 * Logical delete:
 * - Only sets ENDA = NOW(), UPDATED_ON = NOW()
 */
async function deleteAttachment(req, res) {
  try {
    const FILE_ID = parseInt(req.params.FILE_ID, 10);

    if (!FILE_ID || Number.isNaN(FILE_ID)) {
      return res.status(400).json({ message: "Invalid FILE_ID" });
    }

    const existingRows = await dbService.find({
      table: ATTACHMENTS_TABLE,
      where: { FILE_ID },
      limit: 1,
    });

    if (!existingRows.length) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const now = new Date();

    await dbService.update(
      ATTACHMENTS_TABLE,
      { ENDA: now, UPDATED_ON: now },
      { FILE_ID }
    );

    return res.json({ message: "Attachment deleted (ended)" });
  } catch (err) {
    console.error("deleteAttachment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listAttachments,
  getAttachmentById,
  createAttachment,
  updateAttachment,
  deleteAttachment,
};
