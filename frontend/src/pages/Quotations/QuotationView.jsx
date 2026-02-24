import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Spinner,
  Button,
  Badge,
  Table,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useNavigate, useParams } from "react-router-dom";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";

import {
  getQoutationDetails,
  clearQoutationsMessages,
} from "/src/store/quotations/actions";
import { getAttachmentUrl } from "/src/helpers/attachments_helper";

const EMPTY_STATE = {};

const quotationsSelector = createSelector(
  (state) => state?.Quotations || state?.quotations || EMPTY_STATE,
  (q) => ({
    details: q?.details || null,
    loadingDetails: q?.loadingDetails || false,
    error: q?.error || null,
  }),
);

const money = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(2);
};

const formatDate = (value) => {
  if (!value) return "-";
  // API gives YYYY-MM-DD or timestamp
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
};

const statusBadge = (status) => {
  const isActive = status === 1 || status === "1";
  return (
    <Badge color={isActive ? "success" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
};

const QuotationViewInner = () => {
  document.title = "Quotation Details | Travco - COE";

  const { qoutationId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { details, loadingDetails, error } = useSelector(quotationsSelector);

  // attachmentId -> url
  const [imgUrls, setImgUrls] = useState({});

  useEffect(() => {
    if (qoutationId) dispatch(getQoutationDetails(Number(qoutationId)));
    return () => dispatch(clearQoutationsMessages());
  }, [dispatch, qoutationId]);

  // Collect place image attachment ids and resolve urls using local helper
  useEffect(() => {
    const load = async () => {
      const routes = details?.ROUTES || [];
      const ids = new Set();

      routes.forEach((r) => {
        (r?.PLACES || []).forEach((p) => {
          const attId =
            p?.PLACE_IMAGE?.PLACE_IMAGE_ATTACHMENT_ID ||
            p?.PLACE_IMAGE?.place_image_attachment_id;
          if (attId) ids.add(String(attId));
        });
      });

      if (ids.size === 0) return;

      const next = {};
      await Promise.all(
        Array.from(ids).map(async (id) => {
          try {
            const res = await getAttachmentUrl(id);
            // in some modules res might be { url } or plain string
            next[id] = res?.url || res?.URL || res || `/api/attachments/${id}`;
          } catch {
            next[id] = `/api/attachments/${id}`;
          }
        }),
      );

      setImgUrls((prev) => ({ ...prev, ...next }));
    };

    if (details) load();
  }, [details]);

  const q = details?.QOUTATION || null;
  const routes = details?.ROUTES || [];
  const extraServices = details?.EXTRA_SERVICES || [];
  const costs = details?.COSTS || null;

  const options = useMemo(() => {
    // Prefer COSTS.OPTIONS (aggregated) for view
    return costs?.OPTIONS || [];
  }, [costs]);

  if (loadingDetails || (!details && !error)) {
    return (
      <div className="page-content">
        <Container fluid>
          <Breadcrumb title="Contracting" breadcrumbItem="Quotation Details" />
          <Card>
            <CardBody className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading quotation details...
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Quotation Details" />

        <Row className="mb-3">
          <Col className="d-flex align-items-center">
            <Button
              color="secondary"
              size="sm"
              onClick={() => navigate("/contracting/quotations")}
            >
              <i className="bx bx-arrow-back me-1" />
              Back to Quotations
            </Button>

            <Button
              color="primary"
              size="sm"
              className="ms-2"
              onClick={() => navigate(`/quotations/${qoutationId}/share`)}
            >
              <i className="bx bx-share-alt me-1" />
              Share Quotation
            </Button>
          </Col>
        </Row>

        {error ? (
          <Alert color="danger" className="mb-3">
            {error}
          </Alert>
        ) : null}

        {/* Summary */}
        <Row>
          <Col lg={6}>
            <Card className="mb-3">
              <CardBody>
                <h5 className="mb-3">Group</h5>
                <dl className="row mb-0">
                  <dt className="col-sm-5">Quotation ID</dt>
                  <dd className="col-sm-7">{q?.QOUTATION_ID ?? "-"}</dd>

                  <dt className="col-sm-5">Group Name</dt>
                  <dd className="col-sm-7">{q?.QOUTATION_GROUP_NAME || "-"}</dd>

                  <dt className="col-sm-5">Total Pax</dt>
                  <dd className="col-sm-7">{q?.QOUTATION_TOTAL_PAX ?? "-"}</dd>

                  <dt className="col-sm-5">Arriving</dt>
                  <dd className="col-sm-7">
                    {formatDate(q?.QOUTATION_ARRIVING_DATE)}
                  </dd>

                  <dt className="col-sm-5">Departing</dt>
                  <dd className="col-sm-7">
                    {formatDate(q?.QOUTATION_DEPARTURING_DATE)}
                  </dd>

                  <dt className="col-sm-5">Status</dt>
                  <dd className="col-sm-7">{statusBadge(q?.ACTIVE_STATUS)}</dd>
                </dl>
              </CardBody>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="mb-3">
              <CardBody>
                <h5 className="mb-3">Client & Transportation</h5>
                <dl className="row mb-0">
                  <dt className="col-sm-5">Client</dt>
                  <dd className="col-sm-7">{q?.CLIENT_NAME || "-"}</dd>

                  <dt className="col-sm-5">Client Email</dt>
                  <dd className="col-sm-7">{q?.CLIENT_EMAIL || "-"}</dd>

                  <dt className="col-sm-5">Client Phone</dt>
                  <dd className="col-sm-7">{q?.CLIENT_PHONE || "-"}</dd>

                  <dt className="col-sm-5">Transportation</dt>
                  <dd className="col-sm-7">
                    {q?.TRANSPORTATION_COMPANY_NAME || "-"}
                  </dd>

                  <dt className="col-sm-5">Transportation Email</dt>
                  <dd className="col-sm-7">
                    {q?.TRANSPORTATION_COMPANY_EMAIL || "-"}
                  </dd>

                  <dt className="col-sm-5">Transportation Phone</dt>
                  <dd className="col-sm-7">{q?.TRANSPORTATION_PHONE || "-"}</dd>
                </dl>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Costs */}
        {costs ? (
          <Row>
            <Col lg={6}>
              <Card className="mb-3">
                <CardBody>
                  <h5 className="mb-3">Costs (Per Person)</h5>
                  <Table responsive borderless className="mb-0">
                    <tbody>
                      <tr>
                        <td>Transportation</td>
                        <td className="text-end">
                          {money(costs?.PER_PERSON?.TRANSPORTATION)}
                        </td>
                      </tr>
                      <tr>
                        <td>Entrance Fees</td>
                        <td className="text-end">
                          {money(costs?.PER_PERSON?.ENTRANCE_FEES)}
                        </td>
                      </tr>
                      <tr>
                        <td>Guide</td>
                        <td className="text-end">
                          {money(costs?.PER_PERSON?.GUIDE)}
                        </td>
                      </tr>
                      <tr>
                        <td>Meals</td>
                        <td className="text-end">
                          {money(costs?.PER_PERSON?.MEALS)}
                        </td>
                      </tr>
                      <tr>
                        <td>Extra Services</td>
                        <td className="text-end">
                          {money(costs?.PER_PERSON?.EXTRA_SERVICES)}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Total (w/o accommodation)</strong>
                        </td>
                        <td className="text-end">
                          <strong>
                            {money(
                              costs?.PER_PERSON?.TOTAL_WITHOUT_ACCOMMODATION,
                            )}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="mb-3">
                <CardBody>
                  <h5 className="mb-3">Costs (Per Group)</h5>
                  <Table responsive borderless className="mb-0">
                    <tbody>
                      <tr>
                        <td>Transportation</td>
                        <td className="text-end">
                          {money(costs?.PER_GROUP?.TRANSPORTATION)}
                        </td>
                      </tr>
                      <tr>
                        <td>Entrance Fees</td>
                        <td className="text-end">
                          {money(costs?.PER_GROUP?.ENTRANCE_FEES)}
                        </td>
                      </tr>
                      <tr>
                        <td>Guide</td>
                        <td className="text-end">
                          {money(costs?.PER_GROUP?.GUIDE)}
                        </td>
                      </tr>
                      <tr>
                        <td>Meals</td>
                        <td className="text-end">
                          {money(costs?.PER_GROUP?.MEALS)}
                        </td>
                      </tr>
                      <tr>
                        <td>Extra Services</td>
                        <td className="text-end">
                          {money(costs?.PER_GROUP?.EXTRA_SERVICES)}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Total (w/o accommodation)</strong>
                        </td>
                        <td className="text-end">
                          <strong>
                            {money(
                              costs?.PER_GROUP?.TOTAL_WITHOUT_ACCOMMODATION,
                            )}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            </Col>
          </Row>
        ) : null}

        {/* Accommodation Options (aggregated) */}
        {options?.length ? (
          <Card className="mb-3">
            <CardBody>
              <h5 className="mb-3">Accommodation Options</h5>
              <div className="table-responsive">
                <Table className="table align-middle table-nowrap mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Option</th>
                      <th>Hotel</th>
                      <th className="text-end">BB (PP)</th>
                      <th className="text-end">HB (PP)</th>
                      <th className="text-end">FB (PP)</th>
                      <th className="text-end">Single Supp. (PP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((o) => (
                      <tr key={o.OPTION_ID}>
                        <td>{o.OPTION_NAME}</td>
                        <td>{o.HOTEL_NAME}</td>
                        <td className="text-end">{money(o?.PER_PERSON?.BB)}</td>
                        <td className="text-end">
                          {money(o?.PER_PERSON?.HALF_BOARD)}
                        </td>
                        <td className="text-end">
                          {money(o?.PER_PERSON?.FULL_BOARD)}
                        </td>
                        <td className="text-end">
                          {money(o?.PER_PERSON?.SINGLE_SUPPLEMENT)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <small className="text-muted d-block mt-2">
                * Showing per-person accommodation totals for easier comparison.
              </small>
            </CardBody>
          </Card>
        ) : null}

        {/* Extra services */}
        {extraServices?.length ? (
          <Card className="mb-3">
            <CardBody>
              <h5 className="mb-3">Extra Services</h5>
              <div className="table-responsive">
                <Table className="table align-middle table-nowrap mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Service</th>
                      <th>Description</th>
                      <th className="text-end">Cost / Person</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraServices.map((s) => (
                      <tr key={s.QOUTATION_EXTRA_SERVICE_ID}>
                        <td>{s.EXTRA_SERVICE_NAME}</td>
                        <td>{s.EXTRA_SERVICE_DESCRIPTION || "-"}</td>
                        <td className="text-end">
                          {money(s.EXTRA_SERVICE_COST_PP)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {/* Itinerary */}
        <Card className="mb-3">
          <CardBody>
            <h5 className="mb-3">Itinerary</h5>

            {routes?.length ? (
              routes.map((r) => (
                <Card className="mb-3" key={r.QOUTATION_ROUTE_ID}>
                  <CardBody>
                    <Row className="align-items-center">
                      <Col md={8}>
                        <h6 className="mb-1">{r.ROUTE_NAME}</h6>
                        <div className="text-muted">
                          Date: {formatDate(r.ROUTE_DATE)} • Transportation:{" "}
                          {r.TRANSPORTATION_TYPE_NAME || "-"} • Amount:{" "}
                          {money(r.TRANSPORTATION_AMOUNT)}
                        </div>
                      </Col>
                    </Row>

                    {/* Places */}
                    {(r.PLACES || []).length ? (
                      <div className="mt-3">
                        <h6 className="mb-2">Places</h6>
                        {(r.PLACES || []).map((p) => {
                          const attId =
                            p?.PLACE_IMAGE?.PLACE_IMAGE_ATTACHMENT_ID ||
                            p?.PLACE_IMAGE?.place_image_attachment_id;

                          const img = attId ? imgUrls[String(attId)] : null;

                          return (
                            <Card className="mb-2" key={p.QOUTATION_PLACE_ID}>
                              <CardBody>
                                <Row>
                                  <Col md={3}>
                                    {img ? (
                                      <img
                                        src={img}
                                        alt={p.PLACE_NAME}
                                        style={{
                                          width: "100%",
                                          height: "140px",
                                          objectFit: "cover",
                                          borderRadius: "8px",
                                          border: "1px solid #eee",
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: "100%",
                                          height: "140px",
                                          borderRadius: "8px",
                                          border: "1px dashed #ddd",
                                        }}
                                        className="d-flex align-items-center justify-content-center text-muted"
                                      >
                                        No image
                                      </div>
                                    )}
                                  </Col>

                                  <Col md={9}>
                                    <h6 className="mb-1">{p.PLACE_NAME}</h6>
                                    <div className="text-muted mb-2">
                                      {p?.PLACE_DETAILS?.PLACE_DESCRIPTION ||
                                        "-"}
                                    </div>

                                    <Row>
                                      <Col sm={4}>
                                        <small className="text-muted d-block">
                                          Entrance Fees (PP)
                                        </small>
                                        <div>{money(p.ENTRANCE_FEES_PP)}</div>
                                      </Col>
                                      <Col sm={4}>
                                        <small className="text-muted d-block">
                                          Guide
                                        </small>
                                        <div>{p.GUIDE_TYPE_NAME || "-"}</div>
                                      </Col>
                                      <Col sm={4}>
                                        <small className="text-muted d-block">
                                          Guide Cost
                                        </small>
                                        <div>{money(p.GUIDE_COST)}</div>
                                      </Col>
                                    </Row>
                                  </Col>
                                </Row>
                              </CardBody>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-3 text-muted">
                        No places for this route.
                      </div>
                    )}

                    {/* Meals */}
                    {(r.MEALS || []).length ? (
                      <div className="mt-3">
                        <h6 className="mb-2">Meals</h6>
                        <div className="table-responsive">
                          <Table className="table align-middle table-nowrap mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Restaurant</th>
                                <th>Meal Type</th>
                                <th>Description</th>
                                <th className="text-end">Rate / Person</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(r.MEALS || []).map((m) => (
                                <tr key={m.QOUTATION_MEAL_ID}>
                                  <td>{m.RESTUARANT_NAME || "-"}</td>
                                  <td>{m.RESTAURANT_MEAL_TYPE_NAME || "-"}</td>
                                  <td>
                                    {m.RESTAURANT_MEAL_DESCRIPTION || "-"}
                                  </td>
                                  <td className="text-end">
                                    {money(m.RESTAURANT_MEAL_RATE_PP)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              ))
            ) : (
              <div className="text-muted">No routes found.</div>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

const QuotationView = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <QuotationViewInner />
  </RequireModule>
);

export default QuotationView;
