import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  CardBody,
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
import RequireModule from "../../components/Auth/RequireModule";
import TableContainer from "../../components/Common/TableContainer";

import {
  getRoutes,
  createRoute,
  getPlaces,
  clearRoutesMessages,
} from "/src/store/routes/actions";

const ROUTES_BASE = "/contracting/routes"; // ✅ NEW base path

const EMPTY_ROUTES_STATE = {};

const routesSelector = createSelector(
  (state) => state?.Routes || state?.routes || EMPTY_ROUTES_STATE,
  (routesState) => ({
    routes: routesState?.list || [],
    places: routesState?.places || [],
    loadingRoutes: routesState?.loadingList || false,
    loadingPlaces: routesState?.loadingPlaces || false,
    creating: routesState?.creating || false,
    error: routesState?.error || null,
    successMessage: routesState?.successMessage || null,
    lastCreatedRouteId: routesState?.lastCreatedRouteId || null,
  })
);

const createSchema = Yup.object().shape({
  ROUTE_NAME: Yup.string().trim().required("Route name is required"),
});

const RoutesListInner = () => {
  document.title = "Routes | Travco - COE";

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    routes,
    places,
    loadingRoutes,
    loadingPlaces,
    creating,
    error,
    successMessage,
    lastCreatedRouteId,
  } = useSelector(routesSelector);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlaceToAdd, setSelectedPlaceToAdd] = useState("");

  const toggleCreate = () => setIsCreateOpen((v) => !v);

  useEffect(() => {
    dispatch(getRoutes(null));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearRoutesMessages());
      dispatch(getRoutes(null));
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearRoutesMessages());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (lastCreatedRouteId) {
      setIsCreateOpen(false);
      navigate(`${ROUTES_BASE}/${lastCreatedRouteId}`); // ✅ FIXED
    }
  }, [lastCreatedRouteId, navigate]);

  const columns = useMemo(
    () => [
      {
        header: "Route Name",
        accessorKey: "ROUTE_NAME",
        enableColumnFilter: false,
      },
      {
        header: "# Places",
        id: "placesCount",
        enableColumnFilter: false,
        cell: ({ row }) => (row.original?.PLACES || []).length,
      },
      {
        header: "Status",
        accessorKey: "ACTIVE_STATUS",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const v = row.original?.ACTIVE_STATUS;
          const isActive = v === 1 || v === "1";
          return (
            <Badge color={isActive ? "success" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableColumnFilter: false,
        cell: ({ row }) => {
          const route = row.original;
          return (
            <Button
              color="link"
              size="sm"
              className="p-0"
              onClick={() => navigate(`${ROUTES_BASE}/${route.ROUTE_ID}`)} // ✅ FIXED
            >
              View Details
            </Button>
          );
        },
      },
    ],
    [navigate]
  );

  const initialValues = {
    ROUTE_NAME: "",
    PLACES: [],
  };

  const openCreate = () => {
    setSelectedPlaceToAdd("");
    setIsCreateOpen(true);
    dispatch(getPlaces());
  };

  const onSubmitCreate = (values) => {
    const payload = {
      ROUTE_NAME: values.ROUTE_NAME.trim(),
      PLACES: (values.PLACES || []).map((id) => Number(id)),
    };
    dispatch(createRoute(payload));
  };

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />

      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Routes" />

        <Card className="mb-3">
          <CardBody className="d-flex justify-content-end">
            <Button color="primary" onClick={openCreate}>
              <i className="bx bx-plus me-1" />
              Create Route
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            {loadingRoutes ? (
              <div className="text-center my-4">
                <Spinner size="sm" className="me-2" />
                Loading routes...
              </div>
            ) : (
              <TableContainer
                columns={columns}
                data={routes || []}
                divClassName="table-responsive"
                tableClass="table align-middle table-nowrap"
                theadClassName="table-light"
                isGlobalFilter={true}
                isPagination={false}
                SearchPlaceholder="Search routes..."
                isAddButton={false}
                disableFilters={true}
              />
            )}
          </CardBody>
        </Card>

        <Modal isOpen={isCreateOpen} toggle={toggleCreate} centered size="lg">
          <ModalHeader toggle={toggleCreate}>Create Route</ModalHeader>

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
            }) => {
              const addedPlaceIds = values.PLACES || [];

              const addSelectedPlace = () => {
                if (!selectedPlaceToAdd) return;
                const id = Number(selectedPlaceToAdd);
                if (addedPlaceIds.includes(id)) return;
                setFieldValue("PLACES", [...addedPlaceIds, id]);
                setSelectedPlaceToAdd("");
              };

              const removePlace = (id) => {
                setFieldValue(
                  "PLACES",
                  addedPlaceIds.filter((x) => Number(x) !== Number(id))
                );
              };

              const placeNameById = (id) =>
                (places || []).find((p) => Number(p.PLACE_ID) === Number(id))
                  ?.PLACE_NAME || `#${id}`;

              return (
                <Form onSubmit={handleSubmit}>
                  <ModalBody>
                    <FormGroup>
                      <Label>Route Name *</Label>
                      <Input
                        name="ROUTE_NAME"
                        value={values.ROUTE_NAME}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={touched.ROUTE_NAME && !!errors.ROUTE_NAME}
                        placeholder='e.g., "Amman - Jerash - Amman"'
                      />
                      {touched.ROUTE_NAME && errors.ROUTE_NAME ? (
                        <FormFeedback>{errors.ROUTE_NAME}</FormFeedback>
                      ) : null}
                    </FormGroup>

                    <FormGroup>
                      <Label>Add Places (one-by-one)</Label>

                      {loadingPlaces ? (
                        <div className="text-muted">
                          <Spinner size="sm" className="me-2" />
                          Loading places...
                        </div>
                      ) : (
                        <div className="d-flex gap-2">
                          <Input
                            type="select"
                            value={selectedPlaceToAdd}
                            onChange={(e) =>
                              setSelectedPlaceToAdd(e.target.value)
                            }
                          >
                            <option value="">Select a place</option>
                            {(places || []).map((p) => (
                              <option key={p.PLACE_ID} value={p.PLACE_ID}>
                                {p.PLACE_NAME}
                              </option>
                            ))}
                          </Input>

                          <Button
                            type="button"
                            color="success"
                            onClick={addSelectedPlace}
                            disabled={!selectedPlaceToAdd}
                          >
                            Add
                          </Button>
                        </div>
                      )}

                      <div className="mt-3">
                        <Label className="mb-2">Added Places</Label>

                        {addedPlaceIds.length === 0 ? (
                          <div className="text-muted">No places added yet.</div>
                        ) : (
                          <ul className="list-unstyled mb-0">
                            {addedPlaceIds.map((id) => (
                              <li
                                key={id}
                                className="d-flex align-items-center justify-content-between border rounded p-2 mb-2"
                              >
                                <div className="fw-semibold">
                                  {placeNameById(id)}
                                </div>
                                <Button
                                  type="button"
                                  color="danger"
                                  outline
                                  size="sm"
                                  onClick={() => removePlace(id)}
                                >
                                  Remove
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </FormGroup>
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      color="light"
                      onClick={toggleCreate}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button color="primary" type="submit" disabled={creating}>
                      {creating ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </ModalFooter>
                </Form>
              );
            }}
          </Formik>
        </Modal>
      </Container>
    </div>
  );
};

const RoutesList = () => (
  <RequireModule moduleCode="ROUTES">
    <RoutesListInner />
  </RequireModule>
);

export default RoutesList;
