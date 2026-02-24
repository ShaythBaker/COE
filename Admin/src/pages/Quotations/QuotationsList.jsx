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

import {
  getQoutations,
  createQoutation,
  clearQoutationsMessages,
} from "/src/store/quotations/actions";

import {
  getClients,
  getTransportationCompaniesApi,
} from "/src/helpers/fakebackend_helper";

const EMPTY_STATE = {};

const quotationsSelector = createSelector(
  (state) => state?.Quotations || state?.quotations || EMPTY_STATE,
  (s) => ({
    list: s?.list || [],
    loadingList: s?.loadingList || false,
    saving: s?.saving || false,
    error: s?.error || null,
    successMessage: s?.successMessage || null,
  }),
);

// ✅ 12h format: YYYY-MM-DD at HH:MM:SS AM/PM
const formatDateTime12h = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const pad = (n) => String(n).padStart(2, "0");

  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());

  let hh = d.getHours();
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;

  const HH = pad(hh);
  const MM = pad(d.getMinutes());
  const SS = pad(d.getSeconds());

  return `${yyyy}-${mm}-${dd} at ${HH}:${MM}:${SS} ${ampm}`;
};

const QuotationsListInner = () => {
  document.title = "Quotations | Travco - COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list, loadingList, saving, error, successMessage } =
    useSelector(quotationsSelector);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Modal dropdowns
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState(null);

  const [transportCompanies, setTransportCompanies] = useState([]);
  const [transportLoading, setTransportLoading] = useState(false);
  const [transportError, setTransportError] = useState(null);

  useEffect(() => {
    dispatch(getQoutations());
  }, [dispatch]);

  // Toasts (same pattern as ClientsList)
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      setIsCreateOpen(false);
      dispatch(clearQoutationsMessages());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearQoutationsMessages());
    }
  }, [error, dispatch]);

  const loadClients = async () => {
    setClientsLoading(true);
    setClientsError(null);
    try {
      const res = await getClients(1); // /api/clients?ACTIVE_STATUS=1
      setClients(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      setClientsError(
        e?.response?.data?.message || e?.message || "Failed to load clients",
      );
    } finally {
      setClientsLoading(false);
    }
  };

  const loadTransportCompanies = async () => {
    setTransportLoading(true);
    setTransportError(null);
    try {
      const res = await getTransportationCompaniesApi({ ACTIVE_STATUS: 1 });
      setTransportCompanies(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      setTransportError(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load transportation companies",
      );
    } finally {
      setTransportLoading(false);
    }
  };

  const handleView = (id) => navigate(`/quotations/details/${id}`);

  // Whenever modal opens, load dropdowns
  useEffect(() => {
    if (isCreateOpen) {
      loadClients();
      loadTransportCompanies();
    }
  }, [isCreateOpen]);

  const toggleCreate = () => setIsCreateOpen((p) => !p);

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const onModify = (row) => {
    const id = row?.QOUTATION_ID;
    if (!id) return;
    navigate(`/quotations/${id}`);
  };

  const onView = (row) => {
    const id = row?.QOUTATION_ID;
    if (!id) return;
    navigate(`/quotations/${id}/view`);
  };

  const columns = useMemo(
    () => [
      {
        header: "Group Name",
        accessorKey: "QOUTATION_GROUP_NAME",
        enableColumnFilter: false,
      },
      {
        header: "Client",
        accessorKey: "CLIENT_NAME",
        enableColumnFilter: false,
        cell: ({ row }) =>
          row.original.CLIENT_NAME ||
          `#${row.original.QOUTATION_CLIENT_ID || "-"}`,
      },
      {
        header: "Created On",
        accessorKey: "CREATED_ON",
        enableColumnFilter: false,
        cell: ({ row }) => formatDateTime12h(row?.original?.CREATED_ON),
      },
      {
        header: "Updated On",
        accessorKey: "UPDATED_ON",
        enableColumnFilter: false,
        cell: ({ row }) => formatDateTime12h(row?.original?.UPDATED_ON),
      },
      {
        header: "Created By",
        accessorKey: "CREATED_BY_NAME",
        enableColumnFilter: false,
        cell: ({ row }) => row.original.CREATED_BY_NAME || "-",
      },
      {
        header: "Updated By",
        accessorKey: "UPDATED_BY_NAME",
        enableColumnFilter: false,
        cell: ({ row }) => row.original.UPDATED_BY_NAME || "-",
      },
      {
        header: "Actions",
        accessorKey: "actions",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const q = row?.original || {};
          const isActive = q?.ACTIVE_STATUS === 1 || q?.ACTIVE_STATUS === "1";

          return (
            <div className="d-flex align-items-center gap-3">
              <Button
                color="warning"
                outline
                size="sm"
                disabled={!isActive}
                onClick={() => onModify(q)}
                title={!isActive ? "Inactive quotation" : "Modify"}
              >
                Modify
              </Button>

              <Button
                color="link"
                size="sm"
                className="p-0"
                onClick={() => handleView(row.original.QOUTATION_ID)}
              >
                View
              </Button>
            </div>
          );
        },
      },
    ],
    [navigate],
  );

  const createSchema = Yup.object().shape({
    QOUTATION_CLIENT_ID: Yup.number()
      .typeError("Client is required")
      .required("Client is required"),
    QOUTATION_TRANSPORTATION_COMPANY_ID: Yup.number()
      .typeError("Transportation company is required")
      .required("Transportation company is required"),
    QOUTATION_TOTAL_PAX: Yup.number()
      .typeError("Total pax is required")
      .integer("Total pax must be an integer")
      .min(1, "Total pax must be at least 1")
      .required("Total pax is required"),
    QOUTATION_GROUP_NAME: Yup.string()
      .trim()
      .required("Group name is required"),
    QOUTATION_ARRIVING_DATE: Yup.string().required("Arriving date is required"),
    QOUTATION_DEPARTURING_DATE: Yup.string()
      .required("Departuring date is required")
      .test(
        "date-order",
        "Departuring date cannot be before arriving date",
        function (value) {
          const arriving = this.parent.QOUTATION_ARRIVING_DATE;
          if (!arriving || !value) return true;
          return new Date(value) >= new Date(arriving);
        },
      ),
  });

  const initialValues = {
    QOUTATION_CLIENT_ID: "",
    QOUTATION_TOTAL_PAX: "",
    QOUTATION_TRANSPORTATION_COMPANY_ID: "",
    QOUTATION_GROUP_NAME: "",
    QOUTATION_ARRIVING_DATE: "",
    QOUTATION_DEPARTURING_DATE: "",
  };

  const onSubmitCreate = (values) => {
    dispatch(
      createQoutation({
        QOUTATION_CLIENT_ID: Number(values.QOUTATION_CLIENT_ID),
        QOUTATION_TOTAL_PAX: Number(values.QOUTATION_TOTAL_PAX),
        QOUTATION_TRANSPORTATION_COMPANY_ID: Number(
          values.QOUTATION_TRANSPORTATION_COMPANY_ID,
        ),
        QOUTATION_GROUP_NAME: values.QOUTATION_GROUP_NAME?.trim(),
        QOUTATION_ARRIVING_DATE: values.QOUTATION_ARRIVING_DATE,
        QOUTATION_DEPARTURING_DATE: values.QOUTATION_DEPARTURING_DATE,
      }),
    );
  };

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />

      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Quotations" />

        <Card>
          <CardBody>
            {error && (
              <Alert color="danger" className="mb-3">
                {error}
              </Alert>
            )}

            {loadingList ? (
              <div className="text-center my-4">
                <Spinner size="sm" className="me-2" />
                Loading quotations...
              </div>
            ) : (
              <TableContainer
                columns={columns}
                data={list || []}
                divClassName="table-responsive"
                tableClass="table align-middle table-nowrap"
                theadClass="table-light"
                isGlobalFilter={true}
                isPagination={false}
                SearchPlaceholder="Search quotations..."
                isAddButton={true}
                isCustomPageSize={true}
                disableFilters={true}
                handleUserClick={toggleCreate}
                buttonName="Add Quotation"
              />
            )}
          </CardBody>
        </Card>

        {/* ✅ Create Quotation Modal (same structure as ClientsList modal) */}
        <Modal isOpen={isCreateOpen} toggle={toggleCreate} centered>
          <ModalHeader toggle={toggleCreate}>Add Quotation</ModalHeader>

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
                  {/* Client dropdown */}
                  <FormGroup>
                    <Label>Client *</Label>
                    <Input
                      type="select"
                      name="QOUTATION_CLIENT_ID"
                      value={values.QOUTATION_CLIENT_ID}
                      onChange={(e) =>
                        setFieldValue("QOUTATION_CLIENT_ID", e.target.value)
                      }
                      onBlur={handleBlur}
                      disabled={clientsLoading}
                      invalid={
                        touched.QOUTATION_CLIENT_ID &&
                        !!errors.QOUTATION_CLIENT_ID
                      }
                    >
                      <option value="">Select client</option>
                      {clients.map((c) => (
                        <option key={c.CLIENT_ID} value={c.CLIENT_ID}>
                          {c.CLIENT_NAME}
                        </option>
                      ))}
                    </Input>

                    {clientsLoading ? (
                      <small className="text-muted">
                        <Spinner size="sm" className="me-1" />
                        Loading clients...
                      </small>
                    ) : null}

                    {clientsError ? (
                      <small className="text-danger">{clientsError}</small>
                    ) : null}

                    {touched.QOUTATION_CLIENT_ID &&
                    errors.QOUTATION_CLIENT_ID ? (
                      <FormFeedback>{errors.QOUTATION_CLIENT_ID}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  {/* Transportation Company dropdown */}
                  <FormGroup>
                    <Label>Transportation Company *</Label>
                    <Input
                      type="select"
                      name="QOUTATION_TRANSPORTATION_COMPANY_ID"
                      value={values.QOUTATION_TRANSPORTATION_COMPANY_ID}
                      onChange={(e) =>
                        setFieldValue(
                          "QOUTATION_TRANSPORTATION_COMPANY_ID",
                          e.target.value,
                        )
                      }
                      onBlur={handleBlur}
                      disabled={transportLoading}
                      invalid={
                        touched.QOUTATION_TRANSPORTATION_COMPANY_ID &&
                        !!errors.QOUTATION_TRANSPORTATION_COMPANY_ID
                      }
                    >
                      <option value="">Select transportation company</option>
                      {transportCompanies.map((t) => (
                        <option
                          key={t.TRANSPORTATION_COMPANY_ID}
                          value={t.TRANSPORTATION_COMPANY_ID}
                        >
                          {t.TRANSPORTATION_COMPANY_NAME}
                        </option>
                      ))}
                    </Input>

                    {transportLoading ? (
                      <small className="text-muted">
                        <Spinner size="sm" className="me-1" />
                        Loading transportation companies...
                      </small>
                    ) : null}

                    {transportError ? (
                      <small className="text-danger">{transportError}</small>
                    ) : null}

                    {touched.QOUTATION_TRANSPORTATION_COMPANY_ID &&
                    errors.QOUTATION_TRANSPORTATION_COMPANY_ID ? (
                      <FormFeedback>
                        {errors.QOUTATION_TRANSPORTATION_COMPANY_ID}
                      </FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Group Name *</Label>
                    <Input
                      name="QOUTATION_GROUP_NAME"
                      value={values.QOUTATION_GROUP_NAME}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.QOUTATION_GROUP_NAME &&
                        !!errors.QOUTATION_GROUP_NAME
                      }
                      placeholder="Enter group name"
                    />
                    {touched.QOUTATION_GROUP_NAME &&
                    errors.QOUTATION_GROUP_NAME ? (
                      <FormFeedback>{errors.QOUTATION_GROUP_NAME}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Total Pax *</Label>
                    <Input
                      type="number"
                      name="QOUTATION_TOTAL_PAX"
                      value={values.QOUTATION_TOTAL_PAX}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.QOUTATION_TOTAL_PAX &&
                        !!errors.QOUTATION_TOTAL_PAX
                      }
                      placeholder="e.g. 25"
                    />
                    {touched.QOUTATION_TOTAL_PAX &&
                    errors.QOUTATION_TOTAL_PAX ? (
                      <FormFeedback>{errors.QOUTATION_TOTAL_PAX}</FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Arriving Date *</Label>
                    <Input
                      type="date"
                      name="QOUTATION_ARRIVING_DATE"
                      value={values.QOUTATION_ARRIVING_DATE}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.QOUTATION_ARRIVING_DATE &&
                        !!errors.QOUTATION_ARRIVING_DATE
                      }
                    />
                    {touched.QOUTATION_ARRIVING_DATE &&
                    errors.QOUTATION_ARRIVING_DATE ? (
                      <FormFeedback>
                        {errors.QOUTATION_ARRIVING_DATE}
                      </FormFeedback>
                    ) : null}
                  </FormGroup>

                  <FormGroup>
                    <Label>Departuring Date *</Label>
                    <Input
                      type="date"
                      name="QOUTATION_DEPARTURING_DATE"
                      value={values.QOUTATION_DEPARTURING_DATE}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.QOUTATION_DEPARTURING_DATE &&
                        !!errors.QOUTATION_DEPARTURING_DATE
                      }
                    />
                    {touched.QOUTATION_DEPARTURING_DATE &&
                    errors.QOUTATION_DEPARTURING_DATE ? (
                      <FormFeedback>
                        {errors.QOUTATION_DEPARTURING_DATE}
                      </FormFeedback>
                    ) : null}
                  </FormGroup>
                </ModalBody>

                <ModalFooter>
                  <Button
                    color="light"
                    onClick={toggleCreate}
                    disabled={saving}
                  >
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

const QuotationsList = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <QuotationsListInner />
  </RequireModule>
);

export default QuotationsList;
