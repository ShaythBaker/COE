import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Alert,
  Spinner,
  Button,
  Badge,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useNavigate, useParams } from "react-router-dom";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";

import { getRoute, clearRoutesMessages } from "/src/store/routes/actions";
import { getSystemListItems } from "/src/helpers/fakebackend_helper";

const ROUTES_BASE = "/contracting/routes"; // ✅ NEW base path
const PLACES_BASE = "/contracting/places";

const EMPTY_ROUTES_STATE = {};

const routeSelector = createSelector(
  (state) => state?.Routes || state?.routes || EMPTY_ROUTES_STATE,
  (routesState) => ({
    route: routesState?.current || null,
    loading: routesState?.loadingCurrent || false,
    error: routesState?.error || null,
  })
);

const RouteDetailsInner = () => {
  document.title = "Route Details | Travco - COE";

  const { routeId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { route, loading, error } = useSelector(routeSelector);

  // ===== Countries system list (COUNTRIES) =====
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState(null);

  useEffect(() => {
    const loadCountries = async () => {
      setCountriesLoading(true);
      setCountriesError(null);
      try {
        const res = await getSystemListItems("COUNTRIES");
        setCountries(res?.ITEMS || []);
      } catch (e) {
        console.error("Failed to load countries", e);
        setCountriesError(
          e?.response?.data?.message || e?.message || "Failed to load countries"
        );
      } finally {
        setCountriesLoading(false);
      }
    };

    loadCountries();
  }, []);

  const countryNameById = useMemo(() => {
    const map = new Map();
    (countries || []).forEach((c) => {
      map.set(Number(c.LIST_ITEM_ID), c.ITEM_NAME);
    });
    return map;
  }, [countries]);

  const getCountryName = (countryId) => {
    const id = Number(countryId);
    return countryNameById.get(id) || `Country #${countryId}`;
  };

  useEffect(() => {
    if (!routeId) return;
    dispatch(getRoute(Number(routeId), null));
  }, [dispatch, routeId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearRoutesMessages());
    }
  }, [error, dispatch]);

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const parseAmount = (val) => {
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  // ===== Route-level: Entrance Fees by Country (aggregated across ALL places) =====
  const feesByCountry = useMemo(() => {
    const acc = new Map(); // countryId -> total
    (route?.PLACES || []).forEach((p) => {
      (p?.ENTRANCE_FEES || []).forEach((fee) => {
        const countryId = Number(fee?.PLACE_ENTRANCE_FEE_COUNTRY_ID);
        const amt = parseAmount(fee?.PLACE_ENTRANCE_FEE_AMOUNT);
        if (!countryId || amt === null) return;
        acc.set(countryId, (acc.get(countryId) || 0) + amt);
      });
    });

    // convert to array (sorted by country name for stable UI)
    return Array.from(acc.entries())
      .map(([countryId, total]) => ({
        countryId,
        countryName: getCountryName(countryId),
        total,
      }))
      .sort((a, b) => a.countryName.localeCompare(b.countryName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, countryNameById]);

  const renderPlaceFeesList = (place) => {
    const fees = place?.ENTRANCE_FEES || [];
    if (!fees.length) return <span className="text-muted">-</span>;

    // sort by country label for readability
    const sorted = [...fees].sort((a, b) =>
      getCountryName(a?.PLACE_ENTRANCE_FEE_COUNTRY_ID).localeCompare(
        getCountryName(b?.PLACE_ENTRANCE_FEE_COUNTRY_ID)
      )
    );

    return (
      <div className="d-flex flex-column gap-1">
        {sorted.map((fee) => {
          const countryId = fee?.PLACE_ENTRANCE_FEE_COUNTRY_ID;
          const amountRaw = fee?.PLACE_ENTRANCE_FEE_AMOUNT;
          const amountNum = parseAmount(amountRaw);

          return (
            <div
              key={
                fee?.PLACE_ENTRANCE_FEE_ID || `${place?.PLACE_ID}-${countryId}`
              }
              className="d-flex justify-content-between gap-2"
            >
              <span className="text-muted" style={{ whiteSpace: "nowrap" }}>
                {getCountryName(countryId)}
              </span>
              <span className="fw-semibold" style={{ whiteSpace: "nowrap" }}>
                {amountNum !== null
                  ? amountNum.toFixed(2)
                  : String(amountRaw || "-")}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-content">
      <ToastContainer position="top-right" autoClose={3000} />

      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Route Details" />

        <div className="mb-3">
          <Button
            color="secondary"
            size="sm"
            onClick={() => navigate(ROUTES_BASE)}
          >
            <i className="bx bx-arrow-back me-1" />
            Back to Routes
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardBody className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading route details...
            </CardBody>
          </Card>
        ) : !route ? (
          <Alert color="warning">Route not found.</Alert>
        ) : (
          <>
            <Card className="mb-3">
              <CardBody className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">{route.ROUTE_NAME}</h4>
                  <div className="mt-1">
                    {renderStatusBadge(route.ACTIVE_STATUS)}
                  </div>
                  <small className="text-muted d-block mt-2">
                    Places: {(route.PLACES || []).length}
                  </small>
                </div>
              </CardBody>
            </Card>

            {/* ✅ NEW: Entrance Fees by Country (instead of incorrect sum) */}
            <Card className="mb-3">
              <CardBody>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <h5 className="mb-0">Entrance Fees by Country</h5>

                  {countriesLoading ? (
                    <small className="text-muted">
                      <Spinner size="sm" className="me-1" />
                      Loading countries...
                    </small>
                  ) : null}
                </div>

                {countriesError ? (
                  <Alert color="warning" className="mb-2">
                    {countriesError}
                  </Alert>
                ) : null}

                {feesByCountry.length === 0 ? (
                  <Alert color="info" className="mb-0">
                    No entrance fees found for places in this route.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Country</th>
                          <th className="text-end" style={{ width: 180 }}>
                            Entrance Fee
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {feesByCountry.map((row) => (
                          <tr key={row.countryId}>
                            <td>{row.countryName}</td>
                            <td className="text-end fw-semibold">
                              {Number(row.total).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h5 className="mb-3">Places</h5>

                {(route.PLACES || []).length === 0 ? (
                  <Alert color="info">No places in this route.</Alert>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle table-nowrap">
                      <thead className="table-light">
                        <tr>
                          <th>Place</th>
                          <th>Description</th>
                          <th style={{ width: 320 }}>Entrance Fees</th>
                          <th style={{ width: 120 }} className="text-end">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(route.PLACES || []).map((p) => (
                          <tr key={p.ROUTS_PLACE_ID || p.PLACE_ID}>
                            <td>
                              <div className="fw-semibold">{p.PLACE_NAME}</div>
                              <small className="text-muted">
                                ID: {p.PLACE_ID}
                              </small>
                            </td>

                            <td style={{ maxWidth: 520 }}>
                              <div
                                className="text-muted"
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {p.PLACE_DESCRIPTION || "-"}
                              </div>
                            </td>

                            <td>{renderPlaceFeesList(p)}</td>

                            <td className="text-end">
                              <Button
                                color="primary"
                                size="sm"
                                onClick={() =>
                                  navigate(`${PLACES_BASE}/${p.PLACE_ID}`)
                                }
                              >
                                <i className="bx bx-show me-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </Container>
    </div>
  );
};

const RouteDetails = () => (
  <RequireModule moduleCode="ROUTES">
    <RouteDetailsInner />
  </RequireModule>
);

export default RouteDetails;
