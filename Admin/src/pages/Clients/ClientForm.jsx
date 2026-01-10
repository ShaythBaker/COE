import React, { useMemo, useState } from "react";
import {
  Button,
  Col,
  Form,
  FormFeedback,
  Input,
  Label,
  Row,
  Spinner,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { Formik } from "formik";

import { createClient, updateClient } from "../../store/clients/actions";

// IMPORTANT: replace this with your existing attachments/S3 upload helper.
// Example:
// import { uploadAttachmentToS3 } from "helpers/fakebackend_helper";
async function uploadClientLogoToS3(/* file */) {
  // TODO: call the existing hotel attachment upload function
  // and return FILE_ID
  throw new Error(
    "S3 upload helper not wired yet (reuse Hotels upload helper)."
  );
}

const ClientForm = ({ initialData, countries, onDone }) => {
  const dispatch = useDispatch();
  const { saving } = useSelector((s) => s.Clients);

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFileId, setLogoFileId] = useState(
    initialData?.CLIENT_LOGO ?? null
  );

  const countryOptions = useMemo(() => {
    return (countries || []).map((c) => {
      const id = c.COUNTRY_ID ?? c.ID ?? c.VALUE;
      const name = c.COUNTRY_NAME ?? c.NAME ?? c.LABEL;
      return { id, name };
    });
  }, [countries]);

  const initialValues = {
    CLIENT_NAME: initialData?.CLIENT_NAME || "",
    COUNTRY_ID: initialData?.COUNTRY_ID || "",
    EMAIL: initialData?.EMAIL || "",
    PHONE: initialData?.PHONE || "",
    CONTACT_PERSON_NAME: initialData?.CONTACT_PERSON_NAME || "",
    ACTIVE_STATUS: initialData?.ACTIVE_STATUS ?? 1,
  };

  const validationSchema = Yup.object({
    CLIENT_NAME: Yup.string().required("Client name is required"),
    EMAIL: Yup.string().email("Invalid email").nullable(),
    PHONE: Yup.string().nullable(),
  });

  const onPickLogo = async (file) => {
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    try {
      const fileId = await uploadClientLogoToS3(file);
      setLogoFileId(fileId);
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        const payload = {
          ...values,
          COUNTRY_ID: values.COUNTRY_ID ? Number(values.COUNTRY_ID) : null,
          ACTIVE_STATUS: Number(values.ACTIVE_STATUS),
          CLIENT_LOGO: logoFileId || null,
        };

        // backend expects uppercase fields (you already have them)
        if (initialData?.CLIENT_ID) {
          dispatch(updateClient(initialData.CLIENT_ID, payload));
        } else {
          dispatch(createClient(payload));
        }

        onDone?.();
      }}
    >
      {({
        values,
        handleChange,
        handleBlur,
        handleSubmit,
        errors,
        touched,
      }) => (
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md="8">
              <div className="mb-3">
                <Label>Client Name *</Label>
                <Input
                  name="CLIENT_NAME"
                  value={values.CLIENT_NAME}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  invalid={touched.CLIENT_NAME && !!errors.CLIENT_NAME}
                />
                {touched.CLIENT_NAME && errors.CLIENT_NAME && (
                  <FormFeedback>{errors.CLIENT_NAME}</FormFeedback>
                )}
              </div>
            </Col>

            <Col md="4">
              <div className="mb-3">
                <Label>Status</Label>
                <Input
                  type="select"
                  name="ACTIVE_STATUS"
                  value={values.ACTIVE_STATUS}
                  onChange={handleChange}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </Input>
              </div>
            </Col>

            <Col md="6">
              <div className="mb-3">
                <Label>Country</Label>
                <Input
                  type="select"
                  name="COUNTRY_ID"
                  value={values.COUNTRY_ID}
                  onChange={handleChange}
                >
                  <option value="">Select...</option>
                  {countryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Input>
              </div>
            </Col>

            <Col md="6">
              <div className="mb-3">
                <Label>Contact Person</Label>
                <Input
                  name="CONTACT_PERSON_NAME"
                  value={values.CONTACT_PERSON_NAME}
                  onChange={handleChange}
                />
              </div>
            </Col>

            <Col md="6">
              <div className="mb-3">
                <Label>Email</Label>
                <Input
                  name="EMAIL"
                  value={values.EMAIL}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  invalid={touched.EMAIL && !!errors.EMAIL}
                />
                {touched.EMAIL && errors.EMAIL && (
                  <FormFeedback>{errors.EMAIL}</FormFeedback>
                )}
              </div>
            </Col>

            <Col md="6">
              <div className="mb-3">
                <Label>Phone</Label>
                <Input
                  name="PHONE"
                  value={values.PHONE}
                  onChange={handleChange}
                />
              </div>
            </Col>

            <Col md="12">
              <div className="mb-3">
                <Label>Client Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickLogo(e.target.files?.[0])}
                  disabled={logoUploading}
                />
                <div className="mt-2 d-flex align-items-center gap-3">
                  {(logoUploading || saving) && (
                    <div className="text-muted">
                      <Spinner size="sm" className="me-2" />
                      Uploading...
                    </div>
                  )}
                  {logoFileId && (
                    <span className="badge bg-info">FILE_ID: {logoFileId}</span>
                  )}
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="logo preview"
                      style={{
                        height: 48,
                        width: 48,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  )}
                </div>
              </div>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2">
            <Button
              type="button"
              color="light"
              onClick={onDone}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={saving || logoUploading}
            >
              Save
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ClientForm;
