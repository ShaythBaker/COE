// src/helpers/attachments_helper.jsx
import { get, post } from "./api_helper";
import {
  CREATE_ATTACHMENT,
  GET_ATTACHMENT_URL, // base: "/api/attachments"
} from "./url_helper";

/**
 * Upload a file to attachments.
 * Expects backend to return e.g.:
 * {
 *   FILE_ID,
 *   FILE_NAME,
 *   url,        // signed s3 url
 *   expiresIn
 * }
 */
export const uploadAttachment = (formData) => {
  return post(CREATE_ATTACHMENT, formData);
};

/**
 * Resolve a FILE_ID -> signed file URL
 * Calls: GET /api/attachments/:FILE_ID/url
 * Response:
 * {
 *   FILE_ID,
 *   FILE_NAME,
 *   url: "https://coe-app-uploads.s3....",
 *   expiresIn: 300
 * }
 */
export const getAttachmentUrl = async (fileId) => {
  if (!fileId) return "";

  const res = await get(`${GET_ATTACHMENT_URL}/${fileId}/url`);
  return res?.url || "";
};

/**
 * Open an attachment in a new tab using the signed URL.
 * This is used by AttachmentUploader and anywhere else we "view" a document.
 */
export const viewAttachment = async (fileId) => {
  if (!fileId) return;

  const url = await getAttachmentUrl(fileId);
  if (!url) return;

  window.open(url, "_blank", "noopener,noreferrer");
};
