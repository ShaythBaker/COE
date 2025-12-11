// src/core/s3.js
require("dotenv").config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const path = require("path");

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;

if (!REGION || !BUCKET) {
  console.warn(
    "[S3] Missing AWS_REGION or AWS_S3_BUCKET in environment variables"
  );
}

const s3Client = new S3Client({
  region: REGION,
  // credentials from env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
});

/**
 * Upload a buffer to S3 and return { key }
 * NOTE: key is the S3 object key, not a public URL.
 *
 * Key format:
 *   attachments/{COMPANY_ID}/{category}/{timestamp-randomId}{ext}
 *
 * - category: comes from frontend (req.body/category param)
 * - companyId: comes from backend (req.user / req.session)
 */
async function uploadBufferToS3({
  buffer,
  mimeType,
  companyId,     // 👈 from backend (JWT/session)
  originalName,
  category,      // 👈 from frontend
}) {
  if (!buffer) {
    throw new Error("uploadBufferToS3: buffer is required");
  }

  if (!companyId) {
    throw new Error("uploadBufferToS3: companyId (COMPANY_ID) is required");
  }

  const safeCompanyId = String(companyId);
  const safeCategory = category || "general";

  const ext = originalName ? path.extname(originalName) : "";
  const randomId = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();

  // attachments/company_id/file_category/random_id.ext
  const key = `attachments/${safeCompanyId}/${safeCategory}/${timestamp}-${randomId}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType || "application/octet-stream",
  });

  await s3Client.send(command);

  return { key };
}

/**
 * Generate a presigned URL for reading an object by key
 */
async function getPresignedUrl(key, expiresInSeconds = 300) {
  if (!key) {
    throw new Error("getPresignedUrl: key is required");
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  return url;
}

module.exports = {
  uploadBufferToS3,
  getPresignedUrl,
};
