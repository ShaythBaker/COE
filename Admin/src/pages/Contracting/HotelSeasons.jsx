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
  Alert,
} from "reactstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  clearHotelSeasonMessages,
} from "../../store/hotels/actions";

const toYMD = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const HotelSeasonsInner = () => {
  document.title = "Hotel Seasons | Travco - COE";
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [seasonNameOptions, setSeasonNameOptions] = useState([]);
  const [seasonNameLoading, setSeasonNameLoading] = useState(false);
  const [seasonNameError, setSeasonNameError] = useState(null);

  useEffect(() => {
    const fetchSeasonNames = async () => {
      setSeasonNameLoading(true);
      setSeasonNameError(null);
      try {
        const res = await getSystemListItems("HOTEL_SEASONS");
        setSeasonNameOptions(res?.ITEMS || []);
      } catch (e) {
        console.error("Failed to load HOTEL_SEASONS list", e);
        setSeasonNameError("Failed to load season names list.");
        setSeasonNameOptions([]);
      } finally {
        setSeasonNameLoading(false);
      }
    };

    fetchSeasonNames();
  }, []);

  const { seasons, loadingSeasons, seasonsError, seasonSuccessMessage } =
    useSelector((state) => state.hotels);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (hotelId) dispatch(getHotelSeasons(hotelId));
  }, [dispatch, hotelId]);

  // Toast messages (replaces alerts)
  useEffect(() => {
    if (seasonSuccessMessage) {
      toast.success(seasonSuccessMessage);
      dispatch(clearHotelSeasonMessages());
    }
  }, [seasonSuccessMessage, dispatch]);

  useEffect(() => {
    if (seasonsError) {
      toast.error(seasonsError);
      dispatch(clearHotelSeasonMessages());
    }
  }, [seasonsError, dispatch]);

  useEffect(() => {
    // clear messages when leaving
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
    setDeleteOpen(true);
  };

  const doDelete = () => {
    if (!deleting?.SEASON_ID) return;
    dispatch(deleteHotelSeason(hotelId, deleting.SEASON_ID));
    setDeleteOpen(false);
    setDeleting(null);
  };

  const initialValues = useMemo(
    () => ({
      SEASON_NAME_ID: editing?.SEASON_NAME_ID ?? "",
      SEASON_START_DATE: editing ? toYMD(editing.SEASON_START_DATE) : "",
      SEASON_END_DATE: editing ? toYMD(editing.SEASON_END_DATE) : "",
    }),
    [editing]
  );

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Hotel Seasons" />

        <Row className="mb-3">
          <Col className="d-flex justify-content-between">
            <Button
              color="secondary"
              size="sm"
              onClick={() => navigate(`/contracting/hotels/${hotelId}`)}
            >
              <i className="bx bx-arrow-back me-1" />
              Back to Hotel Profile
            </Button>

            <Button color="primary" size="sm" onClick={openCreate}>
              <i className="bx bx-plus me-1" />
              Add Season
            </Button>
          </Col>
        </Row>

        <Card>
          <CardBody>
            {loadingSeasons ? (
              <div className="text-center my-3">
                <Spinner size="sm" className="me-2" />
                Loading seasons...
              </div>
            ) : (seasons || []).length === 0 ? (
              <p className="text-muted mb-0">
                No seasons found for this hotel.
              </p>
            ) : (
              <div className="table-responsive">
                <Table className="table align-middle table-nowrap mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Season</th>
                      <th style={{ width: 140 }}>Start</th>
                      <th style={{ width: 140 }}>End</th>
                      <th style={{ width: 160 }} className="text-end">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(seasons || []).map((s) => (
                      <tr key={s.SEASON_ID}>
                        <td>
                          <div className="fw-semibold">
                            {s.SEASON_NAME || "-"}
                          </div>
                          <small className="text-muted">
                            ID: {s.SEASON_ID} • Name ID: {s.SEASON_NAME_ID}
                          </small>
                        </td>
                        <td>{toYMD(s.SEASON_START_DATE) || "-"}</td>
                        <td>{toYMD(s.SEASON_END_DATE) || "-"}</td>
                        <td className="text-end">
                          <Button
                            color="soft-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => openEdit(s)}
                            title="Edit"
                          >
                            <i className="bx bx-edit-alt" />
                          </Button>
                          <Button
                            color="soft-danger"
                            size="sm"
                            onClick={() => openDelete(s)}
                            title="Delete"
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

        {/* Create/Edit modal */}
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
            initialValues={initialValues}
            validationSchema={Yup.object({
              SEASON_NAME_ID: Yup.string().required("Season is required"),
              SEASON_START_DATE: Yup.string().required(
                "Start date is required"
              ),
              SEASON_END_DATE: Yup.string()
                .required("End date is required")
                .test(
                  "endAfterStart",
                  "End date must be on/after start date",
                  function (val) {
                    const start = this.parent.SEASON_START_DATE;
                    if (!start || !val) return true;
                    return new Date(val).getTime() >= new Date(start).getTime();
                  }
                ),
            })}
            onSubmit={(values, { setSubmitting }) => {
              const payload = {
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

              setSubmitting(false);
              setModalOpen(false);
              setEditing(null);
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
                      Season name is selected by <strong>SEASON_NAME_ID</strong>
                      .
                    </small>
                  </Alert>

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

                    <FormFeedback>{errors.SEASON_NAME_ID}</FormFeedback>

                    {seasonNameError && (
                      <div className="text-danger mt-1">
                        <small>{seasonNameError}</small>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      name="SEASON_START_DATE"
                      value={values.SEASON_START_DATE}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.SEASON_START_DATE && !!errors.SEASON_START_DATE
                      }
                    />
                    <FormFeedback>{errors.SEASON_START_DATE}</FormFeedback>
                  </div>

                  <div className="mb-0">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      name="SEASON_END_DATE"
                      value={values.SEASON_END_DATE}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.SEASON_END_DATE && !!errors.SEASON_END_DATE
                      }
                    />
                    <FormFeedback>{errors.SEASON_END_DATE}</FormFeedback>
                  </div>
                </ModalBody>

                <ModalFooter>
                  <Button
                    type="button"
                    color="secondary"
                    onClick={() => setModalOpen(false)}
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

        {/* Delete confirm */}
        <Modal isOpen={deleteOpen} toggle={() => setDeleteOpen(false)} centered>
          <ModalHeader toggle={() => setDeleteOpen(false)}>
            Delete Season
          </ModalHeader>
          <ModalBody>
            Are you sure you want to delete this season?
            <div className="mt-2 text-muted">
              {deleting
                ? `${deleting.SEASON_NAME || "-"} (${toYMD(
                    deleting.SEASON_START_DATE
                  )} → ${toYMD(deleting.SEASON_END_DATE)})`
                : ""}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button color="danger" onClick={doDelete}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      </Container>
    </div>
  );
};

export default function HotelSeasons() {
  return (
    <RequireModule moduleCode="CONTRACTING_USER">
      <HotelSeasonsInner />
    </RequireModule>
  );
}
