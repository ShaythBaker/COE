// src/components/Common/AttachmentUploader.jsx
import React, { useState } from "react";
import { Button, Spinner } from "reactstrap";
import {
  uploadAttachment,
  viewAttachment,
} from "../../helpers/attachments_helper";

const AttachmentUploader = ({
  userId,
  category,
  fileId,
  fileName,
  onUploaded,
  accept,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();

      // 👇 Match Postman exactly:
      // USER_ID, FILE_CATEGORY, FILE_NAME, file
      formData.append("USER_ID", String(userId || ""));
      formData.append("FILE_CATEGORY", String(category || ""));
      formData.append("FILE_NAME", file.name);
      formData.append("file", file);

      const res = await uploadAttachment(formData);
      // Expected: { message, FILE_ID, S3_KEY, url, expiresIn }
      if (onUploaded) onUploaded(res);
    } catch (error) {
      console.error("Attachment upload failed", error);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleView = () => {
    if (!fileId) return;
    viewAttachment(fileId);
  };

  return (
    <div className="d-flex flex-column gap-2">
      <div className="d-flex align-items-center gap-2">
        <label className="btn btn-light mb-0">
          {uploading ? (
            <>
              <Spinner size="sm" className="me-1" />
              Uploading...
            </>
          ) : (
            "Upload file"
          )}
          <input
            type="file"
            hidden
            accept={accept || "*/*"}
            onChange={handleFileChange}
          />
        </label>

        {fileId && (
          <Button
            type="button"
            color="link"
            className="p-0"
            onClick={handleView}
          >
            View file
          </Button>
        )}
      </div>

      {fileName && (
        <small className="text-muted">
          Current file: <strong>{fileName}</strong>
        </small>
      )}
    </div>
  );
};

export default AttachmentUploader;
