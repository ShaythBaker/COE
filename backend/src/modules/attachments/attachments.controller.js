// src/modules/attachments/attachments.controller.js
const dbService = require("../../core/dbService");
const pool = require("../../core/db");
const { uploadBufferToS3 } = require("../../core/s3");

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
 * Content-Type: multipart/form-data
 * Fields:
 *   file           -> the uploaded file (required)
 *   USER_ID        -> user ID (required)
 *   FILE_CATEGORY  -> optional category, e.g. "CV"
 *   FILE_NAME      -> optional custom display name; defaults to original filename
 *
 * Rules:
 * - File is uploaded to S3.
 * - FILE_URL = S3 public URL
 * - FILE_TYPE = file.mimetype
 * - CREATED_BY = session user (req.user.USER_ID)
 * - BEGDA = NOW()
 * - ENDA  = 9999-12-31 00:00:00
 */
async function createAttachment(req, res) {
  try {
    const file = req.file;
    const {
      USER_ID,
      FILE_CATEGORY,
      FILE_NAME, // optional custom label
    } = req.body;

    if (!file) {
      return res.status(400).json({ message: "file is required" });
    }

    if (!USER_ID) {
      return res.status(400).json({ message: "USER_ID is required" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = new Date();

    // Upload to S3
    const { originalname, mimetype, buffer } = file;

    const uploadResult = await uploadBufferToS3({
      buffer,
      mimeType: mimetype,
      userId: USER_ID,
      originalName: originalname,
      category: FILE_CATEGORY,
    });

    const dbFileName = FILE_NAME || originalname || "file";

    const result = await dbService.insert(ATTACHMENTS_TABLE, {
      FILE_NAME: dbFileName,
      FILE_URL: uploadResult.url,
      FILE_TYPE: mimetype,
      USER_ID,
      FILE_CATEGORY: FILE_CATEGORY || null,
      CREATED_BY: userFromToken.USER_ID,
      BEGDA: now,
      ENDA: FAR_FUTURE_ENDA,
    });

    return res.status(201).json({
      message: "Attachment created",
      FILE_ID: result.insertId,
      FILE_URL: uploadResult.url,
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
 * Content-Type: multipart/form-data
 * BODY: any subset of fields + optional file:
 * {
 *   file: (optional new file),
 *   "FILE_NAME": "...",
 *   "USER_ID": "...",
 *   "FILE_CATEGORY": "..."
 * }
 *
 * If a new file is present, it is uploaded to S3 and new FILE_URL/FILE_TYPE are used.
 * Otherwise, old FILE_URL/FILE_TYPE are preserved.
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
        ENDA: now,
        UPDATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
      },
      { FILE_ID }
    );

    // Step 2: insert the new record
    const file = req.file;
    const {
      FILE_NAME,
      USER_ID,
      FILE_CATEGORY,
    } = req.body;

    let newFileName = oldRow.FILE_NAME;
    let newFileUrl = oldRow.FILE_URL;
    let newFileType = oldRow.FILE_TYPE;

    // If a new file is uploaded, push it to S3
    if (file) {
      const { originalname, mimetype, buffer } = file;

      const uploadResult = await uploadBufferToS3({
        buffer,
        mimeType: mimetype,
        userId: USER_ID || oldRow.USER_ID,
        originalName: originalname,
        category: FILE_CATEGORY || oldRow.FILE_CATEGORY,
      });

      newFileName = FILE_NAME || originalname || oldRow.FILE_NAME;
      newFileUrl = uploadResult.url;
      newFileType = mimetype;
    } else {
      // No new file – only metadata update
      if (FILE_NAME !== undefined) newFileName = FILE_NAME;
    }

    const newRow = {
      FILE_NAME: newFileName,
      FILE_URL: newFileUrl,
      FILE_TYPE: newFileType,
      USER_ID: USER_ID !== undefined ? USER_ID : oldRow.USER_ID,
      FILE_CATEGORY:
        FILE_CATEGORY !== undefined ? FILE_CATEGORY : oldRow.FILE_CATEGORY,
      CREATED_BY: userFromToken.USER_ID, // who created this new version
      BEGDA: now,
      ENDA: FAR_FUTURE_ENDA,
    };

    const insertResult = await dbService.insert(ATTACHMENTS_TABLE, newRow);

    return res.json({
      message: "Attachment updated (old record delimited, new record inserted)",
      OLD_FILE_ID: FILE_ID,
      NEW_FILE_ID: insertResult.insertId,
      FILE_URL: newRow.FILE_URL,
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
 * - (S3 object is NOT deleted — you can add that later if needed.)
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
