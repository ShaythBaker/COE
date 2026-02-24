// src/pages/Contracting/TransportationCompanyProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
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

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import AttachmentUploader from "../../components/Common/AttachmentUploader";

import { getSystemListItems } from "/src/helpers/fakebackend_helper";

import {
  getAttachmentUrl,
  viewAttachment,
} from "../../helpers/attachments_helper";

import {
  getTransportationCompany,
  updateTransportationCompany,
  getTransportationContracts,
  createTransportationContract,
  updateTransportationContract,
  deleteTransportationContract,
  getTransportationVehicles,
  createTransportationVehicle,
  updateTransportationVehicle,
  deleteTransportationVehicle,

  // Fees (NEW - Redux wired)
  getTransportationCompanyFees,
  createTransportationCompanyFee,
  updateTransportationFee,
  deleteTransportationFee,

  clearTransportationMessages,
} from "../../store/transportation/actions";

const toYMD = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

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

const CompanySchema = Yup.object({
  TRANSPORTATION_COMPANY_NAME: Yup.string().required(
    "Company name is required"
  ),
  TRANSPORTATION_COMPANY_EMAIL: Yup.string().email("Invalid email").nullable(),
  TRANSPORTATION_PHONE: Yup.string().nullable(),
  TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME: Yup.string().nullable(),
  TRANSPORTATION_COMPANY_ACTIVE_STATUS: Yup.mixed().oneOf([0, 1]).required(),
});

const ContractSchema = Yup.object({
  TRANSPORTATION_CONTRACT_START_DATE: Yup.string()
    .required("Start date is required")
    .nullable(),
  TRANSPORTATION_CONTRACT_END_DATE: Yup.string()
    .required("End date is required")
    .nullable(),
});

const FeeSchema = Yup.object({
  TRANSPORTATION_FEE_VECHLE_TYPE: Yup.mixed()
    .required("Vehicle type is required")
    .test("is-numberish", "Vehicle type is required", (v) => {
      if (v === null || v === undefined || v === "") return false;
      return !Number.isNaN(Number(v));
    }),
  TRANSPORTATION_FEE_TYPE: Yup.mixed()
    .required("Fee type is required")
    .test("is-numberish", "Fee type is required", (v) => {
      if (v === null || v === undefined || v === "") return false;
      return !Number.isNaN(Number(v));
    }),
  TRANSPORTATION_FEE_AMOUNT: Yup.number()
    .typeError("Amount must be a number")
    .required("Amount is required")
    .min(0, "Amount must be >= 0"),
  ACTIVE_STATSUS: Yup.mixed().oneOf([0, 1]).nullable(),
});

