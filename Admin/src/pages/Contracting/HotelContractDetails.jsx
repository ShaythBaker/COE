import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Table,
  Spinner,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Label,
  Input,
  FormFeedback,
  Badge,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import { getSystemListItems } from "/src/helpers/fakebackend_helper";

import {
  getHotelContracts,
  getHotelContractRates,
  createHotelContractRate,
  updateHotelContractRate,
  deleteHotelContractRate,
} from "/src/store/hotels/actions";

const toYMD = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const renderActiveBadge = (active) => (
  <Badge color={active ? "success" : "secondary"}>
    {active ? "Active" : "Inactive"}
  </Badge>
);

const calcIsActiveByDates = (start, end) => {
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(23, 59, 59, 999);
  const now = Date.now();
  if ([s, e].some(Number.isNaN)) return false;
  return s <= now && now <= e;
};

const HotelContractDetailsInner = () => {
  document.title = "Contract Details | Travco - COE";

  const { hotelId, contractId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    hotelContracts,
    loadingHotelContracts,
    hotelContractsError,

    hotelContractRates,
    loadingHotelContractRates,
    hotelContractRatesError,
  } = useSelector((state) => state.hotels);

  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);

  const [deleteRateModalOpen, setDeleteRateModalOpen] = useState(false);
  const [deletingRate, setDeletingRate] = useState(null);

  const [reservationTypes, setReservationTypes] = useState([]);
  const [reservationTypesLoading, setReservationTypesLoading] = useState(false);
  const [reservationTypesError, setReservationTypesError] = useState(null);

  useEffect(() => {
    const fetchReservationTypes = async () => {
      setReservationTypesLoading(true);
      setReservationTypesError(null);
      try {
        const res = await getSystemListItems("RESERVATION_TYPE"); // calls lists/by-key/RESERVATION_TYPE
        setReservationTypes(res?.ITEMS || []);
      } catch (err) {
        console.error("Failed to load reservation types", err);
        setReservationTypesError("Failed to load reservation types");
      } finally {
        setReservationTypesLoading(false);
      }
    };

    fetchReservationTypes();
  }, []);
  // Ensure contracts exist (so we can display contract header info)
  useEffect(() => {
    if (hotelId && (!hotelContracts || hotelContracts.length === 0)) {
      dispatch(getHotelContracts(hotelId));
    }
  }, [dispatch, hotelId]); // intentionally not depending on hotelContracts

  // Load rates
  useEffect(() => {
    if (hotelId && contractId) {
      dispatch(getHotelContractRates(hotelId, contractId));
    }
  }, [dispatch, hotelId, contractId]);

  const contract = useMemo(() => {
    const idNum = Number(contractId);
    return (
      (hotelContracts || []).find(
        (c) => Number(c.HOTEL_CONTRACT_ID) === idNum
      ) || null
    );
  }, [hotelContracts, contractId]);

  const contractIsActive = useMemo(() => {
    if (!contract) return false;
    const byFlag = contract.IS_ACTIVE === 1 || contract.IS_ACTIVE === "1";
    if (byFlag) return true;
    return calcIsActiveByDates(
      contract.HOTEL_CONTRACT_START_DATE,
      contract.HOTEL_CONTRACT_END_DATE
    );
  }, [contract]);

  const openCreateRate = () => {
    setEditingRate(null);
    setRateModalOpen(true);
  };

  const openEditRate = (r) => {
    setEditingRate(r);
    setRateModalOpen(true);
  };

  const openDeleteRate = (r) => {
    setDeletingRate(r);
    setDeleteRateModalOpen(true);
  };

  const doDeleteRate = () => {
    if (!deletingRate?.RATE_ID) return;
    dispatch(
      deleteHotelContractRate(hotelId, contractId, deletingRate.RATE_ID)
    );
    setDeleteRateModalOpen(false);
    setDeletingRate(null);
  };
  const isCreateMode = !editingRate;

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Contract Details" />

        <Row className="mb-3">
          <Col className="d-flex gap-2">
            <Button
              color="secondary"
              size="sm"
              onClick={() => navigate(`/contracting/hotels/${hotelId}`)}
            >
              <i className="bx bx-arrow-back me-1" />
              Back to Hotel Profile
            </Button>
          </Col>
        </Row>

        {/* Contract header */}
        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                {hotelContractsError && (
                  <Alert color="danger" className="mb-3">
                    {hotelContractsError}
                  </Alert>
                )}

                {loadingHotelContracts &&
                !contract &&
                (hotelContracts || []).length === 0 ? (
                  <div className="text-center my-3">
                    <Spinner size="sm" className="me-2" />
                    Loading contract...
                  </div>
                ) : !contract ? (
                  <Alert color="warning" className="mb-0">
                    Contract not found in current list. If this persists, reload
                    the hotel profile then open details again.
                  </Alert>
                ) : (
                  <Row className="align-items-center">
                    <Col md={8}>
                      <h5 className="mb-1">
                        Contract #{contract.HOTEL_CONTRACT_ID}{" "}
                        {renderActiveBadge(contractIsActive)}
                      </h5>
                      <div className="text-muted">
                        {toYMD(contract.HOTEL_CONTRACT_START_DATE)} →{" "}
                        {toYMD(contract.HOTEL_CONTRACT_END_DATE)}
                      </div>
                    </Col>
                    <Col md={4} className="text-md-end mt-2 mt-md-0">
                      <Button
                        color="primary"
                        size="sm"
                        onClick={openCreateRate}
                      >
                        <i className="bx bx-plus me-1" />
                        Add Rate
                      </Button>
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Rates list */}
        <Row className="mt-3">
          <Col lg={12}>
            <Card>
              <CardBody>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="mb-0">Rates</h6>
                  <Button
                    color="soft-primary"
                    size="sm"
                    onClick={() =>
                      dispatch(getHotelContractRates(hotelId, contractId))
                    }
                  >
                    <i className="bx bx-refresh me-1" />
                    Refresh
                  </Button>
                </div>

                {hotelContractRatesError && (
                  <Alert color="danger" className="mb-3">
                    {hotelContractRatesError}
                  </Alert>
                )}

                {loadingHotelContractRates ? (
                  <div className="text-center my-3">
                    <Spinner size="sm" className="me-2" />
                    Loading rates...
                  </div>
                ) : (hotelContractRates || []).length === 0 ? (
                  <p className="text-muted mb-0">
                    No rates found for this contract.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <Table className="table align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Rate For</th>
                          <th style={{ width: 140 }}>Start</th>
                          <th style={{ width: 140 }}>End</th>
                          <th style={{ width: 130 }}>Amount</th>
                          <th style={{ width: 160 }} className="text-end">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(hotelContractRates || []).map((r) => (
                          <tr key={r.RATE_ID}>
                            <td>{r.RATE_FOR_NAME || "-"}</td>
                            <td>{toYMD(r.RATE_START_DATE) || "-"}</td>
                            <td>{toYMD(r.RATE_END_DATE) || "-"}</td>
                            <td>{r.RATE_AMOUNT ?? "-"}</td>
                            <td className="text-end">
                              <Button
                                color="soft-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => openEditRate(r)}
                              >
                                <i className="bx bx-edit-alt" />
                              </Button>
                              <Button
                                color="soft-danger"
                                size="sm"
                                onClick={() => openDeleteRate(r)}
                              >
                                <i className="bx bx-trash" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Create/Edit Rate Modal */}
        <Modal
          isOpen={rateModalOpen}
          toggle={() => setRateModalOpen((v) => !v)}
          centered
        >
          <ModalHeader toggle={() => setRateModalOpen(false)}>
            {editingRate ? "Edit Rate" : "Add Rate"}
          </ModalHeader>

          <Formik
            enableReinitialize
            initialValues={{
              RATE_FOR_ID:
                editingRate?.RATE_FOR_ID === null ||
                editingRate?.RATE_FOR_ID === undefined
                  ? ""
                  : String(editingRate.RATE_FOR_ID),
              RATE_START_DATE: editingRate
                ? toYMD(editingRate.RATE_START_DATE)
                : "",
              RATE_END_DATE: editingRate
                ? toYMD(editingRate.RATE_END_DATE)
                : "",
              RATE_AMOUNT:
                editingRate?.RATE_AMOUNT === null ||
                editingRate?.RATE_AMOUNT === undefined
                  ? ""
                  : String(editingRate.RATE_AMOUNT),
            }}
            validationSchema={Yup.object({
              RATE_FOR_ID: Yup.string().when([], {
                is: () => isCreateMode,
                then: (s) => s.required("Reservation type is required"),
                otherwise: (s) => s.nullable(),
              }),

              RATE_START_DATE: Yup.string().when([], {
                is: () => isCreateMode,
                then: (s) => s.required("Start date is required"),
                otherwise: (s) => s.nullable(),
              }),

              RATE_END_DATE: Yup.string()
                .when([], {
                  is: () => isCreateMode,
                  then: (s) => s.required("End date is required"),
                  otherwise: (s) => s.nullable(),
                })
                .test(
                  "endAfterStart",
                  "End date must be on/after start date",
                  function (val) {
                    const start = this.parent.RATE_START_DATE;
                    if (!start || !val) return true;
                    return new Date(val).getTime() >= new Date(start).getTime();
                  }
                ),

              RATE_AMOUNT: Yup.number()
                .typeError("Rate amount must be a number")
                .when([], {
                  is: () => isCreateMode,
                  then: (s) => s.required("Rate amount is required"),
                  otherwise: (s) => s.nullable(),
                }),
            })}
            onSubmit={(values, { setSubmitting }) => {
              const payload = isCreateMode
                ? {
                    // create => all required
                    RATE_FOR_ID: Number(values.RATE_FOR_ID),
                    RATE_START_DATE: values.RATE_START_DATE,
                    RATE_END_DATE: values.RATE_END_DATE,
                    RATE_AMOUNT: Number(values.RATE_AMOUNT),
                  }
                : {
                    // edit => allow partial updates (your previous logic)
                    RATE_AMOUNT:
                      values.RATE_AMOUNT === "" ? null : values.RATE_AMOUNT,
                    RATE_FOR_ID:
                      values.RATE_FOR_ID === ""
                        ? null
                        : Number(values.RATE_FOR_ID),
                    RATE_START_DATE: values.RATE_START_DATE || null,
                    RATE_END_DATE: values.RATE_END_DATE || null,
                  };

              if (editingRate) {
                dispatch(
                  updateHotelContractRate(
                    hotelId,
                    contractId,
                    editingRate.RATE_ID,
                    payload
                  )
                );
              } else {
                dispatch(createHotelContractRate(hotelId, contractId, payload));
              }

              setSubmitting(false);
              setRateModalOpen(false);
              setEditingRate(null);
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
                    <Label>Rate For (Reservation Type)</Label>
                    <Input
                      type="select"
                      name="RATE_FOR_ID"
                      value={values.RATE_FOR_ID}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={reservationTypesLoading}
                      invalid={touched.RATE_FOR_ID && !!errors.RATE_FOR_ID}
                    >
                      <option value="">Select</option>

                      {reservationTypes.map((it) => (
                        <option
                          key={it.LIST_ITEM_ID}
                          value={String(it.LIST_ITEM_ID)}
                        >
                          {it.ITEM_NAME}
                        </option>
                      ))}
                    </Input>

                    <FormFeedback>{errors.RATE_FOR_ID}</FormFeedback>

                    {reservationTypesError && (
                      <small className="text-danger">
                        {reservationTypesError}
                      </small>
                    )}

                    <FormFeedback>{errors.RATE_FOR_ID}</FormFeedback>
                    <small className="text-muted">
                      If you cannot see the reservation type Ask your Account
                      Manager to add it
                    </small>
                  </div>

                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          name="RATE_START_DATE"
                          value={values.RATE_START_DATE}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={
                            touched.RATE_START_DATE && !!errors.RATE_START_DATE
                          }
                        />
                        <FormFeedback>{errors.RATE_START_DATE}</FormFeedback>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          name="RATE_END_DATE"
                          value={values.RATE_END_DATE}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={
                            touched.RATE_END_DATE && !!errors.RATE_END_DATE
                          }
                        />
                        <FormFeedback>{errors.RATE_END_DATE}</FormFeedback>
                      </div>
                    </Col>
                  </Row>

                  <div className="mb-0">
                    <Label>Rate Amount</Label>
                    <Input
                      type="text"
                      name="RATE_AMOUNT"
                      value={values.RATE_AMOUNT}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={touched.RATE_AMOUNT && !!errors.RATE_AMOUNT}
                      placeholder="e.g. 120.50"
                    />
                    <FormFeedback>{errors.RATE_AMOUNT}</FormFeedback>
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    type="button"
                    color="secondary"
                    onClick={() => setRateModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" color="primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Saving...
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

        {/* Delete Rate Modal */}
        <Modal
          isOpen={deleteRateModalOpen}
          toggle={() => setDeleteRateModalOpen(false)}
          centered
        >
          <ModalHeader toggle={() => setDeleteRateModalOpen(false)}>
            Delete Rate
          </ModalHeader>
          <ModalBody>
            Are you sure you want to delete this rate?
            <div className="mt-2 text-muted">
              {deletingRate
                ? `${deletingRate.RATE_FOR_NAME || "—"} | ${
                    toYMD(deletingRate.RATE_START_DATE) || "—"
                  } → ${toYMD(deletingRate.RATE_END_DATE) || "—"} | Amount: ${
                    deletingRate.RATE_AMOUNT ?? "—"
                  }`
                : ""}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="secondary"
              onClick={() => setDeleteRateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button color="danger" onClick={doDeleteRate}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      </Container>
    </div>
  );
};

const HotelContractDetails = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <HotelContractDetailsInner />
  </RequireModule>
);

export default HotelContractDetails;
