import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Spinner,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";
import { useParams, useNavigate } from "react-router-dom";

import { Formik } from "formik";
import * as Yup from "yup";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";
import AttachmentUploader from "../../components/Common/AttachmentUploader";

import {
  getClientById,
  updateClient,
  getSystemListItems,
} from "/src/helpers/fakebackend_helper";
import { getAttachmentUrl } from "/src/helpers/attachments_helper";

const renderStatusBadge = (status) => {
  const isActive = status === 1 || status === "1";
  return (
    <Badge color={isActive ? "success" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
};

// YYYY-MM-DD HH:MM:SS (uses local time)
const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  const pad = (n) => String(n).padStart(2, "0");

  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const MM = pad(d.getMinutes());
  const SS = pad(d.getSeconds());

  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
};

const ClientProfileInner = () => {
  document.title = "Client Profile | Travco - COE";

  const { clientId } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loadingClient, setLoadingClient] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [logoUrl, setLogoUrl] = useState("");

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Countries dropdown
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState(null);

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

  const fetchClient = async () => {
    setLoadingClient(true);
    setLoadError(null);
    try {
      const res = await getClientById(clientId);
      setClient(res);
    } catch (err) {
      console.error("Failed to load client", err);
      setLoadError("Failed to load client details.");
    } finally {
      setLoadingClient(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        if (client?.CLIENT_LOGO) {
          const url = await getAttachmentUrl(client.CLIENT_LOGO);
          setLogoUrl(url || "");
        } else {
          setLogoUrl("");
        }
      } catch (err) {
        console.error("Failed to load client logo", err);
        setLogoUrl("");
      }
    };

    if (client) loadLogo();
  }, [client]);

  // Load countries once
  useEffect(() => {
    const loadCountries = async () => {
      setCountriesLoading(true);
      setCountriesError(null);
      try {
        const res = await getSystemListItems("COUNTRIES");
        setCountries(res?.ITEMS || []);
      } catch (e) {
        console.error("Failed to load countries", e);
        setCountriesError(
          e?.response?.data?.message || e?.message || "Failed to load countries"
        );
      } finally {
        setCountriesLoading(false);
      }
    };

    loadCountries();
  }, []);

  const countryLabel = useMemo(() => {
    if (!client) return "-";
    if (client.COUNTRY_NAME) return client.COUNTRY_NAME;
    if (client.COUNTRY_ID !== null && client.COUNTRY_ID !== undefined)
      return `#${client.COUNTRY_ID}`;
    return "-";
  }, [client]);

  const toggleEdit = () => setIsEditOpen((v) => !v);

  const editSchema = Yup.object().shape({
    CLIENT_NAME: Yup.string().trim().required("Client Name is required"),
    COUNTRY_ID: Yup.mixed().nullable(),
    EMAIL: Yup.string().trim().email("Invalid email").nullable(),
    PHONE: Yup.string().trim().nullable(),
    CONTACT_PERSON_NAME: Yup.string().trim().nullable(),
    ACTIVE_STATUS: Yup.mixed().oneOf([0, 1]).required("Status is required"),
  });

  const editInitialValues = useMemo(
    () => ({
      CLIENT_NAME: client?.CLIENT_NAME || "",
      COUNTRY_ID: client?.COUNTRY_ID ? String(client.COUNTRY_ID) : "",
      EMAIL: client?.EMAIL || "",
      PHONE: client?.PHONE || "",
      CONTACT_PERSON_NAME: client?.CONTACT_PERSON_NAME || "",
      ACTIVE_STATUS:
        client?.ACTIVE_STATUS === 0 || client?.ACTIVE_STATUS === "0" ? 0 : 1,

      CLIENT_LOGO_FILE_ID: client?.CLIENT_LOGO || null,
      CLIENT_LOGO_FILE_NAME: "",
    }),
    [client]
  );

  const onSubmitEdit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        CLIENT_ID: Number(clientId),
        CLIENT_NAME: values.CLIENT_NAME,
        COUNTRY_ID: values.COUNTRY_ID ? Number(values.COUNTRY_ID) : null,
        EMAIL: values.EMAIL,
        PHONE: values.PHONE,
        CONTACT_PERSON_NAME: values.CONTACT_PERSON_NAME,
        ACTIVE_STATUS: Number(values.ACTIVE_STATUS),
        CLIENT_LOGO: values.CLIENT_LOGO_FILE_ID || null,
        UPDATED_BY: currentUserId ? Number(currentUserId) : undefined,
      };

      Object.keys(payload).forEach(
        (k) => payload[k] === undefined && delete payload[k]
      );

      await updateClient(clientId, payload);

      toast.success("Client updated successfully");
      setIsEditOpen(false);

      // Refresh client details (including new UPDATED_ON / UPDATED_BY_NAME)
      await fetchClient();
    } catch (err) {
      console.error("Failed to update client", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update client"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingClient || (!client && !loadError)) {
    return (
      <div className="page-content">
        <ToastContainer position="top-right" autoClose={3000} />
        <Container fluid>
          <Breadcrumb title="Contracting" breadcrumbItem="Client Profile" />
          <Card>
            <CardBody className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading client details...
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />

      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Client Profile" />

        <Row className="mb-3">
          <Col className="d-flex align-items-center">
            <Button
              color="secondary"
              size="sm"
              onClick={() => navigate("/contracting/clients")}
            >
              <i className="bx bx-arrow-back me-1" />
              Back to Clients
            </Button>

            <Button
              color="primary"
              size="sm"
              className="ms-2"
              onClick={toggleEdit}
              disabled={!client}
            >
              <i className="bx bx-edit-alt me-1" />
              Edit Client
            </Button>
          </Col>
        </Row>

        {loadError && (
          <Alert color="danger" className="mb-3">
            {loadError}
          </Alert>
        )}

        <Row>
          <Col lg={4}>
            <Card className="mb-3">
              <CardBody className="text-center">
                {logoUrl ? (
                  <div className="avatar-xl mx-auto">
                    <div className="avatar-title rounded-circle bg-light">
                      <img
                        src={logoUrl}
                        alt="Client Logo"
                        className="rounded-circle img-fluid"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="avatar-xl mx-auto">
                    <div className="avatar-title rounded-circle bg-soft-secondary text-secondary">
                      <i className="bx bx-buildings font-size-24" />
                    </div>
                    <p className="text-muted mt-2 mb-0">No logo uploaded</p>
                  </div>
                )}

                <br />
                <h4 className="mb-1">{client?.CLIENT_NAME || "-"}</h4>
                <div className="mt-2">
                  {renderStatusBadge(client?.ACTIVE_STATUS)}
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg={8}>
            <Card>
              <CardBody>
                <Row>
                  <Col md={6}>
                    <h6 className="mb-3">General Info</h6>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Email</dt>
                      <dd className="col-sm-8">{client?.EMAIL || "-"}</dd>

                      <dt className="col-sm-4">Phone</dt>
                      <dd className="col-sm-8">{client?.PHONE || "-"}</dd>

                      <dt className="col-sm-4">Contact</dt>
                      <dd className="col-sm-8">
                        {client?.CONTACT_PERSON_NAME || "-"}
                      </dd>

                      <dt className="col-sm-4">Country</dt>
                      <dd className="col-sm-8">{countryLabel}</dd>
                    </dl>
                  </Col>

                  <Col md={6}>
                    <h6 className="mb-3">System Info</h6>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Created By</dt>
                      <dd className="col-sm-8">
                        {client?.CREATED_BY_NAME || "-"}
                      </dd>

                      <dt className="col-sm-4">Created On</dt>
                      <dd className="col-sm-8">
                        {formatDateTime(client?.CREATED_ON)}
                      </dd>

                      <dt className="col-sm-4">Updated By</dt>
                      <dd className="col-sm-8">
                        {client?.UPDATED_BY_NAME
                          ? `${client.UPDATED_BY_NAME}`
                          : client?.UPDATED_BY ?? "-"}
                      </dd>

                      <dt className="col-sm-4">Updated On</dt>
                      <dd className="col-sm-8">
                        {formatDateTime(client?.UPDATED_ON)}
                      </dd>
                    </dl>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Edit Client Modal */}
        <Modal isOpen={isEditOpen} toggle={toggleEdit} centered>
          <ModalHeader toggle={toggleEdit}>Edit Client</ModalHeader>

          <Formik
            enableReinitialize
            initialValues={editInitialValues}
            validationSchema={editSchema}
            onSubmit={onSubmitEdit}
          >
            {({
              values,
              handleChange,
              handleBlur,
              handleSubmit,
              touched,
              errors,
              setFieldValue,
            }) => (
              <Form onSubmit={handleSubmit}>
                <ModalBody>
                  <FormGroup>
                    <Label>Client Name *</Label>
                    <Input
                      name="CLIENT_NAME"
                      value={values.CLIENT_NAME}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={touched.CLIENT_NAME && !!errors.CLIENT_NAME}
                      placeholder="Enter client name"
                    />
                    {touched.CLIENT_NAME && errors.CLIENT_NAME ? (
                      <FormFeedback>{errors.CLIENT_NAME}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Country</Label>
                    <Input
                      type="select"
                      name="COUNTRY_ID"
                      value={values.COUNTRY_ID}
                      onChange={(e) =>
                        setFieldValue("COUNTRY_ID", e.target.value)
                      }
                      onBlur={handleBlur}
                      disabled={countriesLoading}
                    >
                      <option value="">Select country</option>
                      {countries.map((c) => (
                        <option key={c.LIST_ITEM_ID} value={c.LIST_ITEM_ID}>
                          {c.ITEM_NAME}
                        </option>
                      ))}
                    </Input>
                    {countriesLoading ? (
                      <small className="text-muted">
                        <Spinner size="sm" className="me-1" />
                        Loading countries...
                      </small>
                    ) : null}
                    {countriesError ? (
                      <small className="text-danger">{countriesError}</small>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Email</Label>
                    <Input
                      name="EMAIL"
                      type="email"
                      value={values.EMAIL}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={touched.EMAIL && !!errors.EMAIL}
                      placeholder="Enter email"
                    />
                    {touched.EMAIL && errors.EMAIL ? (
                      <FormFeedback>{errors.EMAIL}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Phone</Label>
                    <Input
                      name="PHONE"
                      value={values.PHONE}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={touched.PHONE && !!errors.PHONE}
                      placeholder="Enter phone"
                    />
                    {touched.PHONE && errors.PHONE ? (
                      <FormFeedback>{errors.PHONE}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Contact Person</Label>
                    <Input
                      name="CONTACT_PERSON_NAME"
                      value={values.CONTACT_PERSON_NAME}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.CONTACT_PERSON_NAME &&
                        !!errors.CONTACT_PERSON_NAME
                      }
                      placeholder="Enter contact person"
                    />
                    {touched.CONTACT_PERSON_NAME &&
                    errors.CONTACT_PERSON_NAME ? (
                      <FormFeedback>{errors.CONTACT_PERSON_NAME}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Client Logo</Label>
                    <AttachmentUploader
                      userId={currentUserId}
                      category="CLIENT_LOGO"
                      accept="image/*"
                      fileId={values.CLIENT_LOGO_FILE_ID}
                      fileName={values.CLIENT_LOGO_FILE_NAME}
                      onUploaded={(fileMeta) => {
                        setFieldValue(
                          "CLIENT_LOGO_FILE_ID",
                          fileMeta?.FILE_ID || null
                        );
                        setFieldValue(
                          "CLIENT_LOGO_FILE_NAME",
                          fileMeta?.FILE_NAME || fileMeta?.ORIGINAL_NAME || ""
                        );
                      }}
                    />
                    <small className="text-muted d-block mt-1">
                      Uploading a new logo will replace the current one.
                    </small>
                  </FormGroup>

                  <FormGroup>
                    <Label>Status *</Label>
                    <Input
                      type="select"
                      name="ACTIVE_STATUS"
                      value={values.ACTIVE_STATUS}
                      onChange={(e) =>
                        setFieldValue("ACTIVE_STATUS", Number(e.target.value))
                      }
                      onBlur={handleBlur}
                      invalid={touched.ACTIVE_STATUS && !!errors.ACTIVE_STATUS}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </Input>
                    {touched.ACTIVE_STATUS && errors.ACTIVE_STATUS ? (
                      <FormFeedback>{errors.ACTIVE_STATUS}</FormFeedback>
                    ) : null}
                  </FormGroup>
                </ModalBody>

                <ModalFooter>
                  <Button color="light" onClick={toggleEdit} disabled={saving}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      "Update"
                    )}
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </Modal>
      </Container>
    </div>
  );
};

const ClientProfile = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <ClientProfileInner />
  </RequireModule>
);

export default ClientProfile;
