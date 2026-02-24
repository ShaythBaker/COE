// src/pages/Contracting/HotelProfile.jsx
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
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Label,
  Input,
  FormFeedback,
} from "reactstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Formik } from "formik";
import * as Yup from "yup";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import MapLocationPicker from "../../components/Common/MapLocationPicker";
import AttachmentUploader from "../../components/Common/AttachmentUploader";

import { getHotelById } from "/src/helpers/fakebackend_helper";
import { getAttachmentUrl } from "/src/helpers/attachments_helper";

// Redux Actions
import {
  getHotelContracts,
  createHotelContract,
  updateHotelContract,
  deleteHotelContract,

  // Additional Services
  getHotelAdditionalServices,
  createHotelAdditionalService,
  updateHotelAdditionalService,
  deleteHotelAdditionalService,
} from "/src/store/hotels/actions";

const renderStars = (stars) => {
  const count = parseInt(stars, 10) || 0;
  return (
    <span>
      {Array.from({ length: count }).map((_, i) => (
        <i key={i} className="bx bxs-star text-warning" />
      ))}
    </span>
  );
};

const renderStatusBadge = (status) => {
  const isActive = status === 1 || status === "1";
  return (
    <Badge color={isActive ? "success" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
};

const toYMD = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const isActiveFlag = (v) => v === 1 || v === "1";

const calcIsActiveByDates = (start, end) => {
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(23, 59, 59, 999);
  const now = Date.now();
  if ([s, e].some(Number.isNaN)) return false;
  return s <= now && now <= e;
};

const renderActiveBadge = (active) => (
  <Badge color={active ? "success" : "secondary"}>
    {active ? "Active" : "Inactive"}
  </Badge>
);

const HotelProfileInner = () => {
  document.title = "Hotel Profile | Travco - COE";

  const { hotelId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    hotelContracts,
    loadingHotelContracts,
    hotelContractsError,

    additionalServices,
    loadingAdditionalServices,
    additionalServicesError,
  } = useSelector((state) => state.hotels);

  const [hotel, setHotel] = useState(null);
  const [loadingHotel, setLoadingHotel] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Logo URL resolved from attachments API
  const [logoUrl, setLogoUrl] = useState("");

  // Contract attachment urls cache (attachmentId -> url)
  const [contractAttachmentUrls, setContractAttachmentUrls] = useState({});

  // Create/Edit contract modal
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  // Delete confirm modal (contracts)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingContract, setDeletingContract] = useState(null);

  // Additional services modals/state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [deleteServiceModalOpen, setDeleteServiceModalOpen] = useState(false);
  const [deletingService, setDeletingService] = useState(null);

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

  // 1) Load hotel basic data (local, same as your current approach)
  useEffect(() => {
    const fetchHotel = async () => {
      setLoadingHotel(true);
      setLoadError(null);
      try {
        const res = await getHotelById(hotelId);
        setHotel(res);
      } catch (err) {
        console.error("Failed to load hotel", err);
        setLoadError("Failed to load hotel details.");
      } finally {
        setLoadingHotel(false);
      }
    };

    if (hotelId) fetchHotel();
  }, [hotelId]);

  // 2) After hotel is loaded: load logo attachment URL
  useEffect(() => {
    const loadLogo = async () => {
      try {
        if (hotel?.HOTEL_LOGO) {
          const url = await getAttachmentUrl(hotel.HOTEL_LOGO);
          setLogoUrl(url || "");
        } else {
          setLogoUrl("");
        }
      } catch (err) {
        console.error("Failed to load logo attachment URL", err);
        setLogoUrl("");
      }
    };

    if (hotel) loadLogo();
  }, [hotel]);

  // 3) Load contracts + additional services via Redux when hotel is loaded
  useEffect(() => {
    if (hotelId && hotel) {
      dispatch(getHotelContracts(hotelId));
      dispatch(getHotelAdditionalServices(hotelId));
    }
  }, [dispatch, hotelId, hotel]);

  // 4) Resolve attachment URLs for contracts (for “View” button in table)
  useEffect(() => {
    const loadContractAttachments = async () => {
      const ids = (hotelContracts || [])
        .map((c) => c.HOTEL_CONTRACT_ATTACHMENT_ID)
        .filter(Boolean);

      const toFetch = ids.filter((id) => !contractAttachmentUrls[id]);
      if (toFetch.length === 0) return;

      try {
        const entries = await Promise.all(
          toFetch.map(async (id) => {
            const url = await getAttachmentUrl(id);
            return [id, url || ""];
          })
        );

        setContractAttachmentUrls((prev) => {
          const next = { ...prev };
          entries.forEach(([id, url]) => {
            next[id] = url;
          });
          return next;
        });
      } catch (e) {
        console.error("Failed to load contract attachment urls", e);
      }
    };

    if ((hotelContracts || []).length) loadContractAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelContracts]);

  const activeContract = useMemo(() => {
    const list = hotelContracts || [];

    // Prefer IS_ACTIVE if backend sends it
    const byFlag = list.find((c) => isActiveFlag(c.IS_ACTIVE));
    if (byFlag) return byFlag;

    // Fallback to date calculation
    return list.find((c) =>
      calcIsActiveByDates(
        c.HOTEL_CONTRACT_START_DATE,
        c.HOTEL_CONTRACT_END_DATE
      )
    );
  }, [hotelContracts]);

  const openCreateContract = () => {
    setEditingContract(null);
    setContractModalOpen(true);
  };

  const openEditContract = (c) => {
    setEditingContract(c);
    setContractModalOpen(true);
  };

  const openDeleteContract = (c) => {
    setDeletingContract(c);
    setDeleteModalOpen(true);
  };

  const doDeleteContract = () => {
    if (!deletingContract?.HOTEL_CONTRACT_ID) return;
    dispatch(deleteHotelContract(hotelId, deletingContract.HOTEL_CONTRACT_ID));
    setDeleteModalOpen(false);
    setDeletingContract(null);
  };

  // Additional Services handlers
  const getAdditionalServiceId = (s) =>
    s?.ADDITIONAL_SERVICE_ID ?? s?.HOTEL_ADDITIONAL_SERVICE_ID;

  const openCreateService = () => {
    setEditingService(null);
    setServiceModalOpen(true);
  };

  const openEditService = (s) => {
    setEditingService(s);
    setServiceModalOpen(true);
  };

  const openDeleteService = (s) => {
    setDeletingService(s);
    setDeleteServiceModalOpen(true);
  };

  const doDeleteService = () => {
    const id = getAdditionalServiceId(deletingService);
    if (!id) return;
    dispatch(deleteHotelAdditionalService(hotelId, id));
    setDeleteServiceModalOpen(false);
    setDeletingService(null);
  };

  if (loadingHotel || (!hotel && !loadError)) {
    return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Contracting" breadcrumbItem="Hotel Profile" />
          <Card>
            <CardBody className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading hotel details...
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Hotel Profile" />

        <Row className="mb-3">
          <Col>
            <Button
              color="secondary"
              size="sm"
              onClick={() => navigate("/contracting/hotels")}
            >
              <i className="bx bx-arrow-back me-1" />
              Back to Hotels
            </Button>
          </Col>
        </Row>

        <Row>
          {/* Left column: logo */}
          <Col lg={4}>
            <Card className="mb-3">
              <CardBody className="text-center">
                {logoUrl ? (
                  <div className="avatar-xl mx-auto">
                    <div className="avatar-title rounded-circle bg-light">
                      <img
                        src={logoUrl}
                        alt="Hotel Logo"
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
                      <i className="bx bx-hotel font-size-24" />
                    </div>
                    <p className="text-muted mt-2 mb-0">No logo uploaded</p>
                  </div>
                )}

                <br />
                <h4 className="mb-1">{hotel?.HOTEL_NAME}</h4>

                <div className="text-muted">
                  {hotel?.HOTEL_CHAIN && (
                    <>
                      Chain: <strong>{hotel.HOTEL_CHAIN}</strong>
                    </>
                  )}
                </div>
                {renderStars(hotel?.HOTEL_STARS)}
              </CardBody>
            </Card>
          </Col>

          {/* Right column: details */}
          <Col lg={8}>
            <Card>
              <CardBody>
                {loadError && (
                  <Alert color="danger" className="mb-3">
                    {loadError}
                  </Alert>
                )}

                {hotel && (
                  <Row>
                    <Col md={6}>
                      <h6 className="mb-3">General Info</h6>
                      <dl className="row mb-0">
                        <dt className="col-sm-4">City</dt>
                        <dd className="col-sm-8">
                          {hotel.HOTEL_LOCATION || "-"}
                        </dd>

                        <dt className="col-sm-4">Address</dt>
                        <dd className="col-sm-8">
                          {hotel.HOTEL_ADDRESS || "-"}
                        </dd>

                        <dt className="col-sm-4">Phone</dt>
                        <dd className="col-sm-8">{hotel.HOTEL_PHONE || "-"}</dd>

                        <dt className="col-sm-4">Reservation Email</dt>
                        <dd className="col-sm-8">
                          {hotel.HOTEL_RESERVATION_EMAIL || "-"}
                        </dd>

                        <dt className="col-sm-4">Contact Person</dt>
                        <dd className="col-sm-8">
                          {hotel.HOTEL_CONTACT_PERSON_NAME || "-"}
                        </dd>
                      </dl>
                    </Col>

                    <Col md={6}>
                      <h6 className="mb-3">System Info</h6>
                      <dl className="row mb-0">
                        <dt className="col-sm-4">Created By</dt>
                        <dd className="col-sm-8">
                          {hotel.CREATED_BY_USER || "-"}
                        </dd>

                        <dt className="col-sm-4">Created On</dt>
                        <dd className="col-sm-8">{hotel.CREATED_ON || "-"}</dd>

                        <dt className="col-sm-4">Active Status</dt>
                        <dd className="col-sm-8">
                          {renderStatusBadge(hotel.ACTIVE_STATUS)}
                        </dd>
                      </dl>
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* CONTRACTS (BEFORE MAP) */}
        <Row className="mt-3">
          <Col lg={12}>
            <Card>
              <CardBody>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="mb-0">Contracts</h6>
                  <Button
                    color="primary"
                    size="sm"
                    onClick={openCreateContract}
                  >
                    <i className="bx bx-plus me-1" />
                    Add Contract
                  </Button>
                </div>

                {/* Highlight current active contract */}
                {activeContract && (
                  <Alert
                    color="success"
                    className="d-flex align-items-center justify-content-between"
                  >
                    <div>
                      <div className="fw-semibold">
                        <i className="bx bx-check-circle me-1" />
                        Current Active Contract
                      </div>
                      <div className="text-muted">
                        {toYMD(activeContract.HOTEL_CONTRACT_START_DATE)} →{" "}
                        {toYMD(activeContract.HOTEL_CONTRACT_END_DATE)}
                      </div>
                    </div>

                    {activeContract.HOTEL_CONTRACT_ATTACHMENT_ID ? (
                      <Button
                        color="success"
                        size="sm"
                        onClick={() => {
                          const attId =
                            activeContract.HOTEL_CONTRACT_ATTACHMENT_ID;
                          const url = contractAttachmentUrls[attId];
                          if (url) window.open(url, "_blank");
                        }}
                        disabled={
                          !contractAttachmentUrls[
                            activeContract.HOTEL_CONTRACT_ATTACHMENT_ID
                          ]
                        }
                      >
                        <i className="bx bx-file me-1" />
                        View
                      </Button>
                    ) : (
                      <Badge color="light" className="text-dark">
                        No attachment
                      </Badge>
                    )}
                  </Alert>
                )}

                {hotelContractsError && (
                  <Alert color="danger" className="mb-3">
                    {hotelContractsError}
                  </Alert>
                )}

                {loadingHotelContracts ? (
                  <div className="text-center my-3">
                    <Spinner size="sm" className="me-2" />
                    Loading contracts...
                  </div>
                ) : (hotelContracts || []).length === 0 ? (
                  <p className="text-muted mb-0">
                    No contracts found for this hotel.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <Table className="table align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: 90 }}>Status</th>
                          <th>Start</th>
                          <th>End</th>
                          <th style={{ width: 120 }}>Attachment</th>
                          <th style={{ width: 160 }} className="text-end">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(hotelContracts || []).map((c) => {
                          const start = toYMD(c.HOTEL_CONTRACT_START_DATE);
                          const end = toYMD(c.HOTEL_CONTRACT_END_DATE);

                          const active =
                            isActiveFlag(c.IS_ACTIVE) ||
                            calcIsActiveByDates(
                              c.HOTEL_CONTRACT_START_DATE,
                              c.HOTEL_CONTRACT_END_DATE
                            );

                          const attId = c.HOTEL_CONTRACT_ATTACHMENT_ID;
                          const attUrl = attId
                            ? contractAttachmentUrls[attId]
                            : "";

                          return (
                            <tr
                              key={c.HOTEL_CONTRACT_ID}
                              className={active ? "table-success" : ""}
                            >
                              <td>{renderActiveBadge(active)}</td>
                              <td>{start || "-"}</td>
                              <td>{end || "-"}</td>
                              <td>
                                {attId ? (
                                  attUrl ? (
                                    <Button
                                      color="link"
                                      className="p-0"
                                      onClick={() =>
                                        window.open(attUrl, "_blank")
                                      }
                                    >
                                      <i className="bx bx-file me-1" />
                                      View
                                    </Button>
                                  ) : (
                                    <span className="text-muted">
                                      Loading...
                                    </span>
                                  )
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                              <td className="text-end">
                                <Button
                                  color="soft-success"
                                  size="sm"
                                  className="me-2"
                                  onClick={() =>
                                    navigate(
                                      `/contracting/hotels/${hotelId}/contracts/${c.HOTEL_CONTRACT_ID}`
                                    )
                                  }
                                  title="View Contract Details"
                                >
                                  <i className="bx bx-show" />
                                </Button>

                                <Button
                                  color="soft-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => openEditContract(c)}
                                >
                                  <i className="bx bx-edit-alt" />
                                </Button>
                                <Button
                                  color="soft-danger"
                                  size="sm"
                                  onClick={() => openDeleteContract(c)}
                                >
                                  <i className="bx bx-trash" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* ADDITIONAL SERVICES */}
        <Row className="mt-3">
          <Col lg={12}>
            <Card>
              <CardBody>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h6 className="mb-0">Additional Services</h6>
                    <small className="text-muted">
                      Manage paid add-ons for this hotel (airport pickup, late
                      checkout, etc.).
                    </small>
                  </div>

                  <Button color="primary" size="sm" onClick={openCreateService}>
                    <i className="bx bx-plus me-1" />
                    Add Service
                  </Button>
                </div>

                {additionalServicesError && (
                  <Alert color="danger" className="mb-3">
                    {additionalServicesError}
                  </Alert>
                )}

                {loadingAdditionalServices ? (
                  <div className="text-center my-3">
                    <Spinner size="sm" className="me-2" />
                    Loading additional services...
                  </div>
                ) : (additionalServices || []).length === 0 ? (
                  <p className="text-muted mb-0">
                    No additional services found for this hotel.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <Table className="table align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th className="text-end" style={{ width: 140 }}>
                            Amount
                          </th>
                          <th>Description</th>
                          <th className="text-end" style={{ width: 140 }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(additionalServices || []).map((s) => {
                          const id = getAdditionalServiceId(s);
                          return (
                            <tr key={id}>
                              <td>{s.ADDITIONAL_SERVICE_NAME || "-"}</td>
                              <td className="text-end">
                                {s.ADDITIONAL_SERVICE_AMOUNT ?? "-"}
                              </td>
                              <td className="text-muted">
                                {s.ADDITIONAL_SERVICE_DESCRIPTION || "—"}
                              </td>
                              <td className="text-end">
                                <Button
                                  color="soft-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => openEditService(s)}
                                  title="Edit"
                                >
                                  <i className="bx bx-edit-alt" />
                                </Button>
                                <Button
                                  color="soft-danger"
                                  size="sm"
                                  onClick={() => openDeleteService(s)}
                                  title="Delete"
                                >
                                  <i className="bx bx-trash" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* SEASONS */}
        <Row className="mt-3">
          <Col lg={12}>
            <Card>
              <CardBody>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-0">Seasons</h6>
                    <small className="text-muted">
                      Manage hotel seasons and view seasons pricing (active
                      contract).
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={() =>
                        navigate(`/contracting/hotels/${hotelId}/seasons`)
                      }
                    >
                      <i className="bx bx-calendar me-1" />
                      Manage Seasons
                    </Button>

                    <Button
                      color="success"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/contracting/hotels/${hotelId}/seasons-with-rates`
                        )
                      }
                    >
                      <i className="bx bx-money me-1" />
                      Seasons Pricing
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

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
              HOTEL_CONTRACT_START_DATE: editingContract
                ? toYMD(editingContract.HOTEL_CONTRACT_START_DATE)
                : "",
              HOTEL_CONTRACT_END_DATE: editingContract
                ? toYMD(editingContract.HOTEL_CONTRACT_END_DATE)
                : "",
              HOTEL_CONTRACT_ATTACHMENT_ID:
                editingContract?.HOTEL_CONTRACT_ATTACHMENT_ID || null,
              HOTEL_CONTRACT_ATTACHMENT_NAME: "",
            }}
            validationSchema={Yup.object({
              HOTEL_CONTRACT_START_DATE: Yup.string().required(
                "Start date is required"
              ),
              HOTEL_CONTRACT_END_DATE: Yup.string()
                .required("End date is required")
                .test(
                  "endAfterStart",
                  "End date must be on/after start date",
                  function (val) {
                    const start = this.parent.HOTEL_CONTRACT_START_DATE;
                    if (!start || !val) return true;
                    return new Date(val).getTime() >= new Date(start).getTime();
                  }
                ),
            })}
            onSubmit={(values, { setSubmitting }) => {
              const payload = {
                HOTEL_CONTRACT_START_DATE: values.HOTEL_CONTRACT_START_DATE,
                HOTEL_CONTRACT_END_DATE: values.HOTEL_CONTRACT_END_DATE,
                HOTEL_CONTRACT_ATTACHMENT_ID:
                  values.HOTEL_CONTRACT_ATTACHMENT_ID || null,
              };

              if (editingContract) {
                dispatch(
                  updateHotelContract(
                    hotelId,
                    editingContract.HOTEL_CONTRACT_ID,
                    payload
                  )
                );
              } else {
                dispatch(createHotelContract(hotelId, payload));
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
              setFieldValue,
              isSubmitting,
            }) => (
              <Form onSubmit={handleSubmit}>
                <ModalBody>
                  <div className="mb-3">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      name="HOTEL_CONTRACT_START_DATE"
                      value={values.HOTEL_CONTRACT_START_DATE}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.HOTEL_CONTRACT_START_DATE &&
                        !!errors.HOTEL_CONTRACT_START_DATE
                      }
                    />
                    <FormFeedback>
                      {errors.HOTEL_CONTRACT_START_DATE}
                    </FormFeedback>
                  </div>

                  <div className="mb-3">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      name="HOTEL_CONTRACT_END_DATE"
                      value={values.HOTEL_CONTRACT_END_DATE}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.HOTEL_CONTRACT_END_DATE &&
                        !!errors.HOTEL_CONTRACT_END_DATE
                      }
                    />
                    <FormFeedback>
                      {errors.HOTEL_CONTRACT_END_DATE}
                    </FormFeedback>
                  </div>

                  <div className="mb-0">
                    <Label>Contract File (PDF)</Label>
                    <AttachmentUploader
                      userId={currentUserId}
                      category="HOTEL_CONTRACT"
                      fileId={values.HOTEL_CONTRACT_ATTACHMENT_ID}
                      fileName={values.HOTEL_CONTRACT_ATTACHMENT_NAME}
                      accept="application/pdf"
                      onUploaded={(fileMeta) => {
                        setFieldValue(
                          "HOTEL_CONTRACT_ATTACHMENT_ID",
                          fileMeta.FILE_ID
                        );
                        setFieldValue(
                          "HOTEL_CONTRACT_ATTACHMENT_NAME",
                          fileMeta.FILE_NAME || fileMeta.ORIGINAL_NAME || ""
                        );
                      }}
                    />
                    <small className="text-muted d-block mt-1">
                      Uploading uses the same shared S3 flow as Hotel Create.
                    </small>
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    type="button"
                    color="secondary"
                    onClick={() => setContractModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" color="primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="me-2" /> Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </Modal>

        {/* Create/Edit Additional Service Modal */}
        <Modal
          isOpen={serviceModalOpen}
          toggle={() => setServiceModalOpen((v) => !v)}
          centered
        >
          <ModalHeader toggle={() => setServiceModalOpen(false)}>
            {editingService
              ? "Edit Additional Service"
              : "Add Additional Service"}
          </ModalHeader>

          <Formik
            enableReinitialize
            initialValues={{
              ADDITIONAL_SERVICE_NAME:
                editingService?.ADDITIONAL_SERVICE_NAME || "",
              ADDITIONAL_SERVICE_AMOUNT:
                editingService?.ADDITIONAL_SERVICE_AMOUNT === 0 ||
                editingService?.ADDITIONAL_SERVICE_AMOUNT
                  ? String(editingService.ADDITIONAL_SERVICE_AMOUNT)
                  : "",
              ADDITIONAL_SERVICE_DESCRIPTION:
                editingService?.ADDITIONAL_SERVICE_DESCRIPTION ?? "",
            }}
            validationSchema={Yup.object({
              ADDITIONAL_SERVICE_NAME:
                Yup.string().required("Name is required"),
              ADDITIONAL_SERVICE_AMOUNT: Yup.number()
                .typeError("Amount must be a number")
                .required("Amount is required")
                .min(0, "Amount must be >= 0"),
              ADDITIONAL_SERVICE_DESCRIPTION: Yup.string().nullable(),
            })}
            onSubmit={(values, { setSubmitting }) => {
              const payload = {
                ADDITIONAL_SERVICE_NAME: values.ADDITIONAL_SERVICE_NAME,
                ADDITIONAL_SERVICE_AMOUNT: Number(
                  values.ADDITIONAL_SERVICE_AMOUNT
                ),
                ADDITIONAL_SERVICE_DESCRIPTION:
                  values.ADDITIONAL_SERVICE_DESCRIPTION?.trim() === ""
                    ? null
                    : values.ADDITIONAL_SERVICE_DESCRIPTION,
              };

              const id = getAdditionalServiceId(editingService);

              if (editingService && id) {
                dispatch(updateHotelAdditionalService(hotelId, id, payload));
              } else {
                dispatch(createHotelAdditionalService(hotelId, payload));
              }

              setSubmitting(false);
              setServiceModalOpen(false);
              setEditingService(null);
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
                    <Label>Name</Label>
                    <Input
                      name="ADDITIONAL_SERVICE_NAME"
                      value={values.ADDITIONAL_SERVICE_NAME}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.ADDITIONAL_SERVICE_NAME &&
                        !!errors.ADDITIONAL_SERVICE_NAME
                      }
                    />
                    <FormFeedback>
                      {errors.ADDITIONAL_SERVICE_NAME}
                    </FormFeedback>
                  </div>

                  <div className="mb-3">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      name="ADDITIONAL_SERVICE_AMOUNT"
                      value={values.ADDITIONAL_SERVICE_AMOUNT}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.ADDITIONAL_SERVICE_AMOUNT &&
                        !!errors.ADDITIONAL_SERVICE_AMOUNT
                      }
                    />
                    <FormFeedback>
                      {errors.ADDITIONAL_SERVICE_AMOUNT}
                    </FormFeedback>
                  </div>

                  <div className="mb-0">
                    <Label>Description (optional)</Label>
                    <Input
                      type="textarea"
                      rows="3"
                      name="ADDITIONAL_SERVICE_DESCRIPTION"
                      value={values.ADDITIONAL_SERVICE_DESCRIPTION}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <small className="text-muted d-block mt-1">
                      Leave empty to clear description (sends <code>null</code>
                      ).
                    </small>
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    type="button"
                    color="secondary"
                    onClick={() => setServiceModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" color="primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="me-2" /> Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </Modal>

        {/* Delete Confirm Modal (Contracts) */}
        <Modal
          isOpen={deleteModalOpen}
          toggle={() => setDeleteModalOpen(false)}
          centered
        >
          <ModalHeader toggle={() => setDeleteModalOpen(false)}>
            Delete Contract
          </ModalHeader>
          <ModalBody>
            Are you sure you want to delete this contract?
            <div className="mt-2 text-muted">
              {deletingContract
                ? `${toYMD(
                    deletingContract.HOTEL_CONTRACT_START_DATE
                  )} → ${toYMD(deletingContract.HOTEL_CONTRACT_END_DATE)}`
                : ""}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="danger" onClick={doDeleteContract}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>

        {/* Delete Confirm Modal (Additional Services) */}
        <Modal
          isOpen={deleteServiceModalOpen}
          toggle={() => setDeleteServiceModalOpen(false)}
          centered
        >
          <ModalHeader toggle={() => setDeleteServiceModalOpen(false)}>
            Delete Additional Service
          </ModalHeader>
          <ModalBody>
            Are you sure you want to delete this additional service?
            <div className="mt-2 text-muted">
              {deletingService?.ADDITIONAL_SERVICE_NAME || ""}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="secondary"
              onClick={() => setDeleteServiceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button color="danger" onClick={doDeleteService}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>

        {/* Map / location */}
        <Row className="mt-3">
          <Col lg={12}>
            <Card>
              <CardBody>
                <h6 className="mb-3">Location</h6>
                {hotel?.HOTEL_LAT && hotel?.HOTEL_LAN ? (
                  <>
                    <div className="mb-2 text-muted">
                      {hotel.HOTEL_LAT}, {hotel.HOTEL_LAN}
                    </div>
                    <MapLocationPicker
                      latitude={Number(hotel.HOTEL_LAT)}
                      longitude={Number(hotel.HOTEL_LAN)}
                    />
                  </>
                ) : (
                  <p className="text-muted mb-0">
                    No coordinates available for this hotel.
                  </p>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const HotelProfile = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <HotelProfileInner />
  </RequireModule>
);

export default HotelProfile;
