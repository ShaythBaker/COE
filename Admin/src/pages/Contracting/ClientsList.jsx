import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
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
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useNavigate } from "react-router-dom";

import { Formik } from "formik";
import * as Yup from "yup";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";
import TableContainer from "../../components/Common/TableContainer";
import AttachmentUploader from "../../components/Common/AttachmentUploader";

import {
  getClients,
  createClient,
  clearClientsMessages,
} from "/src/store/clients/actions";

import { getSystemListItems } from "/src/helpers/fakebackend_helper";

const EMPTY_CLIENTS_STATE = {};

const clientsListSelector = createSelector(
  (state) => state?.Clients || state?.clients || EMPTY_CLIENTS_STATE,
  (clientsState) => ({
    clients: clientsState?.list || [],
    loadingClients: clientsState?.loadingList || false,
    clientsError: clientsState?.error || null,
    saving: clientsState?.saving || false,
    successMessage: clientsState?.successMessage || null,
  })
);

const ClientsListInner = () => {
  document.title = "Clients | Travco - COE";

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { clients, loadingClients, clientsError, saving, successMessage } =
    useSelector(clientsListSelector);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Countries dropdown
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState(null);

  // optional logo preview
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
    dispatch(getClients());
  }, [dispatch]);

  // Load countries once (key = COUNTRIES)
  useEffect(() => {
    const loadCountries = async () => {
      setCountriesLoading(true);
      setCountriesError(null);
      try {
        const res = await getSystemListItems("COUNTRIES");
        // Hotels pattern: response has ITEMS array with LIST_ITEM_ID + ITEM_NAME
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

  // Toast notifications for create / any errors coming from this module
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      setIsCreateOpen(false);
      setLogoPreviewUrl(null);
      dispatch(clearClientsMessages());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (clientsError) {
      toast.error(clientsError);
      dispatch(clearClientsMessages());
    }
  }, [clientsError, dispatch]);

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const handleViewProfile = (clientId) => {
    navigate(`/contracting/clients/${clientId}`);
  };

  const columns = useMemo(
    () => [
      {
        header: "Client Name",
        accessorKey: "CLIENT_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Email",
        accessorKey: "EMAIL",
        enableColumnFilter: false,
      },
      {
        header: "Phone",
        accessorKey: "PHONE",
        enableColumnFilter: false,
      },
      {
        header: "Contact Person",
        accessorKey: "CONTACT_PERSON_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Status",
        accessorKey: "ACTIVE_STATUS",
        enableColumnFilter: false,
        cell: (info) => renderStatusBadge(info.getValue()),
      },
      {
        id: "actions",
        header: "Actions",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const client = row.original;
          return (
            <Button
              color="link"
              size="sm"
              className="p-0"
              onClick={() => handleViewProfile(client.CLIENT_ID)}
            >
              View Profile
            </Button>
          );
        },
      },
    ],
    []
  );

  const toggleCreate = () => {
    setIsCreateOpen((v) => !v);
    if (isCreateOpen) setLogoPreviewUrl(null);
  };

  const createSchema = Yup.object().shape({
    CLIENT_NAME: Yup.string().trim().required("Client Name is required"),
    COUNTRY_ID: Yup.mixed().nullable(), // optional
    EMAIL: Yup.string().trim().email("Invalid email").nullable(),
    PHONE: Yup.string().trim().nullable(),
    CONTACT_PERSON_NAME: Yup.string().trim().nullable(),
    ACTIVE_STATUS: Yup.mixed().oneOf([0, 1]).required("Status is required"),
  });

  const initialValues = {
    CLIENT_NAME: "",
    COUNTRY_ID: "", // keep empty string for select, convert on submit
    EMAIL: "",
    PHONE: "",
    CONTACT_PERSON_NAME: "",
    ACTIVE_STATUS: 1,

    CLIENT_LOGO_FILE_ID: null,
    CLIENT_LOGO_FILE_NAME: "",
  };

  const handleAddClick = () => {
    setIsCreateOpen(true);
  };

  const onSubmitCreate = (values) => {
    dispatch(
      createClient({
        CLIENT_NAME: values.CLIENT_NAME,
        COUNTRY_ID: values.COUNTRY_ID ? Number(values.COUNTRY_ID) : null,
        EMAIL: values.EMAIL,
        PHONE: values.PHONE,
        CONTACT_PERSON_NAME: values.CONTACT_PERSON_NAME,
        ACTIVE_STATUS: Number(values.ACTIVE_STATUS),
        CLIENT_LOGO: values.CLIENT_LOGO_FILE_ID || null,
      })
    );
  };

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />

      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Clients" />

        <Card>
          <CardBody>
            {clientsError && (
              <Alert color="danger" className="mb-3">
                {clientsError}
              </Alert>
            )}

            {loadingClients ? (
              <div className="text-center my-4">
                <Spinner size="sm" className="me-2" />
                Loading clients...
              </div>
            ) : (
              <TableContainer
                columns={columns}
                data={clients || []}
                divClassName="table-responsive"
                tableClass="table align-middle table-nowrap"
                theadClass="table-light"
                isGlobalFilter={true}
                isPagination={false}
                SearchPlaceholder="Search clients..."
                isAddButton={true}
                isCustomPageSize={true}
                disableFilters={true}
                handleUserClick={handleAddClick}
                buttonName="Add Client"
              />
            )}
          </CardBody>
        </Card>

        {/* Create Client Modal */}
        <Modal isOpen={isCreateOpen} toggle={toggleCreate} centered>
          <ModalHeader toggle={toggleCreate}>Add Client</ModalHeader>

          <Formik
            initialValues={initialValues}
            validationSchema={createSchema}
            onSubmit={onSubmitCreate}
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

                  {/* ✅ Country dropdown */}
                  <FormGroup>
                    <Label>Country</Label>
                    <Input
                      type="select"
                      name="COUNTRY_ID"
                      value={values.COUNTRY_ID}
                      onChange={(e) => setFieldValue("COUNTRY_ID", e.target.value)}
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

                  {/* ✅ Client Logo Uploader */}
                  <FormGroup>
                    <Label>Client Logo</Label>
                    <AttachmentUploader
                      userId={currentUserId}
                      category="CLIENT_LOGO"
                      accept="image/*"
                      fileId={values.CLIENT_LOGO_FILE_ID}
                      fileName={values.CLIENT_LOGO_FILE_NAME}
                      onUploaded={(fileMeta) => {
                        setFieldValue("CLIENT_LOGO_FILE_ID", fileMeta?.FILE_ID || null);
                        setFieldValue(
                          "CLIENT_LOGO_FILE_NAME",
                          fileMeta?.FILE_NAME || fileMeta?.ORIGINAL_NAME || ""
                        );

                        if (fileMeta?.url) {
                          setLogoPreviewUrl(fileMeta.url);
                        } else if (fileMeta?.FILE_ID) {
                          setLogoPreviewUrl(`/api/attachments/${fileMeta.FILE_ID}`);
                        } else {
                          setLogoPreviewUrl(null);
                        }
                      }}
                    />

                    {logoPreviewUrl ? (
                      <div className="mt-2">
                        <img
                          src={logoPreviewUrl}
                          alt="Client Logo Preview"
                          style={{
                            width: "140px",
                            height: "140px",
                            objectFit: "contain",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            padding: "4px",
                            background: "#fafafa",
                          }}
                        />
                      </div>
                    ) : null}
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
                  <Button color="light" onClick={toggleCreate} disabled={saving}>
                    Cancel
                  </Button>
                  <Button color="primary" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      "Create"
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

const ClientsList = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <ClientsListInner />
  </RequireModule>
);

export default ClientsList;
