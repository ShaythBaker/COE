// src/pages/Contracting/RestaurantProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Spinner,
  Badge,
  Button,
  Table,
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
import { useDispatch, useSelector } from "react-redux";
import { Formik } from "formik";
import * as Yup from "yup";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";
import MapLocationPicker from "../../components/Common/MapLocationPicker";
import AttachmentUploader from "../../components/Common/AttachmentUploader";

import { getSystemListItems } from "/src/helpers/fakebackend_helper";
import { getAttachmentUrl } from "/src/helpers/attachments_helper";

import {
  getRestaurant,
  updateRestaurant,
  deleteRestaurant,
  clearRestaurantsMessages,
} from "/src/store/restaurants/actions";

import {
  getRestaurantMeals,
  createRestaurantMeal,
  updateRestaurantMeal,
  deleteRestaurantMeal,
  clearRestaurantMealsMessages,
} from "/src/store/restaurantMeals/actions";

const renderStatusBadge = (status) => {
  const isActive = status === 1 || status === "1";
  return (
    <Badge color={isActive ? "success" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
};

const parseLocation = (loc) => {
  if (!loc || typeof loc !== "string") return { lat: null, lng: null };
  const parts = loc.split(",").map((x) => x.trim());
  if (parts.length !== 2) return { lat: null, lng: null };
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return { lat: null, lng: null };
  return { lat, lng };
};

const normalizeErr = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Unexpected error";

const RestaurantProfileInner = () => {
  document.title = "Restaurant Profile | Travco - COE";

  const { RESTUARANT_ID } = useParams();
  const restaurantId = RESTUARANT_ID;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const restaurantsState = useSelector(
    (state) => state?.Restaurants || state?.restaurants || {}
  );
  const { current, loading, saving, deleting, error, successMessage } =
    restaurantsState;

  const mealsState = useSelector(
    (state) => state?.RestaurantMeals || state?.restaurantMeals || {}
  );
  const meals = mealsState?.list || [];
  const mealsLoading = mealsState?.loading || false;
  const mealsSaving = mealsState?.saving || false;
  const mealsDeleting = mealsState?.deleting || false;
  const mealsError = mealsState?.error || null;
  const mealsSuccess = mealsState?.successMessage || null;

  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState(null);

  const [mealTypes, setMealTypes] = useState([]);
  const [mealTypesLoading, setMealTypesLoading] = useState(false);
  const [mealTypesError, setMealTypesError] = useState(null);

  const [logoUrl, setLogoUrl] = useState("");

  // Restaurant edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Meals modal
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);

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

  // Load restaurant
  useEffect(() => {
    if (restaurantId) dispatch(getRestaurant(restaurantId));
  }, [restaurantId, dispatch]);

  // Load meals (active by default)
  useEffect(() => {
    if (restaurantId)
      dispatch(getRestaurantMeals(restaurantId, { ACTIVE_STATUS: 1 }));
  }, [restaurantId, dispatch]);

  // Load Areas
  useEffect(() => {
    const loadAreas = async () => {
      setAreasLoading(true);
      setAreasError(null);
      try {
        const res = await getSystemListItems("AREAS");
        setAreas(res?.ITEMS || []);
      } catch (e) {
        setAreasError(normalizeErr(e));
      } finally {
        setAreasLoading(false);
      }
    };
    loadAreas();
  }, []);

  // Load Meal Types
  useEffect(() => {
    const loadMealTypes = async () => {
      setMealTypesLoading(true);
      setMealTypesError(null);
      try {
        const res = await getSystemListItems("RESTAURANTS_MEAL_TYPES");
        setMealTypes(res?.ITEMS || []);
      } catch (e) {
        setMealTypesError(normalizeErr(e));
      } finally {
        setMealTypesLoading(false);
      }
    };
    loadMealTypes();
  }, []);

  // Logo URL
  useEffect(() => {
    const loadLogo = async () => {
      try {
        if (current?.RESTUARANT_LOGO_ID) {
          const url = await getAttachmentUrl(current.RESTUARANT_LOGO_ID);
          setLogoUrl(url || "");
        } else {
          setLogoUrl("");
        }
      } catch {
        setLogoUrl("");
      }
    };
    if (current) loadLogo();
  }, [current]);

  // ✅ TOAST: Restaurants success/error (Redux)
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearRestaurantsMessages());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearRestaurantsMessages());
    }
  }, [error, dispatch]);

  // ✅ TOAST: Meals success/error (Redux)
  useEffect(() => {
    if (mealsSuccess) {
      toast.success(mealsSuccess);
      dispatch(clearRestaurantMealsMessages());
    }
  }, [mealsSuccess, dispatch]);

  useEffect(() => {
    if (mealsError) {
      toast.error(mealsError);
      dispatch(clearRestaurantMealsMessages());
    }
  }, [mealsError, dispatch]);

  // ✅ TOAST: System list errors (local state)
  useEffect(() => {
    if (areasError) {
      toast.error(areasError);
      setAreasError(null);
    }
  }, [areasError]);

  useEffect(() => {
    if (mealTypesError) {
      toast.error(mealTypesError);
      setMealTypesError(null);
    }
  }, [mealTypesError]);

  const areaName = useMemo(() => {
    if (!current) return "-";
    const id = current.RESTUARANT_AREA_ID;
    if (!id) return "-";
    const found = areas.find((a) => String(a.LIST_ITEM_ID) === String(id));
    return found?.ITEM_NAME || `#${id}`;
  }, [current, areas]);

  const coords = useMemo(
    () => parseLocation(current?.RESTUARANT_LOCATION),
    [current]
  );

  const toggleEdit = () => setEditModalOpen((v) => !v);

  const mealTypeName = (typeId) => {
    if (!typeId) return "-";
    const found = mealTypes.find(
      (t) => String(t.LIST_ITEM_ID) === String(typeId)
    );
    return found?.ITEM_NAME || `#${typeId}`;
  };

  // ============================
  // Meals handlers
  // ============================
  const openCreateMeal = () => {
    setEditingMeal(null);
    setMealModalOpen(true);
  };

  const openEditMeal = (meal) => {
    setEditingMeal(meal);
    setMealModalOpen(true);
  };

  const confirmDeleteMeal = (meal) => {
    if (!meal?.RESTAURANT_MEAL_ID) return;
    const ok = window.confirm("Are you sure you want to delete this meal?");
    if (!ok) return;
    dispatch(deleteRestaurantMeal(restaurantId, meal.RESTAURANT_MEAL_ID));
  };

  const mealValidationSchema = Yup.object({
    RESTAURANT_MEAL_DESCRIPTION: Yup.string()
      .trim()
      .required("Meal description is required"),
    RESTAURANT_MEAL_TYPE_ID: Yup.string().nullable(),
    RESTAURANT_MEAL_RATE_PP: Yup.number()
      .nullable()
      .transform((v, o) => (o === "" ? null : v))
      .min(0, "Min 0"),
    ACTIVE_STATUS: Yup.mixed().oneOf([0, 1]).required("Status is required"),
  });

  const mealInitialValues = useMemo(
    () => ({
      RESTAURANT_MEAL_DESCRIPTION:
        editingMeal?.RESTAURANT_MEAL_DESCRIPTION || "",
      RESTAURANT_MEAL_TYPE_ID:
        editingMeal?.RESTAURANT_MEAL_TYPE_ID === null ||
        editingMeal?.RESTAURANT_MEAL_TYPE_ID === undefined
          ? ""
          : String(editingMeal.RESTAURANT_MEAL_TYPE_ID),
      RESTAURANT_MEAL_RATE_PP:
        editingMeal?.RESTAURANT_MEAL_RATE_PP === null ||
        editingMeal?.RESTAURANT_MEAL_RATE_PP === undefined
          ? ""
          : String(editingMeal.RESTAURANT_MEAL_RATE_PP),
      ACTIVE_STATUS: Number(editingMeal?.ACTIVE_STATUS ?? 1),
    }),
    [editingMeal]
  );

  const onSubmitMeal = (values, { setSubmitting }) => {
    const payload = {
      RESTAURANT_MEAL_DESCRIPTION: values.RESTAURANT_MEAL_DESCRIPTION.trim(),
      ACTIVE_STATUS: Number(values.ACTIVE_STATUS),
    };

    if (values.RESTAURANT_MEAL_TYPE_ID !== "") {
      payload.RESTAURANT_MEAL_TYPE_ID = Number(values.RESTAURANT_MEAL_TYPE_ID);
    }
    if (values.RESTAURANT_MEAL_RATE_PP !== "") {
      payload.RESTAURANT_MEAL_RATE_PP = Number(values.RESTAURANT_MEAL_RATE_PP);
    }

    if (editingMeal?.RESTAURANT_MEAL_ID) {
      dispatch(
        updateRestaurantMeal(
          restaurantId,
          editingMeal.RESTAURANT_MEAL_ID,
          payload
        )
      );
    } else {
      dispatch(createRestaurantMeal(restaurantId, payload));
    }

    setSubmitting(false);
    setMealModalOpen(false);
  };

  // ============================
  // Restaurant edit
  // ============================
  const editInitialValues = useMemo(() => {
    const loc = parseLocation(current?.RESTUARANT_LOCATION);
    return {
      RESTUARANT_NAME: current?.RESTUARANT_NAME || "",
      RESTUARANT_AREA_ID:
        current?.RESTUARANT_AREA_ID === null ||
        current?.RESTUARANT_AREA_ID === undefined
          ? ""
          : String(current.RESTUARANT_AREA_ID),
      RESTUARANT_STARS_RATE:
        current?.RESTUARANT_STARS_RATE === null ||
        current?.RESTUARANT_STARS_RATE === undefined
          ? ""
          : String(current.RESTUARANT_STARS_RATE),
      ACTIVE_STATUS: Number(current?.ACTIVE_STATUS ?? 1),

      RESTUARANT_LAT: loc.lat === null ? "" : String(loc.lat),
      RESTUARANT_LNG: loc.lng === null ? "" : String(loc.lng),

      RESTUARANT_LOGO_FILE_ID: current?.RESTUARANT_LOGO_ID || null,
      RESTUARANT_LOGO_FILE_NAME: "",
    };
  }, [current]);

  const restaurantValidationSchema = Yup.object({
    RESTUARANT_NAME: Yup.string()
      .trim()
      .required("Restaurant name is required"),
    RESTUARANT_AREA_ID: Yup.string().required("Area is required"),
    RESTUARANT_STARS_RATE: Yup.number()
      .nullable()
      .transform((v, o) => (o === "" ? null : v))
      .min(0, "Min 0")
      .max(5, "Max 5"),
    ACTIVE_STATUS: Yup.mixed().oneOf([0, 1]).required("Status is required"),
  });

  const onSubmitEdit = (values, { setSubmitting }) => {
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

    if (values.RESTUARANT_LAT && values.RESTUARANT_LNG) {
      payload.RESTUARANT_LOCATION = `${values.RESTUARANT_LAT},${values.RESTUARANT_LNG}`;
    }

    dispatch(updateRestaurant(restaurantId, payload));
    setSubmitting(false);
    setEditModalOpen(false);
  };

  const onDeleteRestaurant = () => {
    if (!restaurantId) return;
    const ok = window.confirm(
      "Are you sure you want to delete this restaurant?"
    );
    if (!ok) return;
    dispatch(deleteRestaurant(restaurantId));
    setTimeout(() => navigate("/contracting/restaurants"), 400);
  };

  if (loading || (!current && !error)) {
    return (
      <div className="page-content">
        <ToastContainer position="top-right" autoClose={3000} newestOnTop />
        <Container fluid>
          <Breadcrumb title="Contracting" breadcrumbItem="Restaurant Profile" />
          <Card>
            <CardBody className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading restaurant details...
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} newestOnTop />

      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Restaurant Profile" />

        <Row className="mb-3">
          <Col className="d-flex justify-content-between align-items-center">
            <Button
              color="secondary"
              size="sm"
              onClick={() => navigate("/contracting/restaurants")}
            >
              <i className="bx bx-arrow-back me-1" />
              Back to Restaurants
            </Button>

            {current ? (
              <div className="d-flex gap-2">
                <Button color="primary" size="sm" onClick={toggleEdit}>
                  <i className="bx bx-edit-alt me-1" />
                  Edit
                </Button>
                <Button
                  color="danger"
                  size="sm"
                  onClick={onDeleteRestaurant}
                  disabled={deleting}
                >
                  <i className="bx bx-trash me-1" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            ) : null}
          </Col>
        </Row>

        {!current ? (
          <Card>
            <CardBody className="text-center text-muted py-5">
              Restaurant not found.
            </CardBody>
          </Card>
        ) : (
          <>
            <Row>
              {/* Left */}
              <Col lg={4}>
                <Card className="mb-3">
                  <CardBody className="text-center">
                    {logoUrl ? (
                      <div className="avatar-xl mx-auto">
                        <div className="avatar-title rounded-circle bg-light">
                          <img
                            src={logoUrl}
                            alt="Restaurant Logo"
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
                          <i className="bx bx-store-alt font-size-24" />
                        </div>
                        <p className="text-muted mt-2 mb-0">No logo uploaded</p>
                      </div>
                    )}

                    <br />
                    <h4 className="mb-1">{current.RESTUARANT_NAME}</h4>
                    <div className="text-muted">
                      Area: <strong>{areaName}</strong>
                    </div>
                  </CardBody>
                </Card>
              </Col>

              {/* Right */}
              <Col lg={8}>
                <Card>
                  <CardBody>
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">General Info</h6>
                        <dl className="row mb-0">
                          <dt className="col-sm-4">Area</dt>
                          <dd className="col-sm-8">{areaName}</dd>

                          <dt className="col-sm-4">Stars Rate</dt>
                          <dd className="col-sm-8">
                            {current.RESTUARANT_STARS_RATE ?? "-"}
                          </dd>

                          <dt className="col-sm-4">Location</dt>
                          <dd className="col-sm-8">
                            {current.RESTUARANT_LOCATION || "-"}
                          </dd>
                        </dl>
                      </Col>

                      <Col md={6}>
                        <h6 className="mb-3">System Info</h6>
                        <dl className="row mb-0">
                          <dt className="col-sm-4">Restaurant ID</dt>
                          <dd className="col-sm-8">{current.RESTUARANT_ID}</dd>

                          <dt className="col-sm-4">Active Status</dt>
                          <dd className="col-sm-8">
                            {renderStatusBadge(current.ACTIVE_STATUS)}
                          </dd>

                          <dt className="col-sm-4">Created On</dt>
                          <dd className="col-sm-8">
                            {current.CREATED_ON || "-"}
                          </dd>
                        </dl>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Location */}
            <Row className="mt-3">
              <Col lg={12}>
                <Card>
                  <CardBody>
                    <h6 className="mb-3">Location</h6>
                    {coords.lat !== null && coords.lng !== null ? (
                      <>
                        <div className="mb-2 text-muted">
                          {coords.lat}, {coords.lng}
                        </div>
                        <MapLocationPicker
                          latitude={Number(coords.lat)}
                          longitude={Number(coords.lng)}
                        />
                      </>
                    ) : (
                      <p className="text-muted mb-0">
                        No coordinates available for this restaurant.
                      </p>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Meals */}
            <Row className="mt-3">
              <Col lg={12}>
                <Card>
                  <CardBody>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="mb-0">Meals</h6>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={openCreateMeal}
                        disabled={mealTypesLoading}
                      >
                        <i className="bx bx-plus me-1" />
                        Add Meal
                      </Button>
                    </div>

                    {mealsLoading ? (
                      <div className="text-center my-3">
                        <Spinner size="sm" className="me-2" />
                        Loading meals...
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table className="table align-middle table-nowrap mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Description</th>
                              <th style={{ width: 220 }}>Meal Type</th>
                              <th style={{ width: 160 }}>Rate / PP</th>
                              <th style={{ width: 100 }}>Status</th>
                              <th style={{ width: 160 }} className="text-end">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(meals || []).length === 0 ? (
                              <tr>
                                <td
                                  colSpan="5"
                                  className="text-center text-muted py-4"
                                >
                                  No meals found.
                                </td>
                              </tr>
                            ) : (
                              (meals || []).map((m) => (
                                <tr key={m.RESTAURANT_MEAL_ID}>
                                  <td>{m.RESTAURANT_MEAL_DESCRIPTION}</td>
                                  <td>
                                    {mealTypeName(m.RESTAURANT_MEAL_TYPE_ID)}
                                  </td>
                                  <td>{m.RESTAURANT_MEAL_RATE_PP ?? "-"}</td>
                                  <td>{renderStatusBadge(m.ACTIVE_STATUS)}</td>
                                  <td className="text-end">
                                    <Button
                                      color="link"
                                      className="p-0 me-3"
                                      onClick={() => openEditMeal(m)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      color="link"
                                      className="p-0 text-danger"
                                      disabled={mealsDeleting}
                                      onClick={() => confirmDeleteMeal(m)}
                                    >
                                      Delete
                                    </Button>
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
          </>
        )}

        {/* Restaurant Edit Modal */}
        <Modal isOpen={editModalOpen} toggle={toggleEdit} centered size="lg">
          <ModalHeader toggle={toggleEdit}>Edit Restaurant</ModalHeader>

          <Formik
            enableReinitialize
            initialValues={editInitialValues}
            validationSchema={restaurantValidationSchema}
            onSubmit={onSubmitEdit}
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
                  {areasLoading ? (
                    <div className="mb-2">
                      <Spinner size="sm" className="me-2" />
                      Loading areas...
                    </div>
                  ) : null}

                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Restaurant Name *</Label>
                        <Input
                          name="RESTUARANT_NAME"
                          value={values.RESTUARANT_NAME}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={
                            touched.RESTUARANT_NAME && !!errors.RESTUARANT_NAME
                          }
                        />
                        {touched.RESTUARANT_NAME && errors.RESTUARANT_NAME ? (
                          <FormFeedback>{errors.RESTUARANT_NAME}</FormFeedback>
                        ) : null}
                      </FormGroup>
                    </Col>

                    <Col md={3}>
                      <FormGroup>
                        <Label>Area *</Label>
                        <Input
                          type="select"
                          value={values.RESTUARANT_AREA_ID}
                          onChange={(e) =>
                            setFieldValue("RESTUARANT_AREA_ID", e.target.value)
                          }
                          onBlur={handleBlur}
                          invalid={
                            touched.RESTUARANT_AREA_ID &&
                            !!errors.RESTUARANT_AREA_ID
                          }
                        >
                          <option value="">Select area</option>
                          {areas.map((a) => (
                            <option key={a.LIST_ITEM_ID} value={a.LIST_ITEM_ID}>
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
                          onBlur={handleBlur}
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
                            setFieldValue("RESTUARANT_LAT", String(lat));
                            setFieldValue("RESTUARANT_LNG", String(lng));
                          }}
                        />
                      </FormGroup>
                    </Col>

                    <Col md={6}>
                      <FormGroup>
                        <Label>Logo</Label>
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
                  </Row>
                </ModalBody>

                <ModalFooter>
                  <Button
                    color="secondary"
                    type="button"
                    onClick={toggleEdit}
                    disabled={saving || isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    disabled={saving || isSubmitting}
                  >
                    {saving || isSubmitting ? (
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

        {/* Meals Create/Edit Modal */}
        <Modal
          isOpen={mealModalOpen}
          toggle={() => setMealModalOpen((v) => !v)}
          centered
        >
          <ModalHeader toggle={() => setMealModalOpen(false)}>
            {editingMeal ? "Edit Meal" : "Add Meal"}
          </ModalHeader>

          <Formik
            enableReinitialize
            initialValues={mealInitialValues}
            validationSchema={mealValidationSchema}
            onSubmit={onSubmitMeal}
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
                  {mealTypesLoading ? (
                    <div className="mb-2">
                      <Spinner size="sm" className="me-2" />
                      Loading meal types...
                    </div>
                  ) : null}

                  <FormGroup>
                    <Label>Description *</Label>
                    <Input
                      name="RESTAURANT_MEAL_DESCRIPTION"
                      value={values.RESTAURANT_MEAL_DESCRIPTION}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={
                        touched.RESTAURANT_MEAL_DESCRIPTION &&
                        !!errors.RESTAURANT_MEAL_DESCRIPTION
                      }
                    />
                    {touched.RESTAURANT_MEAL_DESCRIPTION &&
                    errors.RESTAURANT_MEAL_DESCRIPTION ? (
                      <FormFeedback>
                        {errors.RESTAURANT_MEAL_DESCRIPTION}
                      </FormFeedback>
                    ) : null}
                  </FormGroup>

                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Meal Type</Label>
                        <Input
                          type="select"
                          value={values.RESTAURANT_MEAL_TYPE_ID}
                          onChange={(e) =>
                            setFieldValue(
                              "RESTAURANT_MEAL_TYPE_ID",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select</option>
                          {mealTypes.map((t) => (
                            <option key={t.LIST_ITEM_ID} value={t.LIST_ITEM_ID}>
                              {t.ITEM_NAME}
                            </option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>

                    <Col md={6}>
                      <FormGroup>
                        <Label>Rate / Person</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={values.RESTAURANT_MEAL_RATE_PP}
                          onChange={(e) =>
                            setFieldValue(
                              "RESTAURANT_MEAL_RATE_PP",
                              e.target.value
                            )
                          }
                          onBlur={handleBlur}
                          invalid={
                            touched.RESTAURANT_MEAL_RATE_PP &&
                            !!errors.RESTAURANT_MEAL_RATE_PP
                          }
                        />
                        {touched.RESTAURANT_MEAL_RATE_PP &&
                        errors.RESTAURANT_MEAL_RATE_PP ? (
                          <FormFeedback className="d-block">
                            {errors.RESTAURANT_MEAL_RATE_PP}
                          </FormFeedback>
                        ) : null}
                      </FormGroup>
                    </Col>
                  </Row>

                  <FormGroup>
                    <Label>Status *</Label>
                    <Input
                      type="select"
                      value={values.ACTIVE_STATUS}
                      onChange={(e) =>
                        setFieldValue("ACTIVE_STATUS", Number(e.target.value))
                      }
                      invalid={touched.ACTIVE_STATUS && !!errors.ACTIVE_STATUS}
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
                </ModalBody>

                <ModalFooter>
                  <Button
                    color="secondary"
                    type="button"
                    onClick={() => setMealModalOpen(false)}
                    disabled={mealsSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    disabled={mealsSaving || isSubmitting}
                  >
                    {mealsSaving || isSubmitting ? (
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
      </Container>
    </div>
  );
};

const RestaurantProfile = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <RestaurantProfileInner />
  </RequireModule>
);

export default RestaurantProfile;
