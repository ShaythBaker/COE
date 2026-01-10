// src/pages/Contracting/TransportationCompanyProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Spinner,
  Button,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";

import {
  getTransportationCompany,
  updateTransportationCompany,
  deleteTransportationCompany,
  getTransportationContracts,
  createTransportationContract,
  updateTransportationContract,
  deleteTransportationContract,
  getTransportationVehicles,
  createTransportationVehicle,
  updateTransportationVehicle,
  deleteTransportationVehicle,
  clearTransportationMessages,
} from "../../store/transportation/actions";

const toYMD = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const TransportationCompanyProfileInner = () => {
  document.title = "Transportation Company | COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { companyId } = useParams();

  const {
    company,
    loadingCompany,
    companyError,
    contracts,
    loadingContracts,
    contractsError,
    vehicles,
    loadingVehicles,
    vehiclesError,
    successMessage,
    errorMessage,
  } = useSelector((state) => state.Transportation || {});

  // Company edit modal
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);

  // Contracts modal
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [deleteContractOpen, setDeleteContractOpen] = useState(false);
  const [deletingContract, setDeletingContract] = useState(null);

  // Vehicles modal
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteVehicleOpen, setDeleteVehicleOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState(null);

  // Vehicles filter
  const [vehicleActiveStatus, setVehicleActiveStatus] = useState("");

  useEffect(() => {
    dispatch(getTransportationCompany(companyId));
    dispatch(getTransportationContracts(companyId));
    dispatch(
      getTransportationVehicles(companyId, {
        ACTIVE_STATUS: vehicleActiveStatus,
      })
    );
  }, [dispatch, companyId]);

  useEffect(() => {
    dispatch(
      getTransportationVehicles(companyId, {
        ACTIVE_STATUS: vehicleActiveStatus,
      })
    );
  }, [dispatch, companyId, vehicleActiveStatus]);

  useEffect(() => {
    return () => dispatch(clearTransportationMessages());
  }, [dispatch]);

  const statusBadge = (v) => {
    const isActive = v === 1 || v === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const companyLogo = company?.TRANSPORTATION_COMPANY_LOGO;

  return (
    <RequireModule moduleName="TRANSPORTATION">
      <div className="page-content">
        <Container fluid>
          <Breadcrumb
            title="Contracting"
            breadcrumbItem="Transportation Company"
          />

          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <Button color="light" onClick={() => navigate(-1)}>
                <i className="bx bx-arrow-back me-1" />
                Back
              </Button>

              <div className="d-flex gap-2">
                <Button
                  color="warning"
                  onClick={() => setEditCompanyOpen(true)}
                  disabled={!company}
                >
                  <i className="bx bx-edit-alt me-1" />
                  Edit Company
                </Button>
                <Button
                  color="danger"
                  onClick={() =>
                    dispatch(deleteTransportationCompany(companyId))
                  }
                  disabled={!company}
                >
                  <i className="bx bx-block me-1" />
                  Deactivate
                </Button>
              </div>
            </Col>
          </Row>

          {errorMessage && <Alert color="danger">{errorMessage}</Alert>}
          {successMessage && <Alert color="success">{successMessage}</Alert>}

          {companyError && <Alert color="danger">{companyError}</Alert>}

          {loadingCompany ? (
            <div className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading company...
            </div>
          ) : !company ? (
            <Alert color="warning">Company not found.</Alert>
          ) : (
            <>
              {/* Company header */}
              <Row>
                <Col lg={12}>
                  <Card>
                    <CardBody>
                      <div className="d-flex align-items-start gap-3">
                        <div className="avatar-lg">
                          {companyLogo ? (
                            <img
                              src={companyLogo}
                              alt="logo"
                              className="img-fluid rounded"
                              style={{ maxHeight: 72, objectFit: "contain" }}
                            />
                          ) : (
                            <div className="avatar-title rounded bg-light text-muted">
                              <i className="bx bx-building-house font-size-24" />
                            </div>
                          )}
                        </div>

                        <div className="flex-grow-1">
                          <h5 className="mb-1">
                            {company.TRANSPORTATION_COMPANY_NAME}{" "}
                            <span className="ms-2">
                              {statusBadge(
                                company.TRANSPORTATION_COMPANY_ACTIVE_STATUS
                              )}
                            </span>
                          </h5>
                          <div className="text-muted">
                            <div>
                              <i className="bx bx-phone me-1" />
                              {company.TRANSPORTATION_PHONE || "-"}
                            </div>
                            <div>
                              <i className="bx bx-envelope me-1" />
                              {company.TRANSPORTATION_COMPANY_EMAIL || "-"}
                            </div>
                            <div>
                              <i className="bx bx-user me-1" />
                              {company.TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME ||
                                "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Contracts */}
              <Row className="mt-3">
                <Col lg={12}>
                  <Card>
                    <CardBody>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="mb-0">Contracts</h6>
                          <small className="text-muted">
                            Contracts for this transportation company.
                          </small>
                        </div>
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => {
                            setEditingContract(null);
                            setContractModalOpen(true);
                          }}
                        >
                          <i className="bx bx-plus me-1" />
                          Add Contract
                        </Button>
                      </div>

                      {contractsError && (
                        <Alert color="danger">{contractsError}</Alert>
                      )}

                      {loadingContracts ? (
                        <div className="text-center my-3">
                          <Spinner size="sm" className="me-2" />
                          Loading contracts...
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table className="table align-middle table-nowrap mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Start</th>
                                <th>End</th>
                                <th>Attachment</th>
                                <th className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(contracts || []).map((c) => (
                                <tr key={c.TRANSPORTATION_CONTRACT_ID}>
                                  <td>
                                    {toYMD(
                                      c.TRANSPORTATION_CONTRACT_START_DATE
                                    ) || "-"}
                                  </td>
                                  <td>
                                    {toYMD(
                                      c.TRANSPORTATION_CONTRACT_END_DATE
                                    ) || "-"}
                                  </td>
                                  <td>
                                    {c.TRANSPORTATION_CONTRACT_ATTACHMENT ||
                                      "-"}
                                  </td>
                                  <td className="text-end">
                                    <div className="d-flex justify-content-end gap-2">
                                      <Button
                                        color="warning"
                                        size="sm"
                                        onClick={() => {
                                          setEditingContract(c);
                                          setContractModalOpen(true);
                                        }}
                                      >
                                        <i className="bx bx-edit-alt me-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        color="danger"
                                        size="sm"
                                        onClick={() => {
                                          setDeletingContract(c);
                                          setDeleteContractOpen(true);
                                        }}
                                      >
                                        <i className="bx bx-trash me-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {(!contracts || contracts.length === 0) && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="text-center text-muted py-4"
                                  >
                                    No contracts found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Vehicles */}
              <Row className="mt-3">
                <Col lg={12}>
                  <Card>
                    <CardBody>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <h6 className="mb-0">Vehicles</h6>
                          <small className="text-muted">
                            Fleet vehicles for this company.
                          </small>
                        </div>

                        <div className="d-flex gap-2 align-items-center">
                          <select
                            className="form-select form-select-sm"
                            style={{ width: 160 }}
                            value={vehicleActiveStatus}
                            onChange={(e) =>
                              setVehicleActiveStatus(e.target.value)
                            }
                          >
                            <option value="">All</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                          </select>

                          <Button
                            color="primary"
                            size="sm"
                            onClick={() => {
                              setEditingVehicle(null);
                              setVehicleModalOpen(true);
                            }}
                          >
                            <i className="bx bx-plus me-1" />
                            Add Vehicle
                          </Button>
                        </div>
                      </div>

                      {vehiclesError && (
                        <Alert color="danger">{vehiclesError}</Alert>
                      )}

                      {loadingVehicles ? (
                        <div className="text-center my-3">
                          <Spinner size="sm" className="me-2" />
                          Loading vehicles...
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table className="table align-middle table-nowrap mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Plate</th>
                                <th>Make</th>
                                <th>Model</th>
                                <th>PAX</th>
                                <th>Type ID</th>
                                <th className="text-end">Hour Rate</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(vehicles || []).map((v) => (
                                <tr key={v.VEHICLE_ID}>
                                  <td>{v.VEHICLE_PLATE_NUMBER || "-"}</td>
                                  <td>{v.VEHICLE_MAKE || "-"}</td>
                                  <td>{v.VEHICLE_MODEL || "-"}</td>
                                  <td>{v.VEHICLE_PAX ?? "-"}</td>
                                  <td>{v.VEHICLE_TYPE_ID ?? "-"}</td>
                                  <td className="text-end">
                                    {v.VEHICLE_HOUR_RATE ?? "-"}
                                  </td>
                                  <td>
                                    {statusBadge(v.VEHICLE_ACTIVE_STATUS)}
                                  </td>
                                  <td className="text-end">
                                    <div className="d-flex justify-content-end gap-2">
                                      <Button
                                        color="warning"
                                        size="sm"
                                        onClick={() => {
                                          setEditingVehicle(v);
                                          setVehicleModalOpen(true);
                                        }}
                                      >
                                        <i className="bx bx-edit-alt me-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        color="danger"
                                        size="sm"
                                        onClick={() => {
                                          setDeletingVehicle(v);
                                          setDeleteVehicleOpen(true);
                                        }}
                                      >
                                        <i className="bx bx-block me-1" />
                                        Deactivate
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {(!vehicles || vehicles.length === 0) && (
                                <tr>
                                  <td
                                    colSpan={8}
                                    className="text-center text-muted py-4"
                                  >
                                    No vehicles found.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Edit Company Modal */}
              <Modal
                isOpen={editCompanyOpen}
                toggle={() => setEditCompanyOpen((v) => !v)}
                centered
              >
                <ModalHeader toggle={() => setEditCompanyOpen(false)}>
                  Edit Company
                </ModalHeader>
                <Formik
                  enableReinitialize
                  initialValues={{
                    TRANSPORTATION_COMPANY_NAME:
                      company?.TRANSPORTATION_COMPANY_NAME || "",
                    TRANSPORTATION_PHONE: company?.TRANSPORTATION_PHONE || "",
                    TRANSPORTATION_COMPANY_EMAIL:
                      company?.TRANSPORTATION_COMPANY_EMAIL || "",
                    TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME:
                      company?.TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME || "",
                    TRANSPORTATION_COMPANY_LOGO:
                      company?.TRANSPORTATION_COMPANY_LOGO || "",
                    TRANSPORTATION_COMPANY_ACTIVE_STATUS: Number(
                      company?.TRANSPORTATION_COMPANY_ACTIVE_STATUS ?? 1
                    ),
                  }}
                  validationSchema={Yup.object({
                    TRANSPORTATION_COMPANY_NAME: Yup.string().required(
                      "Company name is required"
                    ),
                  })}
                  onSubmit={(values, { setSubmitting }) => {
                    const payload = {
                      TRANSPORTATION_COMPANY_NAME:
                        values.TRANSPORTATION_COMPANY_NAME,
                      TRANSPORTATION_PHONE: values.TRANSPORTATION_PHONE || "",
                      TRANSPORTATION_COMPANY_EMAIL:
                        values.TRANSPORTATION_COMPANY_EMAIL || "",
                      TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME:
                        values.TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME || "",
                      TRANSPORTATION_COMPANY_LOGO:
                        values.TRANSPORTATION_COMPANY_LOGO || "",
                      TRANSPORTATION_COMPANY_ACTIVE_STATUS: Number(
                        values.TRANSPORTATION_COMPANY_ACTIVE_STATUS
                      ),
                    };

                    dispatch(updateTransportationCompany(companyId, payload));
                    setSubmitting(false);
                    setEditCompanyOpen(false);
                  }}
                >
                  {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    isSubmitting,
                  }) => (
                    <Form onSubmit={handleSubmit}>
                      <ModalBody>
                        <div className="mb-3">
                          <Label>Company Name</Label>
                          <Input
                            name="TRANSPORTATION_COMPANY_NAME"
                            value={values.TRANSPORTATION_COMPANY_NAME}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={
                              touched.TRANSPORTATION_COMPANY_NAME &&
                              !!errors.TRANSPORTATION_COMPANY_NAME
                            }
                          />
                          <FormFeedback>
                            {errors.TRANSPORTATION_COMPANY_NAME}
                          </FormFeedback>
                        </div>

                        <Row>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Phone</Label>
                              <Input
                                name="TRANSPORTATION_PHONE"
                                value={values.TRANSPORTATION_PHONE}
                                onChange={handleChange}
                              />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Email</Label>
                              <Input
                                name="TRANSPORTATION_COMPANY_EMAIL"
                                value={values.TRANSPORTATION_COMPANY_EMAIL}
                                onChange={handleChange}
                              />
                            </div>
                          </Col>
                        </Row>

                        <div className="mb-3">
                          <Label>Contact Person</Label>
                          <Input
                            name="TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME"
                            value={
                              values.TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME
                            }
                            onChange={handleChange}
                          />
                        </div>

                        <div className="mb-3">
                          <Label>Logo (URL or file ref)</Label>
                          <Input
                            name="TRANSPORTATION_COMPANY_LOGO"
                            value={values.TRANSPORTATION_COMPANY_LOGO}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="mb-0">
                          <Label>Status</Label>
                          <Input
                            type="select"
                            name="TRANSPORTATION_COMPANY_ACTIVE_STATUS"
                            value={values.TRANSPORTATION_COMPANY_ACTIVE_STATUS}
                            onChange={handleChange}
                          >
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                          </Input>
                        </div>
                      </ModalBody>
                      <ModalFooter>
                        <Button
                          color="secondary"
                          onClick={() => setEditCompanyOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="primary"
                          type="submit"
                          disabled={isSubmitting}
                        >
                          Save
                        </Button>
                      </ModalFooter>
                    </Form>
                  )}
                </Formik>
              </Modal>

              {/* Create/Edit Contract Modal */}
              <Modal
                isOpen={contractModalOpen}
                toggle={() => setContractModalOpen((v) => !v)}
                centered
              >
                <ModalHeader toggle={() => setContractModalOpen(false)}>
                  {editingContract ? "Edit Contract" : "Add Contract"}
                </ModalHeader>

                <Formik
                  enableReinitialize
                  initialValues={{
                    TRANSPORTATION_CONTRACT_START_DATE: editingContract
                      ? toYMD(
                          editingContract.TRANSPORTATION_CONTRACT_START_DATE
                        )
                      : "",
                    TRANSPORTATION_CONTRACT_END_DATE: editingContract
                      ? toYMD(editingContract.TRANSPORTATION_CONTRACT_END_DATE)
                      : "",
                    TRANSPORTATION_CONTRACT_ATTACHMENT:
                      editingContract?.TRANSPORTATION_CONTRACT_ATTACHMENT || "",
                  }}
                  validationSchema={Yup.object({
                    TRANSPORTATION_CONTRACT_START_DATE: Yup.string().required(
                      "Start date is required"
                    ),
                    TRANSPORTATION_CONTRACT_END_DATE: Yup.string()
                      .nullable()
                      .test(
                        "endAfterStart",
                        "End date must be on/after start date",
                        function (val) {
                          const start =
                            this.parent.TRANSPORTATION_CONTRACT_START_DATE;
                          if (!start || !val) return true;
                          return (
                            new Date(val).getTime() >= new Date(start).getTime()
                          );
                        }
                      ),
                  })}
                  onSubmit={(values, { setSubmitting }) => {
                    const payload = {
                      TRANSPORTATION_CONTRACT_START_DATE:
                        values.TRANSPORTATION_CONTRACT_START_DATE,
                      TRANSPORTATION_CONTRACT_END_DATE:
                        values.TRANSPORTATION_CONTRACT_END_DATE || null,
                      TRANSPORTATION_CONTRACT_ATTACHMENT:
                        values.TRANSPORTATION_CONTRACT_ATTACHMENT || null,
                    };

                    if (editingContract) {
                      dispatch(
                        updateTransportationContract(
                          editingContract.TRANSPORTATION_CONTRACT_ID,
                          payload,
                          companyId
                        )
                      );
                    } else {
                      dispatch(
                        createTransportationContract(companyId, payload)
                      );
                    }

                    setSubmitting(false);
                    setContractModalOpen(false);
                    setEditingContract(null);
                  }}
                >
                  {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    isSubmitting,
                  }) => (
                    <Form onSubmit={handleSubmit}>
                      <ModalBody>
                        <div className="mb-3">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            name="TRANSPORTATION_CONTRACT_START_DATE"
                            value={values.TRANSPORTATION_CONTRACT_START_DATE}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={
                              touched.TRANSPORTATION_CONTRACT_START_DATE &&
                              !!errors.TRANSPORTATION_CONTRACT_START_DATE
                            }
                          />
                          <FormFeedback>
                            {errors.TRANSPORTATION_CONTRACT_START_DATE}
                          </FormFeedback>
                        </div>

                        <div className="mb-3">
                          <Label>End Date (optional)</Label>
                          <Input
                            type="date"
                            name="TRANSPORTATION_CONTRACT_END_DATE"
                            value={values.TRANSPORTATION_CONTRACT_END_DATE}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={
                              touched.TRANSPORTATION_CONTRACT_END_DATE &&
                              !!errors.TRANSPORTATION_CONTRACT_END_DATE
                            }
                          />
                          <FormFeedback>
                            {errors.TRANSPORTATION_CONTRACT_END_DATE}
                          </FormFeedback>
                        </div>

                        <div className="mb-0">
                          <Label>Attachment (file ID)</Label>
                          <Input
                            name="TRANSPORTATION_CONTRACT_ATTACHMENT"
                            value={values.TRANSPORTATION_CONTRACT_ATTACHMENT}
                            onChange={handleChange}
                          />
                        </div>
                      </ModalBody>

                      <ModalFooter>
                        <Button
                          color="secondary"
                          onClick={() => setContractModalOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="primary"
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {editingContract ? "Save" : "Create"}
                        </Button>
                      </ModalFooter>
                    </Form>
                  )}
                </Formik>
              </Modal>

              {/* Delete Contract Modal */}
              <Modal
                isOpen={deleteContractOpen}
                toggle={() => setDeleteContractOpen((v) => !v)}
                centered
              >
                <ModalHeader toggle={() => setDeleteContractOpen(false)}>
                  Delete Contract
                </ModalHeader>
                <ModalBody>
                  Are you sure you want to delete this contract?
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="secondary"
                    onClick={() => setDeleteContractOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="danger"
                    onClick={() => {
                      if (!deletingContract) return;
                      dispatch(
                        deleteTransportationContract(
                          deletingContract.TRANSPORTATION_CONTRACT_ID,
                          companyId
                        )
                      );
                      setDeleteContractOpen(false);
                      setDeletingContract(null);
                    }}
                  >
                    Delete
                  </Button>
                </ModalFooter>
              </Modal>

              {/* Create/Edit Vehicle Modal */}
              <Modal
                isOpen={vehicleModalOpen}
                toggle={() => setVehicleModalOpen((v) => !v)}
                centered
              >
                <ModalHeader toggle={() => setVehicleModalOpen(false)}>
                  {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
                </ModalHeader>

                <Formik
                  enableReinitialize
                  initialValues={{
                    VEHICLE_PLATE_NUMBER:
                      editingVehicle?.VEHICLE_PLATE_NUMBER || "",
                    VEHICLE_MAKE: editingVehicle?.VEHICLE_MAKE || "",
                    VEHICLE_MODEL: editingVehicle?.VEHICLE_MODEL || "",
                    VEHICLE_PAX: editingVehicle?.VEHICLE_PAX ?? "",
                    VEHICLE_TYPE_ID: editingVehicle?.VEHICLE_TYPE_ID ?? "",
                    VEHICLE_HOUR_RATE: editingVehicle?.VEHICLE_HOUR_RATE ?? "",
                    VEHICLE_ACTIVE_STATUS: Number(
                      editingVehicle?.VEHICLE_ACTIVE_STATUS ?? 1
                    ),
                  }}
                  validationSchema={Yup.object({
                    VEHICLE_PLATE_NUMBER: Yup.string().required(
                      "Plate number is required"
                    ),
                    VEHICLE_PAX: Yup.number()
                      .nullable()
                      .typeError("PAX must be a number"),
                    VEHICLE_HOUR_RATE: Yup.number()
                      .nullable()
                      .typeError("Hour rate must be a number"),
                  })}
                  onSubmit={(values, { setSubmitting }) => {
                    const payload = {
                      VEHICLE_PLATE_NUMBER: values.VEHICLE_PLATE_NUMBER,
                      VEHICLE_MAKE: values.VEHICLE_MAKE || "",
                      VEHICLE_MODEL: values.VEHICLE_MODEL || "",
                      VEHICLE_PAX:
                        values.VEHICLE_PAX === ""
                          ? null
                          : Number(values.VEHICLE_PAX),
                      VEHICLE_TYPE_ID:
                        values.VEHICLE_TYPE_ID === ""
                          ? null
                          : Number(values.VEHICLE_TYPE_ID),
                      VEHICLE_HOUR_RATE:
                        values.VEHICLE_HOUR_RATE === ""
                          ? null
                          : Number(values.VEHICLE_HOUR_RATE),
                      VEHICLE_ACTIVE_STATUS: Number(
                        values.VEHICLE_ACTIVE_STATUS
                      ),
                    };

                    if (editingVehicle) {
                      dispatch(
                        updateTransportationVehicle(
                          editingVehicle.VEHICLE_ID,
                          payload,
                          companyId
                        )
                      );
                    } else {
                      dispatch(createTransportationVehicle(companyId, payload));
                    }

                    setSubmitting(false);
                    setVehicleModalOpen(false);
                    setEditingVehicle(null);
                  }}
                >
                  {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    isSubmitting,
                  }) => (
                    <Form onSubmit={handleSubmit}>
                      <ModalBody>
                        <Row>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Plate</Label>
                              <Input
                                name="VEHICLE_PLATE_NUMBER"
                                value={values.VEHICLE_PLATE_NUMBER}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={
                                  touched.VEHICLE_PLATE_NUMBER &&
                                  !!errors.VEHICLE_PLATE_NUMBER
                                }
                              />
                              <FormFeedback>
                                {errors.VEHICLE_PLATE_NUMBER}
                              </FormFeedback>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Status</Label>
                              <Input
                                type="select"
                                name="VEHICLE_ACTIVE_STATUS"
                                value={values.VEHICLE_ACTIVE_STATUS}
                                onChange={handleChange}
                              >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                              </Input>
                            </div>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Make</Label>
                              <Input
                                name="VEHICLE_MAKE"
                                value={values.VEHICLE_MAKE}
                                onChange={handleChange}
                              />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <Label>Model</Label>
                              <Input
                                name="VEHICLE_MODEL"
                                value={values.VEHICLE_MODEL}
                                onChange={handleChange}
                              />
                            </div>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={4}>
                            <div className="mb-3">
                              <Label>PAX</Label>
                              <Input
                                name="VEHICLE_PAX"
                                value={values.VEHICLE_PAX}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={
                                  touched.VEHICLE_PAX && !!errors.VEHICLE_PAX
                                }
                              />
                              <FormFeedback>{errors.VEHICLE_PAX}</FormFeedback>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="mb-3">
                              <Label>Type ID</Label>
                              <Input
                                name="VEHICLE_TYPE_ID"
                                value={values.VEHICLE_TYPE_ID}
                                onChange={handleChange}
                              />
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="mb-0">
                              <Label>Hour Rate</Label>
                              <Input
                                name="VEHICLE_HOUR_RATE"
                                value={values.VEHICLE_HOUR_RATE}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                invalid={
                                  touched.VEHICLE_HOUR_RATE &&
                                  !!errors.VEHICLE_HOUR_RATE
                                }
                              />
                              <FormFeedback>
                                {errors.VEHICLE_HOUR_RATE}
                              </FormFeedback>
                            </div>
                          </Col>
                        </Row>
                      </ModalBody>

                      <ModalFooter>
                        <Button
                          color="secondary"
                          onClick={() => setVehicleModalOpen(false)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="primary"
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {editingVehicle ? "Save" : "Create"}
                        </Button>
                      </ModalFooter>
                    </Form>
                  )}
                </Formik>
              </Modal>

              {/* Deactivate Vehicle Modal */}
              <Modal
                isOpen={deleteVehicleOpen}
                toggle={() => setDeleteVehicleOpen((v) => !v)}
                centered
              >
                <ModalHeader toggle={() => setDeleteVehicleOpen(false)}>
                  Deactivate Vehicle
                </ModalHeader>
                <ModalBody>
                  Are you sure you want to deactivate vehicle{" "}
                  <strong>{deletingVehicle?.VEHICLE_PLATE_NUMBER}</strong>?
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="secondary"
                    onClick={() => setDeleteVehicleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="danger"
                    onClick={() => {
                      if (!deletingVehicle) return;
                      dispatch(
                        deleteTransportationVehicle(
                          deletingVehicle.VEHICLE_ID,
                          companyId
                        )
                      );
                      setDeleteVehicleOpen(false);
                      setDeletingVehicle(null);
                    }}
                  >
                    Deactivate
                  </Button>
                </ModalFooter>
              </Modal>
            </>
          )}
        </Container>
      </div>
    </RequireModule>
  );
};

export default function TransportationCompanyProfile() {
  return <TransportationCompanyProfileInner />;
}
