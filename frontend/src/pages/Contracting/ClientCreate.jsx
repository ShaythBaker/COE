import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Spinner,
  FormGroup,
  Label,
  Input,
  Button,
  FormFeedback,
} from "reactstrap";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import AttachmentUploader from "../../components/Common/AttachmentUploader";

import {
  getSystemListItems,
  createClient,
} from "/src/helpers/fakebackend_helper";
import { useNavigate } from "react-router-dom";

const ClientSchema = Yup.object().shape({
  CLIENT_NAME: Yup.string().required("Client name is required"),
  ACTIVE_STATUS: Yup.string().oneOf(["0", "1"]).required("Status is required"),
});

const ClientCreateInner = () => {
  document.title = "Create Client | Travco - COE";

  const navigate = useNavigate();

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState(null);

  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);

  const getCurrentUserId = () => {
    try {
      const raw =
        sessionStorage.getItem("authUser") || localStorage.getItem("authUser");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed.USER_ID || parsed.user_id || parsed.id || "";
    } catch {
      return "";
    }
  };

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    const fetchCountries = async () => {
      setCountriesLoading(true);
      setCountriesError(null);

      try {
        const countriesRes = await getSystemListItems("COUNTRIES");
        setCountries(countriesRes?.ITEMS || []);
      } catch (err) {
        console.error("Failed to load countries", err);
        setCountriesError("Failed to load countries");
      } finally {
        setCountriesLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const initialValues = {
    CLIENT_NAME: "",
    COUNTRY_ID: "",
    EMAIL: "",
    PHONE: "",
    CONTACT_PERSON_NAME: "",
    ACTIVE_STATUS: "1",

    CLIENT_LOGO_FILE_ID: null,
    CLIENT_LOGO_FILE_NAME: "",
  };

  const handleSubmit = async (values) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      const payload = {
        CLIENT_NAME: values.CLIENT_NAME,
        COUNTRY_ID: values.COUNTRY_ID ? Number(values.COUNTRY_ID) : null,
        EMAIL: values.EMAIL || "",
        PHONE: values.PHONE || "",
        CONTACT_PERSON_NAME: values.CONTACT_PERSON_NAME || "",
        CLIENT_LOGO: values.CLIENT_LOGO_FILE_ID || null,
        ACTIVE_STATUS: Number(values.ACTIVE_STATUS),
      };

      await createClient(payload);

      setSubmitSuccess("Client created successfully.");
      navigate("/contracting/clients");
    } catch (err) {
      console.error("Failed to create client", err);
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to create client";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Create Client" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                {submitError && (
                  <Alert color="danger" className="mb-3">
                    {submitError}
                  </Alert>
                )}
                {submitSuccess && (
                  <Alert color="success" className="mb-3">
                    {submitSuccess}
                  </Alert>
                )}

                {countriesLoading && (
                  <div className="mb-3">
                    <Spinner size="sm" className="me-2" />
                    Loading countries...
                  </div>
                )}

                <Formik
                  initialValues={initialValues}
                  validationSchema={ClientSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched, setFieldValue, values }) => (
                    <Form>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="CLIENT_NAME">Client Name</Label>
                            <Field
                              as={Input}
                              id="CLIENT_NAME"
                              name="CLIENT_NAME"
                              invalid={
                                touched.CLIENT_NAME && !!errors.CLIENT_NAME
                              }
                            />
                            {touched.CLIENT_NAME && errors.CLIENT_NAME && (
                              <FormFeedback>{errors.CLIENT_NAME}</FormFeedback>
                            )}
                          </FormGroup>
                        </Col>

                        <Col md={3}>
                          <FormGroup>
                            <Label for="COUNTRY_ID">Country</Label>
                            <Input
                              type="select"
                              id="COUNTRY_ID"
                              name="COUNTRY_ID"
                              value={values.COUNTRY_ID}
                              onChange={(e) =>
                                setFieldValue("COUNTRY_ID", e.target.value)
                              }
                              disabled={countriesLoading}
                            >
                              <option value="">Select country</option>
                              {countries.map((c) => (
                                <option
                                  key={c.LIST_ITEM_ID}
                                  value={c.LIST_ITEM_ID}
                                >
                                  {c.ITEM_NAME}
                                </option>
                              ))}
                            </Input>
                            {countriesError && (
                              <small className="text-danger">
                                {countriesError}
                              </small>
                            )}
                          </FormGroup>
                        </Col>

                        <Col md={3}>
                          <FormGroup>
                            <Label for="ACTIVE_STATUS">Status</Label>
                            <Input
                              type="select"
                              id="ACTIVE_STATUS"
                              name="ACTIVE_STATUS"
                              value={values.ACTIVE_STATUS}
                              onChange={(e) =>
                                setFieldValue("ACTIVE_STATUS", e.target.value)
                              }
                              invalid={
                                touched.ACTIVE_STATUS && !!errors.ACTIVE_STATUS
                              }
                            >
                              <option value="1">Active</option>
                              <option value="0">Inactive</option>
                            </Input>
                            {touched.ACTIVE_STATUS && errors.ACTIVE_STATUS && (
                              <FormFeedback>
                                {errors.ACTIVE_STATUS}
                              </FormFeedback>
                            )}
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="EMAIL">Email</Label>
                            <Field
                              as={Input}
                              id="EMAIL"
                              name="EMAIL"
                              type="email"
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="PHONE">Phone</Label>
                            <Field as={Input} id="PHONE" name="PHONE" />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="CONTACT_PERSON_NAME">
                              Contact Person
                            </Label>
                            <Field
                              as={Input}
                              id="CONTACT_PERSON_NAME"
                              name="CONTACT_PERSON_NAME"
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label>Client Logo (image)</Label>
                            <AttachmentUploader
                              userId={currentUserId}
                              category="CLIENT_LOGO"
                              fileId={values.CLIENT_LOGO_FILE_ID}
                              fileName={values.CLIENT_LOGO_FILE_NAME}
                              accept="image/*"
                              onUploaded={(fileMeta) => {
                                setFieldValue(
                                  "CLIENT_LOGO_FILE_ID",
                                  fileMeta.FILE_ID
                                );
                                setFieldValue(
                                  "CLIENT_LOGO_FILE_NAME",
                                  fileMeta.FILE_NAME ||
                                    fileMeta.ORIGINAL_NAME ||
                                    ""
                                );

                                if (fileMeta.url) {
                                  setLogoPreviewUrl(fileMeta.url);
                                } else {
                                  setLogoPreviewUrl(
                                    `/api/attachments/${fileMeta.FILE_ID}`
                                  );
                                }
                              }}
                            />

                            {logoPreviewUrl && (
                              <div className="mt-2">
                                <Label>Preview:</Label>
                                <br />
                                <img
                                  src={logoPreviewUrl}
                                  alt="Client Logo Preview"
                                  style={{
                                    width: "160px",
                                    height: "160px",
                                    objectFit: "contain",
                                    border: "1px solid #ddd",
                                    borderRadius: "6px",
                                    padding: "4px",
                                    background: "#fafafa",
                                  }}
                                />
                              </div>
                            )}
                          </FormGroup>
                        </Col>

                        <Col md={12} className="mt-3">
                          <Button
                            type="button"
                            color="secondary"
                            className="me-2"
                            onClick={() => navigate("/contracting/clients")}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            color="primary"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Saving..." : "Save Client"}
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  )}
                </Formik>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const ClientCreate = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <ClientCreateInner />
  </RequireModule>
);

export default ClientCreate;
