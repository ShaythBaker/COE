// src/pages/Contracting/RestaurantCreate.jsx
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
import { useNavigate } from "react-router-dom";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";
import AttachmentUploader from "../../components/Common/AttachmentUploader";
import MapLocationPicker from "../../components/Common/MapLocationPicker";

import { getSystemListItems } from "/src/helpers/fakebackend_helper";
import {
  createRestaurant,
  clearRestaurantsMessages,
} from "/src/store/restaurants/actions";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EMPTY_STATE = {};
const restaurantsSelector = createSelector(
  (state) => state?.Restaurants || state?.restaurants || EMPTY_STATE,
  (s) => ({
    saving: s?.saving || false,
    error: s?.error || null,
    successMessage: s?.successMessage || null,
  })
);

const Schema = Yup.object().shape({
  RESTUARANT_NAME: Yup.string().trim().required("Restaurant name is required"),
  RESTUARANT_AREA_ID: Yup.string().required("Area is required"),
  RESTUARANT_STARS_RATE: Yup.number()
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .min(0, "Min 0")
    .max(5, "Max 5"),
  ACTIVE_STATUS: Yup.mixed().oneOf([0, 1]).required("Status is required"),
});

const RestaurantCreateInner = () => {
  document.title = "Create Restaurant | Travco - COE";

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { saving, error, successMessage } = useSelector(restaurantsSelector);

  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState(null);

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
    const loadAreas = async () => {
      setAreasLoading(true);
      setAreasError(null);
      try {
        const res = await getSystemListItems("AREAS");
        setAreas(res?.ITEMS || []);
      } catch (e) {
        setAreasError(
          e?.response?.data?.message || e?.message || "Failed to load areas"
        );
      } finally {
        setAreasLoading(false);
      }
    };
    loadAreas();
  }, []);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearRestaurantsMessages());
      navigate("/contracting/restaurants");
    }
  }, [successMessage, dispatch, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const initialValues = {
    RESTUARANT_NAME: "",
    RESTUARANT_AREA_ID: "",
    RESTUARANT_STARS_RATE: "",
    ACTIVE_STATUS: 1,

    // location is stored as "lat,lng" in API, but UI keeps fields
    RESTUARANT_LAT: "",
    RESTUARANT_LNG: "",

    RESTUARANT_LOGO_FILE_ID: null,
    RESTUARANT_LOGO_FILE_NAME: "",
  };

  const onSubmit = (values) => {
    const payload = {
      RESTUARANT_NAME: values.RESTUARANT_NAME.trim(),
      RESTUARANT_AREA_ID: values.RESTUARANT_AREA_ID
        ? Number(values.RESTUARANT_AREA_ID)
        : null,
      RESTUARANT_STARS_RATE:
        values.RESTUARANT_STARS_RATE === ""
          ? null
          : Number(values.RESTUARANT_STARS_RATE),
      ACTIVE_STATUS: Number(values.ACTIVE_STATUS),
      RESTUARANT_LOGO_ID: values.RESTUARANT_LOGO_FILE_ID || null,
    };

    // only send if selected
    if (values.RESTUARANT_LAT && values.RESTUARANT_LNG) {
      payload.RESTUARANT_LOCATION = `${values.RESTUARANT_LAT},${values.RESTUARANT_LNG}`;
    }

    dispatch(createRestaurant(payload));
  };

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Create Restaurant" />

        <Row>
          <Col lg={12}>
            <Card>
              <CardBody>
                {areasLoading ? (
                  <div className="mb-3">
                    <Spinner size="sm" className="me-2" />
                    Loading areas...
                  </div>
                ) : null}
                {areasError ? <Alert color="danger">{areasError}</Alert> : null}

                <Formik
                  initialValues={initialValues}
                  validationSchema={Schema}
                  onSubmit={onSubmit}
                >
                  {({ errors, touched, values, setFieldValue }) => (
                    <Form>
                      <Row>
                        <Col md={6}>
                          <FormGroup>
                            <Label for="RESTUARANT_NAME">
                              Restaurant Name *
                            </Label>
                            <Field
                              as={Input}
                              id="RESTUARANT_NAME"
                              name="RESTUARANT_NAME"
                              invalid={
                                touched.RESTUARANT_NAME &&
                                !!errors.RESTUARANT_NAME
                              }
                            />
                            {touched.RESTUARANT_NAME &&
                            errors.RESTUARANT_NAME ? (
                              <FormFeedback>
                                {errors.RESTUARANT_NAME}
                              </FormFeedback>
                            ) : null}
                          </FormGroup>
                        </Col>

                        <Col md={3}>
                          <FormGroup>
                            <Label>Area *</Label>
                            <Input
                              type="select"
                              value={values.RESTUARANT_AREA_ID}
                              disabled={areasLoading}
                              onChange={(e) =>
                                setFieldValue(
                                  "RESTUARANT_AREA_ID",
                                  e.target.value
                                )
                              }
                              invalid={
                                touched.RESTUARANT_AREA_ID &&
                                !!errors.RESTUARANT_AREA_ID
                              }
                            >
                              <option value="">Select area</option>
                              {areas.map((a) => (
                                <option
                                  key={a.LIST_ITEM_ID}
                                  value={a.LIST_ITEM_ID}
                                >
                                  {a.ITEM_NAME}
                                </option>
                              ))}
                            </Input>
                            {touched.RESTUARANT_AREA_ID &&
                            errors.RESTUARANT_AREA_ID ? (
                              <FormFeedback className="d-block">
                                {errors.RESTUARANT_AREA_ID}
                              </FormFeedback>
                            ) : null}
                          </FormGroup>
                        </Col>

                        <Col md={3}>
                          <FormGroup>
                            <Label>Stars (0 - 5)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={values.RESTUARANT_STARS_RATE}
                              onChange={(e) =>
                                setFieldValue(
                                  "RESTUARANT_STARS_RATE",
                                  e.target.value
                                )
                              }
                              invalid={
                                touched.RESTUARANT_STARS_RATE &&
                                !!errors.RESTUARANT_STARS_RATE
                              }
                            />
                            {touched.RESTUARANT_STARS_RATE &&
                            errors.RESTUARANT_STARS_RATE ? (
                              <FormFeedback className="d-block">
                                {errors.RESTUARANT_STARS_RATE}
                              </FormFeedback>
                            ) : null}
                          </FormGroup>
                        </Col>

                        <Col md={12}>
                          <FormGroup>
                            <Label>Location</Label>
                            <br />
                            <small className="text-muted">
                              {values.RESTUARANT_LAT && values.RESTUARANT_LNG
                                ? `Selected: ${values.RESTUARANT_LAT}, ${values.RESTUARANT_LNG}`
                                : "Click on the map to choose location."}
                            </small>
                            <MapLocationPicker
                              latitude={
                                values.RESTUARANT_LAT
                                  ? Number(values.RESTUARANT_LAT)
                                  : null
                              }
                              longitude={
                                values.RESTUARANT_LNG
                                  ? Number(values.RESTUARANT_LNG)
                                  : null
                              }
                              onChange={({ lat, lng }) => {
                                setFieldValue("RESTUARANT_LAT", lat.toString());
                                setFieldValue("RESTUARANT_LNG", lng.toString());
                              }}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={6}>
                          <FormGroup>
                            <Label>Restaurant Logo (image)</Label>
                            <AttachmentUploader
                              userId={currentUserId}
                              category="RESTUARANT_LOGO"
                              fileId={values.RESTUARANT_LOGO_FILE_ID}
                              fileName={values.RESTUARANT_LOGO_FILE_NAME}
                              accept="image/*"
                              onUploaded={(fileMeta) => {
                                setFieldValue(
                                  "RESTUARANT_LOGO_FILE_ID",
                                  fileMeta?.FILE_ID || null
                                );
                                setFieldValue(
                                  "RESTUARANT_LOGO_FILE_NAME",
                                  fileMeta?.FILE_NAME ||
                                    fileMeta?.ORIGINAL_NAME ||
                                    ""
                                );
                              }}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={3}>
                          <FormGroup>
                            <Label>Status *</Label>
                            <Input
                              type="select"
                              value={values.ACTIVE_STATUS}
                              onChange={(e) =>
                                setFieldValue(
                                  "ACTIVE_STATUS",
                                  Number(e.target.value)
                                )
                              }
                              invalid={
                                touched.ACTIVE_STATUS && !!errors.ACTIVE_STATUS
                              }
                            >
                              <option value={1}>Active</option>
                              <option value={0}>Inactive</option>
                            </Input>
                            {touched.ACTIVE_STATUS && errors.ACTIVE_STATUS ? (
                              <FormFeedback className="d-block">
                                {errors.ACTIVE_STATUS}
                              </FormFeedback>
                            ) : null}
                          </FormGroup>
                        </Col>

                        <Col md={12} className="mt-3">
                          <Button
                            type="button"
                            color="light"
                            className="me-2"
                            onClick={() => navigate("/contracting/restaurants")}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            color="primary"
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Spinner size="sm" className="me-2" />
                                Saving...
                              </>
                            ) : (
                              "Create"
                            )}
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

const RestaurantCreate = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <RestaurantCreateInner />
  </RequireModule>
);

export default RestaurantCreate;