const TransportationCompanyProfileInner = () => {
  document.title = "Transportation Company Profile | COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { companyId } = useParams();

  const currentUserId = useMemo(() => getCurrentUserId(), []);

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

    // Fees reducer slice (NEW)
    fees,
    loadingFees,
    feesError,

    successMessage,
    errorMessage,
  } = useSelector((state) => state.Transportation || {});

  // Match ClientProfile: resolve logo URL from fileId (S3)
  const [logoUrl, setLogoUrl] = useState("");

  // Vehicle Types dropdown (LIST_KEY = VEHICLE_TYPE)
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicleTypesLoading, setVehicleTypesLoading] = useState(false);
  const [vehicleTypesError, setVehicleTypesError] = useState(null);

  const vehicleTypeLabelById = useMemo(() => {
    const m = new Map();
    (vehicleTypes || []).forEach((t) =>
      m.set(String(t.LIST_ITEM_ID), t.ITEM_NAME)
    );
    return m;
  }, [vehicleTypes]);

  // Fee Types dropdown (LIST_KEY = TRANSPORTATION_FEE_TYPE)
  const [feeTypes, setFeeTypes] = useState([]);
  const [feeTypesLoading, setFeeTypesLoading] = useState(false);
  const [feeTypesError, setFeeTypesError] = useState(null);

  const feeTypeLabelById = useMemo(() => {
    const m = new Map();
    (feeTypes || []).forEach((t) =>
      m.set(String(t.LIST_ITEM_ID), t.ITEM_NAME)
    );
    return m;
  }, [feeTypes]);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // Vehicles filter
  const [vehicleActiveStatus, setVehicleActiveStatus] = useState("");

  // Fees filter + modal
  const [feeActiveStatus, setFeeActiveStatus] = useState("1"); // default Active
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);

  // UI restriction: no duplicate active fees for same (vehicleType + feeType)
  const isDuplicateFeeCombo = (vehicleTypeId, feeTypeId, excludeFeeId = null) => {
    const v = String(vehicleTypeId ?? "");
    const f = String(feeTypeId ?? "");
    if (!v || !f) return false;

    return (fees || []).some((x) => {
      const sameCombo =
        String(x.TRANSPORTATION_FEE_VECHLE_TYPE) === v &&
        String(x.TRANSPORTATION_FEE_TYPE) === f;

      const notSameRow = excludeFeeId
        ? String(x.TRANSPORTATION_FEE_ID) !== String(excludeFeeId)
        : true;

      const isActive = x.ACTIVE_STATSUS === 1 || x.ACTIVE_STATSUS === "1";
      return sameCombo && notSameRow && isActive;
    });
  };

  // Load list items
  useEffect(() => {
    const loadVehicleTypes = async () => {
      setVehicleTypesLoading(true);
      setVehicleTypesError(null);
      try {
        const res = await getSystemListItems("VEHICLE_TYPE");
        setVehicleTypes(res?.ITEMS || []);
      } catch (e) {
        console.error("Failed to load VEHICLE_TYPE list", e);
        setVehicleTypesError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load vehicle types"
        );
      } finally {
        setVehicleTypesLoading(false);
      }
    };
    loadVehicleTypes();
  }, []);

  useEffect(() => {
    const loadFeeTypes = async () => {
      setFeeTypesLoading(true);
      setFeeTypesError(null);
      try {
        const res = await getSystemListItems("TRANSPORTATION_FEE_TYPE");
        setFeeTypes(res?.ITEMS || []);
      } catch (e) {
        console.error("Failed to load TRANSPORTATION_FEE_TYPE list", e);
        setFeeTypesError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load fee types"
        );
      } finally {
        setFeeTypesLoading(false);
      }
    };
    loadFeeTypes();
  }, []);

  // Load base data
  useEffect(() => {
    dispatch(getTransportationCompany(companyId));
    dispatch(getTransportationContracts(companyId));
    dispatch(
      getTransportationVehicles(companyId, {
        ACTIVE_STATUS: vehicleActiveStatus,
      })
    );
  }, [dispatch, companyId]);

  // Reload vehicles on filter
  useEffect(() => {
    dispatch(
      getTransportationVehicles(companyId, {
        ACTIVE_STATUS: vehicleActiveStatus,
      })
    );
  }, [dispatch, companyId, vehicleActiveStatus]);

  // Load fees on filter
  useEffect(() => {
    dispatch(getTransportationCompanyFees(companyId, feeActiveStatus));
  }, [dispatch, companyId, feeActiveStatus]);

  // Toast notifications (no banners)
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearTransportationMessages());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(clearTransportationMessages());
    }
  }, [errorMessage, dispatch]);

  useEffect(() => {
    return () => dispatch(clearTransportationMessages());
  }, [dispatch]);

  // Resolve logo from S3 file id (same as ClientProfile)
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const fileId = company?.TRANSPORTATION_COMPANY_LOGO;
        if (fileId) {
          const url = await getAttachmentUrl(fileId);
          setLogoUrl(url || "");
        } else {
          setLogoUrl("");
        }
      } catch (e) {
        console.error("Failed to load transportation company logo", e);
        setLogoUrl("");
      }
    };

    if (company) loadLogo();
  }, [company]);

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const toggleEdit = () => setIsEditOpen((v) => !v);

  // Loading shell (same spirit as ClientProfile)
  if (loadingCompany || (!company && !companyError)) {
    return (
      <RequireModule moduleName="TRANSPORTATION">
        <div className="page-content">
          <ToastContainer position="top-right" autoClose={3000} />
          <Container fluid>
            <Breadcrumb title="Contracting" breadcrumbItem="Company Profile" />
            <Card>
              <CardBody className="text-center my-4">
                <Spinner size="sm" className="me-2" />
                Loading company details...
              </CardBody>
            </Card>
          </Container>
        </div>
      </RequireModule>
    );
  }

  if (!company) {
    return (
      <RequireModule moduleName="TRANSPORTATION">
        <div className="page-content">
          <ToastContainer position="top-right" autoClose={3000} />
          <Container fluid>
            <Breadcrumb title="Contracting" breadcrumbItem="Company Profile" />
            <Card>
              <CardBody className="text-center my-4 text-danger">
                {companyError || "Company not found."}
              </CardBody>
            </Card>
          </Container>
        </div>
      </RequireModule>
    );
  }

  return (
    <RequireModule moduleName="TRANSPORTATION">
      <div className="page-content">
        <ToastContainer position="top-right" autoClose={3000} />

        <Container fluid>
          <Breadcrumb title="Contracting" breadcrumbItem="Company Profile" />

          {/* Top actions row (same structure as ClientProfile) */}
          <Row className="mb-3">
            <Col className="d-flex align-items-center">
              <Button
                color="secondary"
                size="sm"
                onClick={() =>
                  navigate("/contracting/transportation/companies")
                }
              >
                <i className="bx bx-arrow-back me-1" />
                Back to Companies
              </Button>

              <Button
                color="primary"
                size="sm"
                className="ms-2"
                onClick={toggleEdit}
              >
                <i className="bx bx-edit-alt me-1" />
                Edit Company
              </Button>
            </Col>
          </Row>

          <Row>
            {/* Left: Logo card (same layout idea as ClientProfile) */}
            <Col lg={4}>
              <Card className="mb-3">
                <CardBody className="text-center">
                  {logoUrl ? (
                    <div className="avatar-xl mx-auto">
                      <div className="avatar-title rounded-circle bg-light">
                        <img
                          src={logoUrl}
                          alt="Company Logo"
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
                  <h4 className="mb-1">
                    {company?.TRANSPORTATION_COMPANY_NAME || "-"}
                  </h4>
                  <div className="mt-2">
                    {renderStatusBadge(
                      company?.TRANSPORTATION_COMPANY_ACTIVE_STATUS
                    )}
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Right: Content */}
            <Col lg={8}>
              {/* General info */}
              <Card className="mb-3">
                <CardBody>
                  <Row>
                    <Col md={12}>
                      <h6 className="mb-3">General Info</h6>
                      <dl className="row mb-0">
                        <dt className="col-sm-4">Email</dt>
                        <dd className="col-sm-8">
                          {company?.TRANSPORTATION_COMPANY_EMAIL || "-"}
                        </dd>

                        <dt className="col-sm-4">Phone</dt>
                        <dd className="col-sm-8">
                          {company?.TRANSPORTATION_PHONE || "-"}
                        </dd>

                        <dt className="col-sm-4">Contact</dt>
                        <dd className="col-sm-8">
                          {company?.TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME ||
                            "-"}
                        </dd>
                      </dl>
                    </Col>
                  </Row>
                </CardBody>
              </Card>

              {/* Contracts */}
              <Card className="mb-3">
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

                  {contractsError ? (
                    <small className="text-danger">{contractsError}</small>
                  ) : null}

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
                          {(contracts || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center text-muted">
                                No contracts found.
                              </td>
                            </tr>
                          ) : (
                            (contracts || []).map((c) => (
                              <tr key={c.TRANSPORTATION_CONTRACT_ID}>
                                <td>
                                  {toYMD(
                                    c.TRANSPORTATION_CONTRACT_START_DATE
                                  ) || "-"}
                                </td>
                                <td>
                                  {toYMD(c.TRANSPORTATION_CONTRACT_END_DATE) ||
                                    "-"}
                                </td>
                                <td>
                                  {c.TRANSPORTATION_CONTRACT_ATTACHMENT ? (
                                    <Button
                                      type="button"
                                      color="link"
                                      className="p-0"
                                      onClick={() =>
                                        viewAttachment(
                                          c.TRANSPORTATION_CONTRACT_ATTACHMENT
                                        )
                                      }
                                    >
                                      View attachment
                                    </Button>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
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
                                        dispatch(
                                          deleteTransportationContract(
                                            c.TRANSPORTATION_CONTRACT_ID,
                                            companyId
                                          )
                                        );
                                      }}
                                    >
                                      <i className="bx bx-trash me-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Fees (NEW) */}
              <Card className="mb-3">
                <CardBody>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h6 className="mb-0">Transportation Fees</h6>
                      <small className="text-muted">
                        Fee rates by vehicle type and fee type.
                      </small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Input
                        type="select"
                        value={feeActiveStatus}
                        onChange={(e) => setFeeActiveStatus(e.target.value)}
                        style={{ width: 160 }}
                      >
                        <option value="">All</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </Input>

                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => {
                          setEditingFee(null);
                          setFeeModalOpen(true);
                        }}
                        disabled={vehicleTypesLoading || feeTypesLoading}
                      >
                        <i className="bx bx-plus me-1" />
                        Add Fee
                      </Button>
                    </div>
                  </div>

                  {feesError ? (
                    <small className="text-danger d-block">{feesError}</small>
                  ) : null}

                  {(vehicleTypesLoading || feeTypesLoading) && (
                    <div className="text-muted mb-2">
                      <Spinner size="sm" className="me-2" />
                      Loading lists...
                    </div>
                  )}

                  {vehicleTypesError ? (
                    <small className="text-danger d-block">
                      {vehicleTypesError}
                    </small>
                  ) : null}
                  {feeTypesError ? (
                    <small className="text-danger d-block">{feeTypesError}</small>
                  ) : null}

                  {loadingFees ? (
                    <div className="text-center my-3">
                      <Spinner size="sm" className="me-2" />
                      Loading fees...
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table align-middle table-nowrap mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Vehicle Type</th>
                            <th>Fee Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(fees || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center text-muted">
                                No fees found.
                              </td>
                            </tr>
                          ) : (
                            (fees || []).map((f) => (
                              <tr key={f.TRANSPORTATION_FEE_ID}>
                                <td>
                                  {vehicleTypeLabelById.get(
                                    String(f.TRANSPORTATION_FEE_VECHLE_TYPE)
                                  ) || "-"}
                                </td>
                                <td>
                                  {feeTypeLabelById.get(
                                    String(f.TRANSPORTATION_FEE_TYPE)
                                  ) || "-"}
                                </td>
                                <td>{f.TRANSPORTATION_FEE_AMOUNT ?? "-"}</td>
                                <td>{renderStatusBadge(f.ACTIVE_STATSUS)}</td>
                                <td className="text-end">
                                  <div className="d-flex justify-content-end gap-2">
                                    <Button
                                      color="warning"
                                      size="sm"
                                      onClick={() => {
                                        setEditingFee(f);
                                        setFeeModalOpen(true);
                                      }}
                                    >
                                      <i className="bx bx-edit-alt me-1" />
                                      Edit
                                    </Button>

                                    <Button
                                      color="danger"
                                      size="sm"
                                      onClick={() =>
                                        dispatch(
                                          deleteTransportationFee(
                                            f.TRANSPORTATION_FEE_ID,
                                            companyId,
                                            feeActiveStatus
                                          )
                                        )
                                      }
                                    >
                                      <i className="bx bx-block me-1" />
                                      Deactivate
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Vehicles */}
              <Card>
                <CardBody>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h6 className="mb-0">Vehicles</h6>
                      <small className="text-muted">
                        Vehicles for this transportation company.
                      </small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Input
                        type="select"
                        value={vehicleActiveStatus}
                        onChange={(e) => setVehicleActiveStatus(e.target.value)}
                        style={{ width: 160 }}
                      >
                        <option value="">All</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </Input>

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

                  {vehiclesError ? (
                    <small className="text-danger">{vehiclesError}</small>
                  ) : null}

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
                            <th>Type</th>
                            <th>Hour Rate</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(vehicles || []).length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center text-muted">
                                No vehicles found.
                              </td>
                            </tr>
                          ) : (
                            (vehicles || []).map((v) => (
                              <tr key={v.VEHICLE_ID}>
                                <td>{v.VEHICLE_PLATE_NUMBER || "-"}</td>
                                <td>{v.VEHICLE_MAKE || "-"}</td>
                                <td>{v.VEHICLE_MODEL || "-"}</td>
                                <td>{v.VEHICLE_PAX ?? "-"}</td>
                                <td>
                                  {v.VEHICLE_TYPE_NAME ||
                                    vehicleTypeLabelById.get(
                                      String(v.VEHICLE_TYPE_ID)
                                    ) ||
                                    "-"}
                                </td>
                                <td>{v.VEHICLE_HOUR_RATE ?? "-"}</td>
                                <td>
                                  {renderStatusBadge(v.VEHICLE_ACTIVE_STATUS)}
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
                                      onClick={() =>
                                        dispatch(
                                          deleteTransportationVehicle(
                                            v.VEHICLE_ID,
                                            companyId
                                          )
                                        )
                                      }
                                    >
                                      <i className="bx bx-block me-1" />
                                      Deactivate
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
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
          <Modal isOpen={isEditOpen} toggle={toggleEdit} centered>
            <ModalHeader toggle={toggleEdit}>Edit Company</ModalHeader>

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
                TRANSPORTATION_COMPANY_ACTIVE_STATUS:
                  company?.TRANSPORTATION_COMPANY_ACTIVE_STATUS === 0 ||
                  company?.TRANSPORTATION_COMPANY_ACTIVE_STATUS === "0"
                    ? 0
                    : 1,

                // uploader fields
                COMPANY_LOGO_FILE_ID: company?.TRANSPORTATION_COMPANY_LOGO || null,
                COMPANY_LOGO_FILE_NAME: "",
              }}
              validationSchema={CompanySchema}
              onSubmit={(values, { setSubmitting }) => {
                const payload = {
                  TRANSPORTATION_COMPANY_NAME: values.TRANSPORTATION_COMPANY_NAME,
                  TRANSPORTATION_PHONE: values.TRANSPORTATION_PHONE || "",
                  TRANSPORTATION_COMPANY_EMAIL:
                    values.TRANSPORTATION_COMPANY_EMAIL || "",
                  TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME:
                    values.TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME || "",
                  TRANSPORTATION_COMPANY_ACTIVE_STATUS: Number(
                    values.TRANSPORTATION_COMPANY_ACTIVE_STATUS
                  ),

                  // store FILE_ID (S3)
                  TRANSPORTATION_COMPANY_LOGO:
                    values.COMPANY_LOGO_FILE_ID || null,

                  UPDATED_BY: currentUserId ? Number(currentUserId) : undefined,
                };

                Object.keys(payload).forEach(
                  (k) => payload[k] === undefined && delete payload[k]
                );

                dispatch(updateTransportationCompany(companyId, payload));
                setSubmitting(false);
                setIsEditOpen(false);
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
                setFieldValue,
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
                      {touched.TRANSPORTATION_COMPANY_NAME &&
                      errors.TRANSPORTATION_COMPANY_NAME ? (
                        <FormFeedback>
                          {errors.TRANSPORTATION_COMPANY_NAME}
                        </FormFeedback>
                      ) : null}
                    </div>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Phone</Label>
                          <Input
                            name="TRANSPORTATION_PHONE"
                            value={values.TRANSPORTATION_PHONE}
                            onChange={handleChange}
                            onBlur={handleBlur}
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
                            onBlur={handleBlur}
                            invalid={
                              touched.TRANSPORTATION_COMPANY_EMAIL &&
                              !!errors.TRANSPORTATION_COMPANY_EMAIL
                            }
                          />
                          {touched.TRANSPORTATION_COMPANY_EMAIL &&
                          errors.TRANSPORTATION_COMPANY_EMAIL ? (
                            <FormFeedback>
                              {errors.TRANSPORTATION_COMPANY_EMAIL}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <Label>Contact Person</Label>
                      <Input
                        name="TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME"
                        value={values.TRANSPORTATION_COMPANY_CONTACT_PERSON_NAME}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>

                    <div className="mb-3">
                      <Label>Company Logo</Label>
                      <AttachmentUploader
                        userId={currentUserId}
                        category="TRANSPORTATION_COMPANY_LOGO"
                        accept="image/*"
                        fileId={values.COMPANY_LOGO_FILE_ID}
                        fileName={values.COMPANY_LOGO_FILE_NAME}
                        onUploaded={(fileMeta) => {
                          setFieldValue(
                            "COMPANY_LOGO_FILE_ID",
                            fileMeta?.FILE_ID || null
                          );
                          setFieldValue(
                            "COMPANY_LOGO_FILE_NAME",
                            fileMeta?.FILE_NAME ||
                              fileMeta?.ORIGINAL_NAME ||
                              ""
                          );
                        }}
                      />
                      <small className="text-muted d-block mt-1">
                        Uploading a new logo will replace the current one.
                      </small>
                    </div>

                    <div className="mb-3">
                      <Label>Status *</Label>
                      <Input
                        type="select"
                        name="TRANSPORTATION_COMPANY_ACTIVE_STATUS"
                        value={values.TRANSPORTATION_COMPANY_ACTIVE_STATUS}
                        onChange={(e) =>
                          setFieldValue(
                            "TRANSPORTATION_COMPANY_ACTIVE_STATUS",
                            Number(e.target.value)
                          )
                        }
                        onBlur={handleBlur}
                        invalid={
                          touched.TRANSPORTATION_COMPANY_ACTIVE_STATUS &&
                          !!errors.TRANSPORTATION_COMPANY_ACTIVE_STATUS
                        }
                      >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive</option>
                      </Input>
                      {touched.TRANSPORTATION_COMPANY_ACTIVE_STATUS &&
                      errors.TRANSPORTATION_COMPANY_ACTIVE_STATUS ? (
                        <FormFeedback>
                          {errors.TRANSPORTATION_COMPANY_ACTIVE_STATUS}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      color="light"
                      onClick={toggleEdit}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
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

          {/* Create/Edit Contract Modal */}
          <Modal
            isOpen={contractModalOpen}
            toggle={() => setContractModalOpen((v) => !v)}
            centered
          >
            <ModalHeader
              toggle={() => {
                setContractModalOpen(false);
                setEditingContract(null);
              }}
            >
              {editingContract ? "Edit Contract" : "Add Contract"}
            </ModalHeader>

            <Formik
              enableReinitialize
              initialValues={{
                TRANSPORTATION_CONTRACT_START_DATE: toYMD(
                  editingContract?.TRANSPORTATION_CONTRACT_START_DATE
                ),
                TRANSPORTATION_CONTRACT_END_DATE: toYMD(
                  editingContract?.TRANSPORTATION_CONTRACT_END_DATE
                ),

                CONTRACT_FILE_ID:
                  editingContract?.TRANSPORTATION_CONTRACT_ATTACHMENT || null,
                CONTRACT_FILE_NAME: "",
              }}
              validationSchema={ContractSchema}
              onSubmit={(values, { setSubmitting }) => {
                const payload = {
                  TRANSPORTATION_CONTRACT_START_DATE:
                    values.TRANSPORTATION_CONTRACT_START_DATE,
                  TRANSPORTATION_CONTRACT_END_DATE:
                    values.TRANSPORTATION_CONTRACT_END_DATE,
                  TRANSPORTATION_CONTRACT_ATTACHMENT:
                    values.CONTRACT_FILE_ID || null,
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
                  dispatch(createTransportationContract(companyId, payload));
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
                setFieldValue,
              }) => (
                <Form onSubmit={handleSubmit}>
                  <ModalBody>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            name="TRANSPORTATION_CONTRACT_START_DATE"
                            value={values.TRANSPORTATION_CONTRACT_START_DATE || ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={
                              touched.TRANSPORTATION_CONTRACT_START_DATE &&
                              !!errors.TRANSPORTATION_CONTRACT_START_DATE
                            }
                          />
                          {touched.TRANSPORTATION_CONTRACT_START_DATE &&
                          errors.TRANSPORTATION_CONTRACT_START_DATE ? (
                            <FormFeedback>
                              {errors.TRANSPORTATION_CONTRACT_START_DATE}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            name="TRANSPORTATION_CONTRACT_END_DATE"
                            value={values.TRANSPORTATION_CONTRACT_END_DATE || ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={
                              touched.TRANSPORTATION_CONTRACT_END_DATE &&
                              !!errors.TRANSPORTATION_CONTRACT_END_DATE
                            }
                          />
                          {touched.TRANSPORTATION_CONTRACT_END_DATE &&
                          errors.TRANSPORTATION_CONTRACT_END_DATE ? (
                            <FormFeedback>
                              {errors.TRANSPORTATION_CONTRACT_END_DATE}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <Label>Attachment</Label>
                      <AttachmentUploader
                        userId={currentUserId}
                        category="TRANSPORTATION_CONTRACT"
                        accept="application/pdf,image/*"
                        fileId={values.CONTRACT_FILE_ID}
                        fileName={values.CONTRACT_FILE_NAME}
                        onUploaded={(fileMeta) => {
                          setFieldValue(
                            "CONTRACT_FILE_ID",
                            fileMeta?.FILE_ID || null
                          );
                          setFieldValue(
                            "CONTRACT_FILE_NAME",
                            fileMeta?.FILE_NAME ||
                              fileMeta?.ORIGINAL_NAME ||
                              ""
                          );
                        }}
                      />

                      {values.CONTRACT_FILE_ID ? (
                        <Button
                          type="button"
                          color="link"
                          className="p-0 mt-2"
                          onClick={() => viewAttachment(values.CONTRACT_FILE_ID)}
                        >
                          View attachment
                        </Button>
                      ) : null}
                    </div>
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      color="light"
                      onClick={() => {
                        setContractModalOpen(false);
                        setEditingContract(null);
                      }}
                      disabled={isSubmitting}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button color="primary" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : editingContract ? (
                        "Update"
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </ModalFooter>
                </Form>
              )}
            </Formik>
          </Modal>

          {/* Create/Edit Fee Modal (NEW) */}
          <Modal
            isOpen={feeModalOpen}
            toggle={() => setFeeModalOpen((v) => !v)}
            centered
          >
            <ModalHeader
              toggle={() => {
                setFeeModalOpen(false);
                setEditingFee(null);
              }}
            >
              {editingFee ? "Edit Fee" : "Add Fee"}
            </ModalHeader>

            <Formik
              enableReinitialize
              initialValues={{
                TRANSPORTATION_FEE_VECHLE_TYPE:
                  editingFee?.TRANSPORTATION_FEE_VECHLE_TYPE ?? "",
                TRANSPORTATION_FEE_TYPE: editingFee?.TRANSPORTATION_FEE_TYPE ?? "",
                TRANSPORTATION_FEE_AMOUNT:
                  editingFee?.TRANSPORTATION_FEE_AMOUNT ?? "",
                ACTIVE_STATSUS:
                  editingFee?.ACTIVE_STATSUS === 0 ||
                  editingFee?.ACTIVE_STATSUS === "0"
                    ? 0
                    : 1,
              }}
              validationSchema={FeeSchema}
              onSubmit={(values, { setSubmitting }) => {
                const vehicleTypeId = Number(values.TRANSPORTATION_FEE_VECHLE_TYPE);
                const feeTypeId = Number(values.TRANSPORTATION_FEE_TYPE);

                const excludeId = editingFee?.TRANSPORTATION_FEE_ID ?? null;
                if (isDuplicateFeeCombo(vehicleTypeId, feeTypeId, excludeId)) {
                  toast.error(
                    "Duplicate fee: a rate already exists for the selected Vehicle Type and Fee Type."
                  );
                  setSubmitting(false);
                  return;
                }

                const payload = {
                  TRANSPORTATION_FEE_VECHLE_TYPE: vehicleTypeId,
                  TRANSPORTATION_FEE_TYPE: String(feeTypeId),
                  TRANSPORTATION_FEE_AMOUNT: Number(values.TRANSPORTATION_FEE_AMOUNT),
                  ACTIVE_STATSUS: Number(values.ACTIVE_STATSUS ?? 1),
                };

                if (editingFee) {
                  dispatch(
                    updateTransportationFee(
                      editingFee.TRANSPORTATION_FEE_ID,
                      payload,
                      companyId,
                      feeActiveStatus
                    )
                  );
                } else {
                  dispatch(
                    createTransportationCompanyFee(
                      companyId,
                      payload,
                      feeActiveStatus
                    )
                  );
                }

                setSubmitting(false);
                setFeeModalOpen(false);
                setEditingFee(null);
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
                setFieldValue,
              }) => (
                <Form onSubmit={handleSubmit}>
                  <ModalBody>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Vehicle Type *</Label>
                          <Input
                            type="select"
                            name="TRANSPORTATION_FEE_VECHLE_TYPE"
                            value={values.TRANSPORTATION_FEE_VECHLE_TYPE}
                            onChange={(e) =>
                              setFieldValue(
                                "TRANSPORTATION_FEE_VECHLE_TYPE",
                                e.target.value
                              )
                            }
                            onBlur={handleBlur}
                            disabled={vehicleTypesLoading}
                            invalid={
                              touched.TRANSPORTATION_FEE_VECHLE_TYPE &&
                              !!errors.TRANSPORTATION_FEE_VECHLE_TYPE
                            }
                          >
                            <option value="">Select vehicle type</option>
                            {vehicleTypes.map((t) => (
                              <option key={t.LIST_ITEM_ID} value={t.LIST_ITEM_ID}>
                                {t.ITEM_NAME}
                              </option>
                            ))}
                          </Input>
                          {touched.TRANSPORTATION_FEE_VECHLE_TYPE &&
                          errors.TRANSPORTATION_FEE_VECHLE_TYPE ? (
                            <FormFeedback>
                              {errors.TRANSPORTATION_FEE_VECHLE_TYPE}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Fee Type *</Label>
                          <Input
                            type="select"
                            name="TRANSPORTATION_FEE_TYPE"
                            value={values.TRANSPORTATION_FEE_TYPE}
                            onChange={(e) =>
                              setFieldValue(
                                "TRANSPORTATION_FEE_TYPE",
                                e.target.value
                              )
                            }
                            onBlur={handleBlur}
                            disabled={feeTypesLoading}
                            invalid={
                              touched.TRANSPORTATION_FEE_TYPE &&
                              !!errors.TRANSPORTATION_FEE_TYPE
                            }
                          >
                            <option value="">Select fee type</option>
                            {feeTypes.map((t) => {
                              const willDuplicate =
                                values.TRANSPORTATION_FEE_VECHLE_TYPE &&
                                isDuplicateFeeCombo(
                                  values.TRANSPORTATION_FEE_VECHLE_TYPE,
                                  t.LIST_ITEM_ID,
                                  editingFee?.TRANSPORTATION_FEE_ID ?? null
                                );

                              return (
                                <option
                                  key={t.LIST_ITEM_ID}
                                  value={t.LIST_ITEM_ID}
                                  disabled={willDuplicate}
                                >
                                  {t.ITEM_NAME}
                                  {willDuplicate ? " (already exists)" : ""}
                                </option>
                              );
                            })}
                          </Input>
                          {touched.TRANSPORTATION_FEE_TYPE &&
                          errors.TRANSPORTATION_FEE_TYPE ? (
                            <FormFeedback>
                              {errors.TRANSPORTATION_FEE_TYPE}
                            </FormFeedback>
                          ) : null}
                          <small className="text-muted d-block mt-1">
                            Duplicate combinations (Vehicle Type + Fee Type) are
                            not allowed.
                          </small>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Amount *</Label>
                          <Input
                            name="TRANSPORTATION_FEE_AMOUNT"
                            value={values.TRANSPORTATION_FEE_AMOUNT}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={
                              touched.TRANSPORTATION_FEE_AMOUNT &&
                              !!errors.TRANSPORTATION_FEE_AMOUNT
                            }
                          />
                          {touched.TRANSPORTATION_FEE_AMOUNT &&
                          errors.TRANSPORTATION_FEE_AMOUNT ? (
                            <FormFeedback>
                              {errors.TRANSPORTATION_FEE_AMOUNT}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Status</Label>
                          <Input
                            type="select"
                            name="ACTIVE_STATSUS"
                            value={values.ACTIVE_STATSUS}
                            onChange={(e) =>
                              setFieldValue(
                                "ACTIVE_STATSUS",
                                Number(e.target.value)
                              )
                            }
                            onBlur={handleBlur}
                          >
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                          </Input>
                        </div>
                      </Col>
                    </Row>
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      color="light"
                      onClick={() => {
                        setFeeModalOpen(false);
                        setEditingFee(null);
                      }}
                      disabled={isSubmitting}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : editingFee ? (
                        "Update"
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </ModalFooter>
                </Form>
              )}
            </Formik>
          </Modal>

          {/* Vehicle modal */}
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
                VEHICLE_PLATE_NUMBER: editingVehicle?.VEHICLE_PLATE_NUMBER || "",
                VEHICLE_MAKE: editingVehicle?.VEHICLE_MAKE || "",
                VEHICLE_MODEL: editingVehicle?.VEHICLE_MODEL || "",
                VEHICLE_PAX: editingVehicle?.VEHICLE_PAX ?? "",
                VEHICLE_TYPE_ID: editingVehicle?.VEHICLE_TYPE_ID ?? "",
                VEHICLE_HOUR_RATE: editingVehicle?.VEHICLE_HOUR_RATE ?? "",
                VEHICLE_ACTIVE_STATUS:
                  editingVehicle?.VEHICLE_ACTIVE_STATUS === 0 ||
                  editingVehicle?.VEHICLE_ACTIVE_STATUS === "0"
                    ? 0
                    : 1,
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
                    values.VEHICLE_PAX === "" ? null : Number(values.VEHICLE_PAX),
                  VEHICLE_TYPE_ID: values.VEHICLE_TYPE_ID
                    ? Number(values.VEHICLE_TYPE_ID)
                    : null,
                  VEHICLE_HOUR_RATE:
                    values.VEHICLE_HOUR_RATE === ""
                      ? null
                      : Number(values.VEHICLE_HOUR_RATE),
                  VEHICLE_ACTIVE_STATUS: Number(values.VEHICLE_ACTIVE_STATUS),
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
                setFieldValue,
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
                          {touched.VEHICLE_PLATE_NUMBER &&
                          errors.VEHICLE_PLATE_NUMBER ? (
                            <FormFeedback>
                              {errors.VEHICLE_PLATE_NUMBER}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Status</Label>
                          <Input
                            type="select"
                            name="VEHICLE_ACTIVE_STATUS"
                            value={values.VEHICLE_ACTIVE_STATUS}
                            onChange={(e) =>
                              setFieldValue(
                                "VEHICLE_ACTIVE_STATUS",
                                Number(e.target.value)
                              )
                            }
                            onBlur={handleBlur}
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
                            onBlur={handleBlur}
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
                            onBlur={handleBlur}
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>PAX</Label>
                          <Input
                            name="VEHICLE_PAX"
                            value={values.VEHICLE_PAX}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={touched.VEHICLE_PAX && !!errors.VEHICLE_PAX}
                          />
                          {touched.VEHICLE_PAX && errors.VEHICLE_PAX ? (
                            <FormFeedback>{errors.VEHICLE_PAX}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <div className="mb-3">
                        <Label>Vehicle Type</Label>
                        <Input
                          type="select"
                          name="VEHICLE_TYPE_ID"
                          value={values.VEHICLE_TYPE_ID}
                          onChange={(e) =>
                            setFieldValue("VEHICLE_TYPE_ID", e.target.value)
                          }
                          onBlur={handleBlur}
                          disabled={vehicleTypesLoading}
                        >
                          <option value="">Select vehicle type</option>
                          {vehicleTypes.map((t) => (
                            <option key={t.LIST_ITEM_ID} value={t.LIST_ITEM_ID}>
                              {t.ITEM_NAME}
                            </option>
                          ))}
                        </Input>

                        {vehicleTypesLoading ? (
                          <small className="text-muted">
                            <Spinner size="sm" className="me-1" />
                            Loading vehicle types...
                          </small>
                        ) : null}

                        {vehicleTypesError ? (
                          <small className="text-danger">{vehicleTypesError}</small>
                        ) : null}
                      </div>
                    </Row>

                    <div className="mb-3">
                      <Label>Hour Rate</Label>
                      <Input
                        name="VEHICLE_HOUR_RATE"
                        value={values.VEHICLE_HOUR_RATE}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={
                          touched.VEHICLE_HOUR_RATE && !!errors.VEHICLE_HOUR_RATE
                        }
                      />
                      {touched.VEHICLE_HOUR_RATE && errors.VEHICLE_HOUR_RATE ? (
                        <FormFeedback>{errors.VEHICLE_HOUR_RATE}</FormFeedback>
                      ) : null}
                    </div>
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      color="light"
                      onClick={() => setVehicleModalOpen(false)}
                      disabled={isSubmitting}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button color="primary" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : editingVehicle ? (
                        "Update"
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
    </RequireModule>
  );
};

const TransportationCompanyProfile = () => (
  <RequireModule moduleName="CONTRACTING">
    <TransportationCompanyProfileInner />
  </RequireModule>
);

export default TransportationCompanyProfile;
