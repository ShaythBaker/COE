import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  Col,
  Container,
  NavItem,
  NavLink,
  Row,
  Spinner,
  TabContent,
  TabPane,
  Table,
  Input,
} from "reactstrap";
import classnames from "classnames";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";

import {
  getQoutationById,
  getQoutationStep1,
  clearQoutationsMessages,
} from "/src/store/quotations/actions";

const EMPTY_STATE = {};

const quotationDetailsSelector = createSelector(
  (state) => state?.Quotations || state?.quotations || EMPTY_STATE,
  (s) => ({
    details: s?.details || null,
    step1: s?.step1 || null,
    loadingDetails: s?.loadingDetails || false,
    loadingStep1: s?.loadingStep1 || false,
    error: s?.error || null,
  })
);

const toYmd = (dateObj) => {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDays = (ymd, daysToAdd) => {
  // ymd expected: "YYYY-MM-DD"
  const [y, m, d] = (ymd || "").split("-").map((x) => Number(x));
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + daysToAdd);
  return toYmd(dt);
};

const QuotationWizardInner = () => {
  document.title = "Quotation | Travco - COE";

  const { id } = useParams();
  const dispatch = useDispatch();

  const { details, step1, loadingDetails, loadingStep1, error } = useSelector(
    quotationDetailsSelector
  );

  // Wizard states (based on FormWizard.jsx)
  const [activeTab, setactiveTab] = useState(1);
  const [passedSteps, setPassedSteps] = useState([1]);

  // Step1 Days Table local state
  // each row: { dayNo, date, routeId, feeTypeId, vehicleTypeId, amount, isAdjusted }
  const [daysRows, setDaysRows] = useState([]);

  const step1Qoutation = step1?.QOUTATION || null;
  const routes = step1?.ROUTS || [];
  const transportation = step1?.TRANSPORTATION || [];
  const numberOfDays =
    step1?.STAY_INFO?.STAY_BASIC_INFO?.NUMBER_OF_DAYS || 0;

  const arrivingDate =
    step1Qoutation?.QOUTATION_ARRIVING_DATE ||
    details?.QOUTATION_ARRIVING_DATE ||
    "";

  function toggleTab(tab) {
    if (activeTab !== tab) {
      const modifiedSteps = [...passedSteps, tab];
      if (tab >= 1 && tab <= 4) {
        setactiveTab(tab);
        setPassedSteps(modifiedSteps);
      }
    }
  }

  useEffect(() => {
    dispatch(clearQoutationsMessages());
    if (id) {
      dispatch(getQoutationById(id)); // GET /api/qoutations/:id
      dispatch(getQoutationStep1(id)); // GET /api/qoutations/:id/step1
    }
  }, [dispatch, id]);

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"} className="ms-2">
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const feeTypeMap = useMemo(() => {
    // key: feeTypeId -> transportation item
    const map = new Map();
    (transportation || []).forEach((t) =>
      map.set(String(t.TRANSPORTATION_FEE_TYPE), t)
    );
    return map;
  }, [transportation]);

  const findAmount = (feeTypeId, vehicleTypeId) => {
    const t = feeTypeMap.get(String(feeTypeId));
    const opts = t?.OPTIONS || [];
    const found = opts.find(
      (o) =>
        String(o.TRANSPORTATION_FEE_VECHLE_TYPE) === String(vehicleTypeId)
    );
    return found?.TRANSPORTATION_FEE_AMOUNT ?? "";
  };

  // Initialize Days table when step1 data arrives
  useEffect(() => {
    if (!step1 || !numberOfDays || !arrivingDate) {
      setDaysRows([]);
      return;
    }

    const defaultRouteId = routes?.[0]?.ROUTE_ID ?? "";
    const defaultFeeTypeId = transportation?.[0]?.TRANSPORTATION_FEE_TYPE ?? "";
    const defaultVehicleTypeId =
      transportation?.[0]?.OPTIONS?.[0]?.TRANSPORTATION_FEE_VECHLE_TYPE ?? "";

    const defaultAmount = findAmount(defaultFeeTypeId, defaultVehicleTypeId);

    const rows = Array.from({ length: Number(numberOfDays) }, (_, idx) => ({
      dayNo: idx + 1,
      date: addDays(arrivingDate, idx),
      routeId: defaultRouteId,
      feeTypeId: defaultFeeTypeId,
      vehicleTypeId: defaultVehicleTypeId,
      amount: defaultAmount,
      isAdjusted: false,
    }));

    setDaysRows(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step1, numberOfDays, arrivingDate]);

  const onChangeRow = (rowIndex, field, value) => {
    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };

      if (field === "routeId") {
        r.routeId = value;
      }

      if (field === "feeTypeId") {
        r.feeTypeId = value;

        // reset vehicle to first option of selected fee type
        const t = feeTypeMap.get(String(value));
        const firstVehicle =
          t?.OPTIONS?.[0]?.TRANSPORTATION_FEE_VECHLE_TYPE ?? "";
        r.vehicleTypeId = firstVehicle;

        // set amount from backend option
        r.amount = findAmount(value, firstVehicle);
        r.isAdjusted = false;
      }

      if (field === "vehicleTypeId") {
        r.vehicleTypeId = value;
        r.amount = findAmount(r.feeTypeId, value);
        r.isAdjusted = false;
      }

      if (field === "amount") {
        r.amount = value;
        r.isAdjusted = true;
      }

      next[rowIndex] = r;
      return next;
    });
  };

  const vehicleOptionsForFeeType = (feeTypeId) => {
    const t = feeTypeMap.get(String(feeTypeId));
    return t?.OPTIONS || [];
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Quotation" />

        {error && (
          <Alert color="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {/* Top: Basic Quotation Info */}
        <Card className="mb-3">
          <CardBody>
            {loadingDetails ? (
              <div className="text-center my-3">
                <Spinner size="sm" className="me-2" />
                Loading quotation info...
              </div>
            ) : details ? (
              <Row className="gy-2">
                <Col md={4}>
                  <div>
                    <strong>ID:</strong> {details.QOUTATION_ID}
                    {renderStatusBadge(details.ACTIVE_STATUS)}
                  </div>
                  <div className="text-muted">
                    <small>
                      Created: {details.CREATED_ON || "-"} | Updated:{" "}
                      {details.UPDATED_ON || "-"}
                    </small>
                  </div>
                </Col>

                <Col md={4}>
                  <div>
                    <strong>Client:</strong> {details.CLIENT_NAME || "-"}
                  </div>
                  <div>
                    <strong>Group:</strong>{" "}
                    {details.QOUTATION_GROUP_NAME || "-"}
                  </div>
                  <div>
                    <strong>Total Pax:</strong>{" "}
                    {details.QOUTATION_TOTAL_PAX ?? "-"}
                  </div>
                </Col>

                <Col md={4}>
                  <div>
                    <strong>Transportation:</strong>{" "}
                    {details.TRANSPORTATION_COMPANY_NAME || "-"}
                  </div>
                  <div>
                    <strong>Arriving:</strong>{" "}
                    {details.QOUTATION_ARRIVING_DATE || "-"}
                  </div>
                  <div>
                    <strong>Departuring:</strong>{" "}
                    {details.QOUTATION_DEPARTURING_DATE || "-"}
                  </div>
                </Col>
              </Row>
            ) : (
              <Alert color="warning" className="mb-0">
                Quotation not found.
              </Alert>
            )}
          </CardBody>
        </Card>

        {/* Wizard (Basic Wizard layout) */}
        <Card>
          <CardBody>
            <h4 className="card-title mb-4">Quotation Wizard</h4>

            <div className="wizard clearfix">
              <div className="steps clearfix">
                <ul>
                  <NavItem className={classnames({ current: activeTab === 1 })}>
                    <NavLink
                      className={classnames({ current: activeTab === 1 })}
                      onClick={() => setactiveTab(1)}
                      disabled={!(passedSteps || []).includes(1)}
                    >
                      <span className="number">1.</span> Step 1
                    </NavLink>
                  </NavItem>

                  <NavItem className={classnames({ current: activeTab === 2 })}>
                    <NavLink
                      className={classnames({ active: activeTab === 2 })}
                      onClick={() => setactiveTab(2)}
                      disabled={!(passedSteps || []).includes(2)}
                    >
                      <span className="number">2.</span> Step 2
                    </NavLink>
                  </NavItem>

                  <NavItem className={classnames({ current: activeTab === 3 })}>
                    <NavLink
                      className={classnames({ active: activeTab === 3 })}
                      onClick={() => setactiveTab(3)}
                      disabled={!(passedSteps || []).includes(3)}
                    >
                      <span className="number">3.</span> Step 3
                    </NavLink>
                  </NavItem>

                  <NavItem className={classnames({ current: activeTab === 4 })}>
                    <NavLink
                      className={classnames({ active: activeTab === 4 })}
                      onClick={() => setactiveTab(4)}
                      disabled={!(passedSteps || []).includes(4)}
                    >
                      <span className="number">4.</span> Review
                    </NavLink>
                  </NavItem>
                </ul>
              </div>

              <div className="content clearfix">
                <TabContent activeTab={activeTab} className="body">
                  {/* =======================
                      STEP 1 - Days Table
                     ======================= */}
                  <TabPane tabId={1}>
                    {loadingStep1 ? (
                      <div className="text-center my-3">
                        <Spinner size="sm" className="me-2" />
                        Loading step 1...
                      </div>
                    ) : !step1 ? (
                      <Alert color="warning" className="mb-0">
                        Step 1 data not found.
                      </Alert>
                    ) : (
                      <>
                        <Row className="mb-3">
                          <Col md={4}>
                            <div>
                              <strong>Number of Days:</strong>{" "}
                              {numberOfDays || 0}
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <strong>Arriving Date:</strong>{" "}
                              {arrivingDate || "-"}
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <strong>Departuring Date:</strong>{" "}
                              {step1Qoutation?.QOUTATION_DEPARTURING_DATE ||
                                details?.QOUTATION_DEPARTURING_DATE ||
                                "-"}
                            </div>
                          </Col>
                        </Row>

                        <div className="table-responsive">
                          <Table className="table table-bordered align-middle">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: 80 }}>Day</th>
                                <th style={{ width: 140 }}>Date</th>
                                <th>Route</th>
                                <th style={{ width: 220 }}>
                                  Transportation Fee Type
                                </th>
                                <th style={{ width: 180 }}>Vehicle Type</th>
                                <th style={{ width: 160 }}>Amount</th>
                                <th style={{ width: 120 }}>Adjusted</th>
                              </tr>
                            </thead>
                            <tbody>
                              {daysRows.map((r, idx) => {
                                const vehicles = vehicleOptionsForFeeType(
                                  r.feeTypeId
                                );
                                return (
                                  <tr key={`${r.dayNo}-${r.date}`}>
                                    <td>{r.dayNo}</td>
                                    <td>{r.date || "-"}</td>

                                    <td>
                                      <Input
                                        type="select"
                                        value={r.routeId ?? ""}
                                        onChange={(e) =>
                                          onChangeRow(
                                            idx,
                                            "routeId",
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="">
                                          Select route
                                        </option>
                                        {(routes || []).map((rt) => (
                                          <option
                                            key={rt.ROUTE_ID}
                                            value={rt.ROUTE_ID}
                                          >
                                            {rt.ROUTE_NAME}
                                          </option>
                                        ))}
                                      </Input>
                                    </td>

                                    <td>
                                      <Input
                                        type="select"
                                        value={r.feeTypeId ?? ""}
                                        onChange={(e) =>
                                          onChangeRow(
                                            idx,
                                            "feeTypeId",
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="">
                                          Select fee type
                                        </option>
                                        {(transportation || []).map((t) => (
                                          <option
                                            key={t.TRANSPORTATION_FEE_TYPE}
                                            value={t.TRANSPORTATION_FEE_TYPE}
                                          >
                                            {t.TRANSPORTATION_FEE_TYPE_NAME}
                                          </option>
                                        ))}
                                      </Input>
                                    </td>

                                    <td>
                                      <Input
                                        type="select"
                                        value={r.vehicleTypeId ?? ""}
                                        onChange={(e) =>
                                          onChangeRow(
                                            idx,
                                            "vehicleTypeId",
                                            e.target.value
                                          )
                                        }
                                        disabled={!r.feeTypeId}
                                      >
                                        <option value="">
                                          Select vehicle
                                        </option>
                                        {vehicles.map((v) => (
                                          <option
                                            key={v.TRANSPORTATION_FEE_VECHLE_TYPE}
                                            value={v.TRANSPORTATION_FEE_VECHLE_TYPE}
                                          >
                                            {v.VEHICLE_TYPE_NAME}
                                          </option>
                                        ))}
                                      </Input>
                                    </td>

                                    <td>
                                      <Input
                                        type="number"
                                        value={r.amount ?? ""}
                                        onChange={(e) =>
                                          onChangeRow(
                                            idx,
                                            "amount",
                                            e.target.value
                                          )
                                        }
                                        placeholder="0.00"
                                      />
                                    </td>

                                    <td>
                                      {r.isAdjusted ? (
                                        <Badge color="warning">Yes</Badge>
                                      ) : (
                                        <Badge color="secondary">No</Badge>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                              {!daysRows.length ? (
                                <tr>
                                  <td colSpan="7">
                                    <Alert color="info" className="mb-0">
                                      No days generated (missing NUMBER_OF_DAYS
                                      or ARRIVING_DATE).
                                    </Alert>
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </Table>
                        </div>

                        <div className="text-muted">
                          <small>
                            Amount is auto-filled from backend options and can be
                            adjusted manually per day.
                          </small>
                        </div>
                      </>
                    )}
                  </TabPane>

                  <TabPane tabId={2}>
                    <Alert color="secondary" className="mb-0">
                      Step 2 placeholder.
                    </Alert>
                  </TabPane>

                  <TabPane tabId={3}>
                    <Alert color="secondary" className="mb-0">
                      Step 3 placeholder.
                    </Alert>
                  </TabPane>

                  <TabPane tabId={4}>
                    <Alert color="success" className="mb-0">
                      Review placeholder.
                    </Alert>
                  </TabPane>
                </TabContent>
              </div>

              <div className="actions clearfix">
                <ul>
                  <li
                    className={
                      activeTab === 1 ? "previous disabled" : "previous"
                    }
                  >
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleTab(activeTab - 1);
                      }}
                    >
                      Previous
                    </Link>
                  </li>

                  <li className={activeTab === 4 ? "next disabled" : "next"}>
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleTab(activeTab + 1);
                      }}
                    >
                      Next
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

const QuotationWizard = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <QuotationWizardInner />
  </RequireModule>
);

export default QuotationWizard;
