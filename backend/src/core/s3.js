// src/core/s3.js
require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
  // Credentials are automatically picked from env:
  // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
});

/**
 * Upload a buffer to S3 and return { key, url }
 */
async function uploadBufferToS3({
  buffer,
  mimeType,
  userId,
  originalName,
  category,
}) {
  if (!buffer) {
    throw new Error("uploadBufferToS3: buffer is required");
  }

  const safeUserId = userId || "anonymous";
  const safeCategory = category || "general";

  const ext = originalName ? path.extname(originalName) : "";
  const randomId = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();

  const key = `attachments/${safeUserId}/${safeCategory}/${timestamp}-${randomId}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType || "application/octet-stream",
  });

  await s3Client.send(command);

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return { key, url };
}

module.exports = {
  uploadBufferToS3,
};
