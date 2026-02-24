// src/pages/Contracting/HotelCreate.jsx
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
import MapLocationPicker from "../../components/Common/MapLocationPicker";

import {
  getSystemListItems,
  createHotel,
} from "/src/helpers/fakebackend_helper";
import { useNavigate } from "react-router-dom";

const HotelSchema = Yup.object().shape({
  HOTEL_NAME: Yup.string().required("Hotel name is required"),
  HOTEL_AREA_ID: Yup.string().required("Area is required"),
  HOTEL_STARS: Yup.number().min(1).max(5).required("Stars are required"),
  ACTIVE_STATUS: Yup.string().oneOf(["0", "1"]).required("Status is required"),
});

const HotelCreateInner = () => {
  document.title = "Create Hotel | Travco - COE";

  const navigate = useNavigate();

  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState(null);

  const [chains, setChains] = useState([]);
  const [chainsLoading, setChainsLoading] = useState(false);
  const [chainsError, setChainsError] = useState(null);

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

  // Load areas & chains using LIST_KEY
  useEffect(() => {
    const fetchLists = async () => {
      setAreasLoading(true);
      setChainsLoading(true);
      setAreasError(null);
      setChainsError(null);

      try {
        const [areasRes, chainsRes] = await Promise.all([
          getSystemListItems("AREAS"),
          getSystemListItems("HOTEL_CHAIN"),
        ]);

        setAreas(areasRes?.ITEMS || []);
        setChains(chainsRes?.ITEMS || []);
      } catch (err) {
        console.error("Failed to load lists", err);
        setAreasError("Failed to load areas");
        setChainsError("Failed to load chains");
      } finally {
        setAreasLoading(false);
        setChainsLoading(false);
      }
    };

    fetchLists();
  }, []);

  const initialValues = {
    HOTEL_NAME: "",
    HOTEL_ADDRESS: "",
    HOTEL_AREA_ID: "",
    HOTEL_CHAIN_ID: "",
    HOTEL_STARS: "5",
    HOTEL_PHONE: "",
    HOTEL_RESERVATION_EMAIL: "",
    HOTEL_LAT: "",
    HOTEL_LAN: "",
    HOTEL_CONTACT_PERSON_NAME: "",
    ACTIVE_STATUS: "1",

    // attachments
    HOTEL_LOGO_FILE_ID: null,
    HOTEL_LOGO_FILE_NAME: "",
    HOTEL_CONTRACT_FILE_ID: null,
    HOTEL_CONTRACT_FILE_NAME: "",
    HOTEL_CONTRACT_PREVIEW_URL: "",
  };

  const handleSubmit = async (values) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      // We treat HOTEL_AREA as LIST_ITEM_ID as per your requirement
      const payload = {
        HOTEL_NAME: values.HOTEL_NAME,
        HOTEL_ADDRESS: values.HOTEL_ADDRESS || "",
        // LIST_ITEM_ID for area
        HOTEL_AREA: values.HOTEL_AREA_ID,
        HOTEL_STARS: Number(values.HOTEL_STARS) || 0,
        HOTEL_PHONE: values.HOTEL_PHONE || "",
        HOTEL_RESERVATION_EMAIL: values.HOTEL_RESERVATION_EMAIL || "",
        HOTEL_LAT: values.HOTEL_LAT || "",
        HOTEL_LAN: values.HOTEL_LAN || "",

        // LIST_ITEM_ID for chain
        HOTEL_CHAIN: values.HOTEL_CHAIN_ID || "",

        // Logo FILE_ID
        HOTEL_LOGO: values.HOTEL_LOGO_FILE_ID || "",

        // Contract is the FILE_ID of uploaded contract
        HOTEL_CONTRACT: values.HOTEL_CONTRACT_FILE_ID
          ? String(values.HOTEL_CONTRACT_FILE_ID)
          : "",

        HOTEL_CONTACT_PERSON_NAME: values.HOTEL_CONTACT_PERSON_NAME || "",
        ACTIVE_STATUS: Number(values.ACTIVE_STATUS),
      };

      await createHotel(payload);

      setSubmitSuccess("Hotel created successfully.");
      // After a short moment, go back to list
      navigate("/contracting/hotels");
    } catch (err) {
      console.error("Failed to create hotel", err);
      const msg =
        err?.response?.data?.message || err.message || "Failed to create hotel";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Create Hotel" />

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

                {areasLoading && (
                  <div className="mb-3">
                    <Spinner size="sm" className="me-2" />
                    Loading areas...
                  </div>
                )}

                <Formik
                  initialValues={initialValues}
                  validationSchema={HotelSchema}
                  onSubmit={handleSubmit}
                >
                  {({ errors, touched, setFieldValue, values }) => (
                    <Form>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="HOTEL_NAME">Hotel Name</Label>
                            <Field
                              as={Input}
                              id="HOTEL_NAME"
                              name="HOTEL_NAME"
                              invalid={
                                touched.HOTEL_NAME && !!errors.HOTEL_NAME
                              }
                            />
                            {touched.HOTEL_NAME && errors.HOTEL_NAME && (
                              <FormFeedback>{errors.HOTEL_NAME}</FormFeedback>
                            )}
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="HOTEL_CHAIN_ID">Chain</Label>
                            <Input
                              type="select"
                              id="HOTEL_CHAIN_ID"
                              name="HOTEL_CHAIN_ID"
                              value={values.HOTEL_CHAIN_ID}
                              onChange={(e) =>
                                setFieldValue("HOTEL_CHAIN_ID", e.target.value)
                              }
                              disabled={chainsLoading}
                            >
                              <option value="">Select chain</option>
                              {chains.map((chain) => (
                                <option
                                  key={chain.LIST_ITEM_ID}
                                  value={chain.LIST_ITEM_ID}
                                >
                                  {chain.ITEM_NAME}
                                </option>
                              ))}
                            </Input>
                            {chainsError && (
                              <small className="text-danger">
                                {chainsError}
                              </small>
                            )}
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="HOTEL_AREA_ID">Area</Label>
                            <Input
                              type="select"
                              id="HOTEL_AREA_ID"
                              name="HOTEL_AREA_ID"
                              value={values.HOTEL_AREA_ID}
                              onChange={(e) =>
                                setFieldValue("HOTEL_AREA_ID", e.target.value)
                              }
                              invalid={
                                touched.HOTEL_AREA_ID && !!errors.HOTEL_AREA_ID
                              }
                              disabled={areasLoading}
                            >
                              <option value="">Select area</option>
                              {areas.map((area) => (
                                <option
                                  key={area.LIST_ITEM_ID}
                                  value={area.LIST_ITEM_ID}
                                >
                                  {area.ITEM_NAME}
                                </option>
                              ))}
                            </Input>
                            {touched.HOTEL_AREA_ID && errors.HOTEL_AREA_ID && (
                              <FormFeedback>
                                {errors.HOTEL_AREA_ID}
                              </FormFeedback>
                            )}
                            {areasError && (
                              <small className="text-danger">
                                {areasError}
                              </small>
                            )}
                          </FormGroup>
                        </Col>

                        <Col md={3}>
                          <FormGroup>
                            <Label for="HOTEL_STARS">Stars</Label>
                            <Input
                              type="select"
                              id="HOTEL_STARS"
                              name="HOTEL_STARS"
                              value={values.HOTEL_STARS}
                              onChange={(e) =>
                                setFieldValue("HOTEL_STARS", e.target.value)
                              }
                              invalid={
                                touched.HOTEL_STARS && !!errors.HOTEL_STARS
                              }
                            >
                              {[5, 4, 3, 2, 1].map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </Input>
                            {touched.HOTEL_STARS && errors.HOTEL_STARS && (
                              <FormFeedback>{errors.HOTEL_STARS}</FormFeedback>
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

                        {/* Optional extra fields */}
                        <Col md={6}>
                          <FormGroup>
                            <Label for="HOTEL_PHONE">Phone</Label>
                            <Field
                              as={Input}
                              id="HOTEL_PHONE"
                              name="HOTEL_PHONE"
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="HOTEL_RESERVATION_EMAIL">
                              Reservation Email
                            </Label>
                            <Field
                              as={Input}
                              id="HOTEL_RESERVATION_EMAIL"
                              name="HOTEL_RESERVATION_EMAIL"
                              type="email"
                            />
                          </FormGroup>
                        </Col>

                        {/* <Col md={6}>
                          <FormGroup>
                            <Label for="HOTEL_CONTRACT">Contract No.</Label>
                            <Field
                              as={Input}
                              id="HOTEL_CONTRACT"
                              name="HOTEL_CONTRACT"
                            />
                          </FormGroup>
                        </Col> */}

                        <Col md={6}>
                          <FormGroup>
                            <Label for="HOTEL_CONTACT_PERSON_NAME">
                              Contact Person
                            </Label>
                            <Field
                              as={Input}
                              id="HOTEL_CONTACT_PERSON_NAME"
                              name="HOTEL_CONTACT_PERSON_NAME"
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label for="HOTEL_ADDRESS">Address</Label>
                            <Field
                              as={Input}
                              id="HOTEL_ADDRESS"
                              name="HOTEL_ADDRESS"
                            />
                          </FormGroup>
                        </Col>
                        <Col md={12}>
                          <FormGroup>
                            <Label>Location</Label>
                            <br />
                            <small className="text-muted">
                              {values.HOTEL_LAT && values.HOTEL_LAN
                                ? `Selected: ${values.HOTEL_LAT}, ${values.HOTEL_LAN}`
                                : "Click on the map to choose location."}
                            </small>
                            <MapLocationPicker
                              latitude={
                                values.HOTEL_LAT
                                  ? Number(values.HOTEL_LAT)
                                  : null
                              }
                              longitude={
                                values.HOTEL_LAN
                                  ? Number(values.HOTEL_LAN)
                                  : null
                              }
                              onChange={({ lat, lng }) => {
                                setFieldValue("HOTEL_LAT", lat.toString());
                                setFieldValue("HOTEL_LAN", lng.toString());
                              }}
                            />
                          </FormGroup>
                        </Col>

                        {/* Logo attachment */}

                        <Col md={6}>
                          <FormGroup>
                            <Label>Hotel Logo (image)</Label>
                            <AttachmentUploader
                              userId={currentUserId}
                              category="HOTEL_LOGO"
                              fileId={values.HOTEL_LOGO_FILE_ID}
                              fileName={values.HOTEL_LOGO_FILE_NAME}
                              accept="image/*"
                              onUploaded={(fileMeta) => {
                                setFieldValue(
                                  "HOTEL_LOGO_FILE_ID",
                                  fileMeta.FILE_ID
                                );
                                setFieldValue(
                                  "HOTEL_LOGO_FILE_NAME",
                                  fileMeta.FILE_NAME ||
                                    fileMeta.ORIGINAL_NAME ||
                                    ""
                                );

                                // Use the signed S3 URL from backend
                                if (fileMeta.url) {
                                  setLogoPreviewUrl(fileMeta.url);
                                } else {
                                  // Fallback – only if you have a direct view endpoint
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
                                  alt="Hotel Logo Preview"
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

                        {/* Contract attachment */}
                        <Col md={6}>
                          <FormGroup>
                            <Label>Contract (PDF)</Label>
                            <AttachmentUploader
                              userId={currentUserId}
                              category="HOTEL_CONTRACT"
                              fileId={values.HOTEL_CONTRACT_FILE_ID}
                              fileName={values.HOTEL_CONTRACT_FILE_NAME}
                              accept="application/pdf"
                              onUploaded={(fileMeta) => {
                                setFieldValue(
                                  "HOTEL_CONTRACT_FILE_ID",
                                  fileMeta.FILE_ID
                                );
                                setFieldValue(
                                  "HOTEL_CONTRACT_FILE_NAME",
                                  fileMeta.FILE_NAME ||
                                    fileMeta.ORIGINAL_NAME ||
                                    ""
                                );

                                // Save PDF preview URL (S3 signed URL)
                                if (fileMeta.url) {
                                  setFieldValue(
                                    "HOTEL_CONTRACT_PREVIEW_URL",
                                    fileMeta.url
                                  );
                                } else {
                                  setFieldValue(
                                    "HOTEL_CONTRACT_PREVIEW_URL",
                                    `/api/attachments/${fileMeta.FILE_ID}`
                                  );
                                }
                              }}
                            />

                            {/* PDF preview */}
                            {values.HOTEL_CONTRACT_PREVIEW_URL && (
                              <div className="mt-2">
                                <iframe
                                  src={values.HOTEL_CONTRACT_PREVIEW_URL}
                                  width="100%"
                                  height="400"
                                  style={{
                                    border: "1px solid #ccc",
                                    borderRadius: "6px",
                                  }}
                                ></iframe>
                              </div>
                            )}
                          </FormGroup>
                        </Col>

                        <Col md={12} className="mt-3">
                          <Button
                            type="button"
                            color="secondary"
                            className="me-2"
                            onClick={() => navigate("/contracting/hotels")}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            color="primary"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Saving..." : "Save Hotel"}
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

const HotelCreate = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <HotelCreateInner />
  </RequireModule>
);

export default HotelCreate;
