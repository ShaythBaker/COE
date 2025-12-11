// src/modules/attachments/attachments.controller.js
const dbService = require("../../core/dbService");
const { uploadBufferToS3, getPresignedUrl } = require("../../core/s3");

const ATTACHMENTS_TABLE = "COE_TBL_ATTACHMENTS";
const FAR_FUTURE_ENDA = "9999-12-31 00:00:00";

// Helper: COMPANY_ID from JWT user or session (backend only)
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) return req.user.COMPANY_ID;
  if (req.session && req.session.COMPANY_ID) return req.session.COMPANY_ID;
  return null;
}

/**
 * GET /api/attachments
 * Optional query:
 *   ?USER_ID=...
 *   ?FILE_CATEGORY=...
 *
 * Returns only "current" rows where NOW() is between BEGDA and ENDA
 * NOTE: FILE_URL here is actually the S3 KEY, not direct URL.
 */
async function listAttachments(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const { USER_ID, FILE_CATEGORY } = req.query;
    const where = {};

    if (USER_ID) {
      where.USER_ID = USER_ID;
    }

    if (FILE_CATEGORY) {
      where.FILE_CATEGORY = FILE_CATEGORY;
    }

    const rows = await dbService.find(
      {
        table: ATTACHMENTS_TABLE,
        where,
        fields: [
          "FILE_ID",
          "FILE_NAME",
          "FILE_URL", // S3 key
          "FILE_TYPE",
          "USER_ID",
          "FILE_CATEGORY",
          "FILE_DESCRIPTION",
          "CREATED_BY",
          "CREATED_ON",
          "UPDATED_ON",
          "BEGDA",
          "ENDA",
        ],
        orderBy: "CREATED_ON DESC",
      },
      companyId
    );

    const now = new Date();

    // Apply BEGDA/ENDA filter in JS
    const currentRows = rows.filter((r) => {
      const begda = r.BEGDA ? new Date(r.BEGDA) : null;
      const enda = r.ENDA ? new Date(r.ENDA) : null;

      const begdaOk = !begda || begda <= now;
      const endaOk = !enda || enda >= now;

      return begdaOk && endaOk;
    });

    return res.json(currentRows);
  } catch (err) {
    console.error("listAttachments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/attachments/:FILE_ID
 * Returns a single row by primary key (any version)
 * NOTE: FILE_URL here is actually the S3 KEY, not direct URL.
 */
async function getAttachmentById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const FILE_ID = parseInt(req.params.FILE_ID, 10);

    if (!FILE_ID || Number.isNaN(FILE_ID)) {
      return res.status(400).json({ message: "Invalid FILE_ID" });
    }

    const rows = await dbService.find(
      {
        table: ATTACHMENTS_TABLE,
        where: { FILE_ID },
        limit: 1,
      },
      companyId
    );

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
 * GET /api/attachments/:FILE_ID/url
 * Returns a short-lived presigned URL for downloading the file.
 */
async function getAttachmentPresignedUrl(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const FILE_ID = parseInt(req.params.FILE_ID, 10);

    if (!FILE_ID || Number.isNaN(FILE_ID)) {
      return res.status(400).json({ message: "Invalid FILE_ID" });
    }

    const rows = await dbService.find(
      {
        table: ATTACHMENTS_TABLE,
        where: { FILE_ID },
        limit: 1,
      },
      companyId
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const attachment = rows[0];

    if (!attachment.FILE_URL) {
      return res.status(400).json({ message: "Attachment has no S3 key" });
    }

    // FILE_URL contains the S3 key
    const key = attachment.FILE_URL;

    // 5 minutes validity; adjust if you like
    const expiresIn = 300;
    const url = await getPresignedUrl(key, expiresIn);

    return res.json({
      FILE_ID,
      FILE_NAME: attachment.FILE_NAME,
      url,
      expiresIn,
    });
  } catch (err) {
    console.error("getAttachmentPresignedUrl error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/attachments
 *
 * Content-Type: multipart/form-data
 * Fields:
 *   file           -> the uploaded file (required)
 *   USER_ID        -> user ID (required - owner/subject of file)
 *   FILE_CATEGORY  -> optional category, e.g. "CV" (from frontend)
 *   FILE_NAME      -> optional custom display name; defaults to original filename
 *
 * Rules:
 * - File is uploaded to S3.
 * - S3 KEY format: attachments/{COMPANY_ID}/{FILE_CATEGORY}/timestamp-random.ext
 * - FILE_URL = S3 OBJECT KEY (not public URL)
 * - FILE_TYPE = file.mimetype
 * - CREATED_BY = session user (req.user.USER_ID)
 * - BEGDA = NOW()
 * - ENDA  = 9999-12-31 00:00:00
 */
async function createAttachment(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const file = req.file;
    const {
      USER_ID,
      FILE_CATEGORY,
      FILE_DESCRIPTION,
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

    // Upload to S3 (company-based path)
    const { originalname, mimetype, buffer } = file;

    const { key } = await uploadBufferToS3({
      buffer,
      mimeType: mimetype,
      companyId, // 👈 from backend
      originalName: originalname,
      category: FILE_CATEGORY, // 👈 from frontend
    });

    const dbFileName = FILE_NAME || originalname || "file";

    const result = await dbService.insert(
      ATTACHMENTS_TABLE,
      {
        FILE_NAME: dbFileName,
        FILE_URL: key, // store the S3 key
        FILE_TYPE: mimetype,
        USER_ID,
        FILE_CATEGORY: FILE_CATEGORY || null,
        FILE_DESCRIPTION: FILE_DESCRIPTION || null,
        CREATED_BY: userFromToken.USER_ID,
        BEGDA: now,
        ENDA: FAR_FUTURE_ENDA,
      },
      companyId
    );

    // Optionally return a presigned URL immediately (short-lived)
    const expiresIn = 300;
    const presignedUrl = await getPresignedUrl(key, expiresIn);

    return res.status(201).json({
      message: "Attachment created",
      FILE_ID: result.insertId,
      S3_KEY: key,
      url: presignedUrl,
      expiresIn,
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
 * - Close old row by setting ENDA + UPDATED_ON
 * - Insert new row with BEGDA = NOW, ENDA = far future
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
 * If a new file is present, it is uploaded to S3 => new FILE_URL (KEY) and FILE_TYPE.
 * Otherwise, we keep the old FILE_URL/FILE_TYPE.
 */
async function updateAttachment(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const FILE_ID = parseInt(req.params.FILE_ID, 10);

    if (!FILE_ID || Number.isNaN(FILE_ID)) {
      return res.status(400).json({ message: "Invalid FILE_ID" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1) Get the current record from DB by ID (scoped by COMPANY_ID)
    const existingRows = await dbService.find(
      {
        table: ATTACHMENTS_TABLE,
        where: { FILE_ID },
        limit: 1,
      },
      companyId
    );

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
      { FILE_ID },
      companyId
    );

    // Step 2: insert the new record
    const file = req.file;
    const { FILE_NAME, USER_ID, FILE_CATEGORY, FILE_DESCRIPTION } = req.body;

    let newFileName = oldRow.FILE_NAME;
    let newFileKey = oldRow.FILE_URL; // keep old key by default
    let newFileType = oldRow.FILE_TYPE;

    // If a new file is uploaded, push it to S3
    if (file) {
      const { originalname, mimetype, buffer } = file;

      const { key } = await uploadBufferToS3({
        buffer,
        mimeType: mimetype,
        companyId, // 👈 backend
        originalName: originalname,
        category: FILE_CATEGORY || oldRow.FILE_CATEGORY, // 👈 frontend/old
      });

      newFileName = FILE_NAME || originalname || oldRow.FILE_NAME;
      newFileKey = key;
      newFileType = mimetype;
    } else {
      // No new file – only metadata update
      if (FILE_NAME !== undefined) newFileName = FILE_NAME;
    }

    const newRow = {
      FILE_NAME: newFileName,
      FILE_URL: newFileKey, // S3 key
      FILE_TYPE: newFileType,
      USER_ID: USER_ID !== undefined ? USER_ID : oldRow.USER_ID,
      FILE_CATEGORY:
        FILE_CATEGORY !== undefined ? FILE_CATEGORY : oldRow.FILE_CATEGORY,
      FILE_CATEGORY:
        FILE_DESCRIPTION !== undefined
          ? FILE_DESCRIPTION
          : oldRow.FILE_DESCRIPTION,
      CREATED_BY: userFromToken.USER_ID, // who created this new version
      BEGDA: now,
      ENDA: FAR_FUTURE_ENDA,
    };

    const insertResult = await dbService.insert(
      ATTACHMENTS_TABLE,
      newRow,
      companyId
    );

    const expiresIn = 300;
    const presignedUrl = await getPresignedUrl(newFileKey, expiresIn);

    return res.json({
      message: "Attachment updated (old record delimited, new record inserted)",
      OLD_FILE_ID: FILE_ID,
      NEW_FILE_ID: insertResult.insertId,
      S3_KEY: newFileKey,
      url: presignedUrl,
      expiresIn,
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
 * - File remains in S3 (can add real delete later if you want).
 */
async function deleteAttachment(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const FILE_ID = parseInt(req.params.FILE_ID, 10);

    if (!FILE_ID || Number.isNaN(FILE_ID)) {
      return res.status(400).json({ message: "Invalid FILE_ID" });
    }

    const existingRows = await dbService.find(
      {
        table: ATTACHMENTS_TABLE,
        where: { FILE_ID },
        limit: 1,
      },
      companyId
    );

    if (!existingRows.length) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const now = new Date();

    await dbService.update(
      ATTACHMENTS_TABLE,
      { ENDA: now, UPDATED_ON: now },
      { FILE_ID },
      companyId
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
  getAttachmentPresignedUrl,
  createAttachment,
  updateAttachment,
  deleteAttachment,
};
