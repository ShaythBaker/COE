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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  Label,
  Input,
  FormFeedback,
  Badge,
  Alert,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import { getSystemListItems } from "/src/helpers/fakebackend_helper";

import {
  getHotelSeasons,
  createHotelSeason,
  updateHotelSeason,
  deleteHotelSeason,
  getHotelSeasonsWithRates,
  createHotelSeasonRate,
  updateHotelSeasonRate,
  deleteHotelSeasonRate,
  clearHotelSeasonMessages,
} from "../../store/hotels/actions";

const toYMD = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

// End date inclusive: expires after end-of-day
const isSeasonExpired = (seasonEndDate) => {
  if (!seasonEndDate) return false;
  const end = new Date(seasonEndDate);
  if (Number.isNaN(end.getTime())) return false;
  end.setHours(23, 59, 59, 999);
  return Date.now() > end.getTime();
};

const HotelSeasonsInner = () => {
  document.title = "Hotel Seasons | COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotelId } = useParams();

  const {
    seasons,
    loadingSeasons,
    seasonsError,
    seasonsWithRates,
    loadingSeasonsWithRates,
    seasonsWithRatesError,
  } = useSelector((state) => state.hotels);

  // ✅ Season names list (bind like old version)
  const [seasonNameOptions, setSeasonNameOptions] = useState([]);
  const [seasonNameLoading, setSeasonNameLoading] = useState(false);
  const [seasonNameError, setSeasonNameError] = useState(null);

  // Season CRUD modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Delete season modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Rates management
  const [ratesModalOpen, setRatesModalOpen] = useState(false);
  const [ratesSeason, setRatesSeason] = useState(null); // selected season object (from seasons list)
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [deleteRateModalOpen, setDeleteRateModalOpen] = useState(false);
  const [deletingRate, setDeletingRate] = useState(null);

  // Reservation types (RATE_FOR_ID list)
  const [reservationTypes, setReservationTypes] = useState([]);
  const [reservationTypesLoading, setReservationTypesLoading] = useState(false);
  const [reservationTypesError, setReservationTypesError] = useState(null);

  useEffect(() => {
    dispatch(getHotelSeasons(hotelId));
    dispatch(getHotelSeasonsWithRates(hotelId));
  }, [dispatch, hotelId]);

  useEffect(() => {
    if (seasonsError) toast.error(seasonsError);
  }, [seasonsError]);

  useEffect(() => {
    if (seasonsWithRatesError) toast.error(seasonsWithRatesError);
  }, [seasonsWithRatesError]);

  // ✅ Fetch season names list like old version: getSystemListItems("HOTEL_SEASONS")
  useEffect(() => {
    const fetchSeasonNames = async () => {
      setSeasonNameLoading(true);
      setSeasonNameError(null);
      try {
        const res = await getSystemListItems("HOTEL_SEASONS");
        setSeasonNameOptions(res?.ITEMS || []);
      } catch (err) {
        console.error("Failed to load HOTEL_SEASONS list", err);
        setSeasonNameOptions([]);
        setSeasonNameError("Failed to load season names list.");
      } finally {
        setSeasonNameLoading(false);
      }
    };
    fetchSeasonNames();
  }, []);

  useEffect(() => {
    const fetchReservationTypes = async () => {
      setReservationTypesLoading(true);
      setReservationTypesError(null);
      try {
        const res = await getSystemListItems("RESERVATION_TYPE");
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

  useEffect(() => {
    return () => dispatch(clearHotelSeasonMessages());
  }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setModalOpen(true);
  };

  const openDelete = (s) => {
    setDeleting(s);
    setDeleteModalOpen(true);
  };

  const openManageRates = (s) => {
    setRatesSeason(s);
    setRatesModalOpen(true);
    dispatch(getHotelSeasonsWithRates(hotelId));
  };

  const closeRatesModal = () => {
    setRatesModalOpen(false);
    setRatesSeason(null);
    setEditingRate(null);
    setRateModalOpen(false);
    setDeletingRate(null);
    setDeleteRateModalOpen(false);
  };

  const selectedSeasonWithRates = useMemo(() => {
    const seasonId = ratesSeason?.SEASON_ID;
    if (!seasonId) return null;
    const list = seasonsWithRates?.SEASONS || [];
    return list.find((x) => String(x.SEASON_ID) === String(seasonId)) || null;
  }, [ratesSeason, seasonsWithRates]);

  const selectedRates = selectedSeasonWithRates?.RATES || [];
  const expired = isSeasonExpired(ratesSeason?.SEASON_END_DATE);

  const renderSeasonDates = (val) => {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toISOString().slice(0, 10);
  };

  const rateForLabel = (rateForId) => {
    const found = reservationTypes.find(
      (x) => String(x.LIST_ITEM_ID) === String(rateForId)
    );
    return found?.ITEM_NAME || "-";
  };

  return (
    <RequireModule moduleName="HOTELS">
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Hotels" breadcrumbItem="Seasons" />

          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-2">
                <Button color="light" onClick={() => navigate(-1)}>
                  <i className="bx bx-arrow-back me-1" />
                  Back
                </Button>

                <Button
                  color="success"
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

              <Button color="primary" onClick={openCreate}>
                <i className="bx bx-plus me-1" />
                Add Season
              </Button>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <CardBody>
                  {loadingSeasons ? (
                    <div className="text-center my-4">
                      <Spinner size="sm" className="me-2" />
                      Loading seasons...
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table align-middle table-nowrap">
                        <thead className="table-light">
                          <tr>
                            <th>Season</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(seasons || []).map((s) => {
                            const sExpired = isSeasonExpired(s.SEASON_END_DATE);
                            return (
                              <tr key={s.SEASON_ID}>
                                <td>{s.SEASON_NAME || "-"}</td>
                                <td>
                                  {renderSeasonDates(s.SEASON_START_DATE)}
                                </td>
                                <td>{renderSeasonDates(s.SEASON_END_DATE)}</td>
                                <td>
                                  {sExpired ? (
                                    <Badge color="danger">Expired</Badge>
                                  ) : (
                                    <Badge color="success">Active</Badge>
                                  )}
                                </td>
                                <td className="text-end">
                                  <div className="d-flex justify-content-end gap-2">
                                    <Button
                                      color="info"
                                      size="sm"
                                      onClick={() => openManageRates(s)}
                                    >
                                      <i className="bx bx-money me-1" />
                                      Manage Rates
                                    </Button>

                                    <Button
                                      color="warning"
                                      size="sm"
                                      onClick={() => openEdit(s)}
                                    >
                                      <i className="bx bx-edit-alt me-1" />
                                      Edit
                                    </Button>

                                    <Button
                                      color="danger"
                                      size="sm"
                                      onClick={() => openDelete(s)}
                                    >
                                      <i className="bx bx-trash me-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {(!seasons || seasons.length === 0) &&
                            !loadingSeasons && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="text-center text-muted py-4"
                                >
                                  No seasons found.
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

          {/* Create / Edit Season Modal */}
          <Modal
            isOpen={modalOpen}
            toggle={() => setModalOpen((v) => !v)}
            centered
          >
            <ModalHeader toggle={() => setModalOpen(false)}>
              {editing ? "Edit Season" : "Add Season"}
            </ModalHeader>

            <Formik
              enableReinitialize
              initialValues={{
                SEASON_NAME_ID: editing
                  ? String(editing.SEASON_NAME_ID || "")
                  : "",
                SEASON_START_DATE: editing
                  ? toYMD(editing.SEASON_START_DATE)
                  : "",
                SEASON_END_DATE: editing ? toYMD(editing.SEASON_END_DATE) : "",
              }}
              validationSchema={Yup.object({
                SEASON_NAME_ID: Yup.string().required("Season is required"),
                SEASON_START_DATE: Yup.string().required(
                  "Start date is required"
                ),
                SEASON_END_DATE: Yup.string()
                  .required("End date is required")
                  .test(
                    "endAfterStart",
                    "End date must be after start date",
                    function (value) {
                      const { SEASON_START_DATE } = this.parent;
                      if (!SEASON_START_DATE || !value) return true;
                      return new Date(value) >= new Date(SEASON_START_DATE);
                    }
                  ),
              })}
              onSubmit={(values, { setSubmitting }) => {
                try {
                  const payload = {
                    // ✅ send numeric ID like old version
                    SEASON_NAME_ID: Number(values.SEASON_NAME_ID),
                    SEASON_START_DATE: values.SEASON_START_DATE,
                    SEASON_END_DATE: values.SEASON_END_DATE,
                  };

                  if (editing) {
                    dispatch(
                      updateHotelSeason(hotelId, editing.SEASON_ID, payload)
                    );
                  } else {
                    dispatch(createHotelSeason(hotelId, payload));
                  }

                  setModalOpen(false);
                } finally {
                  setSubmitting(false);
                }
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
                    <Alert color="info" className="py-2">
                      <small className="mb-0 d-block">
                        Season name is selected by{" "}
                        <strong>SEASON_NAME_ID</strong>.
                      </small>
                    </Alert>

                    {/* ✅ FIXED: dropdown bound to HOTEL_SEASONS list */}
                    <div className="mb-3">
                      <Label>Season</Label>
                      <Input
                        type="select"
                        name="SEASON_NAME_ID"
                        value={values.SEASON_NAME_ID}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={
                          touched.SEASON_NAME_ID && !!errors.SEASON_NAME_ID
                        }
                        disabled={seasonNameLoading}
                      >
                        <option value="">Select season</option>
                        {(seasonNameOptions || []).map((it) => (
                          <option key={it.LIST_ITEM_ID} value={it.LIST_ITEM_ID}>
                            {it.ITEM_NAME}
                          </option>
                        ))}
                      </Input>

                      {touched.SEASON_NAME_ID && errors.SEASON_NAME_ID ? (
                        <FormFeedback>{errors.SEASON_NAME_ID}</FormFeedback>
                      ) : null}

                      {seasonNameError && (
                        <div className="text-danger mt-1">
                          <small>{seasonNameError}</small>
                        </div>
                      )}
                    </div>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            name="SEASON_START_DATE"
                            value={values.SEASON_START_DATE}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={
                              touched.SEASON_START_DATE &&
                              !!errors.SEASON_START_DATE
                            }
                          />
                          {touched.SEASON_START_DATE &&
                          errors.SEASON_START_DATE ? (
                            <FormFeedback>
                              {errors.SEASON_START_DATE}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-3">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            name="SEASON_END_DATE"
                            value={values.SEASON_END_DATE}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={
                              touched.SEASON_END_DATE &&
                              !!errors.SEASON_END_DATE
                            }
                          />
                          {touched.SEASON_END_DATE && errors.SEASON_END_DATE ? (
                            <FormFeedback>
                              {errors.SEASON_END_DATE}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      color="secondary"
                      onClick={() => setModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {editing ? "Save" : "Create"}
                    </Button>
                  </ModalFooter>
                </Form>
              )}
            </Formik>
          </Modal>

          {/* Delete Season Modal */}
          <Modal
            isOpen={deleteModalOpen}
            toggle={() => setDeleteModalOpen((v) => !v)}
            centered
          >
            <ModalHeader toggle={() => setDeleteModalOpen(false)}>
              Delete Season
            </ModalHeader>
            <ModalBody>
              Are you sure you want to delete this season{" "}
              <strong>{deleting?.SEASON_NAME || ""}</strong>?
            </ModalBody>
            <ModalFooter>
              <Button
                color="secondary"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                onClick={() => {
                  if (!deleting) return;
                  dispatch(deleteHotelSeason(hotelId, deleting.SEASON_ID));
                  setDeleteModalOpen(false);
                }}
              >
                Delete
              </Button>
            </ModalFooter>
          </Modal>

          {/* Manage Rates Modal */}
          <Modal
            isOpen={ratesModalOpen}
            toggle={closeRatesModal}
            size="lg"
            centered
          >
            <ModalHeader toggle={closeRatesModal}>
              Manage Rates{" "}
              {ratesSeason?.SEASON_NAME ? `— ${ratesSeason.SEASON_NAME}` : ""}
            </ModalHeader>

            <ModalBody>
              {expired && (
                <div className="alert alert-warning">
                  This season is <strong>expired</strong>. Rates are not
                  available after the season end date and cannot be modified.
                </div>
              )}

              {(loadingSeasonsWithRates || reservationTypesLoading) && (
                <div className="text-center my-3">
                  <Spinner size="sm" className="me-2" />
                  Loading rates...
                </div>
              )}

              {reservationTypesError && (
                <div className="alert alert-danger">
                  {reservationTypesError}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="text-muted">
                  {selectedSeasonWithRates ? (
                    <>
                      Season dates:{" "}
                      <strong>
                        {toYMD(selectedSeasonWithRates.SEASON_START_DATE)}
                      </strong>{" "}
                      —{" "}
                      <strong>
                        {toYMD(selectedSeasonWithRates.SEASON_END_DATE)}
                      </strong>
                    </>
                  ) : (
                    "Season not loaded."
                  )}
                </div>

                <Button
                  color="primary"
                  size="sm"
                  disabled={expired || !selectedSeasonWithRates}
                  onClick={() => {
                    setEditingRate(null);
                    setRateModalOpen(true);
                  }}
                >
                  <i className="bx bx-plus me-1" />
                  Add Rate
                </Button>
              </div>

              <div className="table-responsive">
                <Table className="table align-middle table-nowrap">
                  <thead className="table-light">
                    <tr>
                      <th>Rate For</th>
                      <th>Start</th>
                      <th>End</th>
                      <th className="text-end">Amount</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRates.map((r) => (
                      <tr key={r.RATE_ID}>
                        <td>{r.ITEM_NAME || rateForLabel(r.RATE_FOR_ID)}</td>
                        <td>{toYMD(r.RATE_START_DATE) || "-"}</td>
                        <td>{toYMD(r.RATE_END_DATE) || "-"}</td>
                        <td className="text-end">{r.RATE_AMOUNT ?? "-"}</td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <Button
                              color="warning"
                              size="sm"
                              disabled={expired}
                              onClick={() => {
                                setEditingRate(r);
                                setRateModalOpen(true);
                              }}
                            >
                              <i className="bx bx-edit-alt me-1" />
                              Edit
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              disabled={expired}
                              onClick={() => {
                                setDeletingRate(r);
                                setDeleteRateModalOpen(true);
                              }}
                            >
                              <i className="bx bx-trash me-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {selectedRates.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No rates for this season.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button color="secondary" onClick={closeRatesModal}>
                Close
              </Button>
            </ModalFooter>
          </Modal>

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
                RATE_FOR_ID: editingRate
                  ? String(editingRate.RATE_FOR_ID || "")
                  : "",
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
                RATE_FOR_ID: Yup.string().required(
                  "Reservation type is required"
                ),
                RATE_START_DATE: Yup.string().nullable(),
                RATE_END_DATE: Yup.string()
                  .nullable()
                  .test(
                    "endAfterStart",
                    "End date must be after start date",
                    function (value) {
                      const { RATE_START_DATE } = this.parent;
                      if (!RATE_START_DATE || !value) return true;
                      return new Date(value) >= new Date(RATE_START_DATE);
                    }
                  ),
                RATE_AMOUNT: Yup.number()
                  .typeError("Amount must be a number")
                  .required("Amount is required")
                  .min(0, "Amount must be >= 0"),
              })}
              onSubmit={(values, { setSubmitting }) => {
                try {
                  if (!ratesSeason?.SEASON_ID) return;

                  const payload = {
                    RATE_FOR_ID: values.RATE_FOR_ID,
                    RATE_START_DATE: values.RATE_START_DATE || null,
                    RATE_END_DATE: values.RATE_END_DATE || null,
                    RATE_AMOUNT: values.RATE_AMOUNT,
                  };

                  if (editingRate) {
                    dispatch(
                      updateHotelSeasonRate(
                        hotelId,
                        ratesSeason.SEASON_ID,
                        editingRate.RATE_ID,
                        payload
                      )
                    );
                  } else {
                    dispatch(
                      createHotelSeasonRate(
                        hotelId,
                        ratesSeason.SEASON_ID,
                        payload
                      )
                    );
                  }

                  setRateModalOpen(false);
                } finally {
                  setSubmitting(false);
                }
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
                          <option key={it.LIST_ITEM_ID} value={it.LIST_ITEM_ID}>
                            {it.ITEM_NAME}
                          </option>
                        ))}
                      </Input>
                      {touched.RATE_FOR_ID && errors.RATE_FOR_ID ? (
                        <FormFeedback>{errors.RATE_FOR_ID}</FormFeedback>
                      ) : null}
                    </div>

                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Rate Start Date (optional)</Label>
                          <Input
                            type="date"
                            name="RATE_START_DATE"
                            value={values.RATE_START_DATE}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            invalid={
                              touched.RATE_START_DATE &&
                              !!errors.RATE_START_DATE
                            }
                          />
                          {touched.RATE_START_DATE && errors.RATE_START_DATE ? (
                            <FormFeedback>
                              {errors.RATE_START_DATE}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Rate End Date (optional)</Label>
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
                          {touched.RATE_END_DATE && errors.RATE_END_DATE ? (
                            <FormFeedback>{errors.RATE_END_DATE}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <Label>Amount</Label>
                      <Input
                        name="RATE_AMOUNT"
                        value={values.RATE_AMOUNT}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.RATE_AMOUNT && !!errors.RATE_AMOUNT}
                        placeholder="Enter rate amount"
                      />
                      {touched.RATE_AMOUNT && errors.RATE_AMOUNT ? (
                        <FormFeedback>{errors.RATE_AMOUNT}</FormFeedback>
                      ) : null}
                    </div>

                    <div className="alert alert-info mb-0">
                      Rates are stored <strong>inside the season</strong>. If
                      the season expires, these rates become unavailable
                      automatically.
                    </div>
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      color="secondary"
                      onClick={() => setRateModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {editingRate ? "Save" : "Create"}
                    </Button>
                  </ModalFooter>
                </Form>
              )}
            </Formik>
          </Modal>

          {/* Delete Rate Modal */}
          <Modal
            isOpen={deleteRateModalOpen}
            toggle={() => setDeleteRateModalOpen((v) => !v)}
            centered
          >
            <ModalHeader toggle={() => setDeleteRateModalOpen(false)}>
              Delete Rate
            </ModalHeader>
            <ModalBody>
              Are you sure you want to delete this rate{" "}
              <strong>
                {deletingRate?.ITEM_NAME ||
                  rateForLabel(deletingRate?.RATE_FOR_ID)}
              </strong>
              ?
            </ModalBody>
            <ModalFooter>
              <Button
                color="secondary"
                onClick={() => setDeleteRateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                onClick={() => {
                  if (!deletingRate || !ratesSeason?.SEASON_ID) return;
                  dispatch(
                    deleteHotelSeasonRate(
                      hotelId,
                      ratesSeason.SEASON_ID,
                      deletingRate.RATE_ID
                    )
                  );
                  setDeleteRateModalOpen(false);
                }}
              >
                Delete
              </Button>
            </ModalFooter>
          </Modal>
        </Container>
      </div>
    </RequireModule>
  );
};

const HotelSeasons = () => <HotelSeasonsInner />;

export default HotelSeasons;
