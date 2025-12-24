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
  Table,
  Badge,
  Collapse,
  Form,
  Label,
  Input,
} from "reactstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/Auth/RequireModule";
import { getHotelSeasonsWithRates } from "../../store/hotels/actions";

const parseLocalYMD = (ymd) => {
  // ymd: "YYYY-MM-DD" from <input type="date">
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0); // local midnight
};

const toYMD = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

// Date helpers (inclusive)
const toStartOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const isBetweenInclusive = (target, start, end) => {
  if (!target || !start || !end) return false;
  const t = toStartOfDay(target).getTime();
  const s = toStartOfDay(new Date(start)).getTime();
  const e = toStartOfDay(new Date(end)).getTime();
  return t >= s && t <= e;
};

const addDays = (date, days) => {
  const d = new Date(date);
  // force local midnight then add days (DST-safe enough for date-only)
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + days,
    0,
    0,
    0,
    0
  );
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const diffDaysLocal = (start, end) => {
  // start/end are local-midnight Dates
  const s = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    0,
    0,
    0,
    0
  ).getTime();
  const e = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    0,
    0,
    0,
    0
  ).getTime();
  return Math.round((e - s) / MS_PER_DAY);
};

const getNightsArray = (checkIn, checkOut) => {
  const start = parseLocalYMD(checkIn);
  const end = parseLocalYMD(checkOut);

  if (!start || !end) return [];

  const nightsCount = diffDaysLocal(start, end);
  if (nightsCount <= 0) return [];

  // nights are check-in date + 0..(nightsCount-1)
  return Array.from({ length: nightsCount }, (_, i) => addDays(start, i));
};

// For the rate tables UI (shows "-" if missing)
const normalizeAmount = (val) => {
  if (val === null || val === undefined || val === "") return "-";
  if (typeof val === "number") return val;
  const n = Number(val);
  return Number.isFinite(n) ? n : val;
};

// For calculator math (returns number or null)
const normalizeAmountNumber = (val) => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return val;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

const HotelSeasonsWithRatesInner = () => {
  document.title = "Seasons Pricing | Travco - COE";
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { seasonsWithRates, loadingSeasonsWithRates, seasonsWithRatesError } =
    useSelector((state) => state.hotels);

  useEffect(() => {
    if (hotelId) dispatch(getHotelSeasonsWithRates(hotelId));
  }, [dispatch, hotelId]);

  const activeContract = seasonsWithRates?.ACTIVE_CONTRACT;

  // “today” (memoized so it doesn’t shift mid-render)
  const today = useMemo(() => new Date(), []);

  // Determine active season (if multiple match, pick the one with latest start)
  const activeSeasonId = useMemo(() => {
    const seasons = seasonsWithRates?.SEASONS || [];
    const activeSeasons = seasons
      .filter((s) =>
        isBetweenInclusive(today, s.SEASON_START_DATE, s.SEASON_END_DATE)
      )
      .sort(
        (a, b) =>
          new Date(b.SEASON_START_DATE).getTime() -
          new Date(a.SEASON_START_DATE).getTime()
      );
    return activeSeasons?.[0]?.SEASON_ID;
  }, [seasonsWithRates, today]);

  // Collapse state per season
  const [openSeason, setOpenSeason] = useState({}); // { [seasonId]: boolean }
  const toggleSeason = (seasonId) => {
    setOpenSeason((prev) => ({
      ...prev,
      [seasonId]: !prev[seasonId],
    }));
  };

  // ===== Stay Calculator =====
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");

  // All distinct rate item names across all seasons
  const rateItemOptions = useMemo(() => {
    const seasons = seasonsWithRates?.SEASONS || [];
    const set = new Set();
    seasons.forEach((s) =>
      (s.RATES || []).forEach((r) => {
        if (r?.ITEM_NAME) set.add(r.ITEM_NAME);
      })
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [seasonsWithRates]);

  // Default selection when options load
  useEffect(() => {
    if (!selectedItemName && rateItemOptions.length > 0) {
      setSelectedItemName(rateItemOptions[0]);
    }
  }, [rateItemOptions, selectedItemName]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return [];
    return getNightsArray(checkIn, checkOut);
  }, [checkIn, checkOut]);

  const calcResult = useMemo(() => {
    const seasons = seasonsWithRates?.SEASONS || [];
    if (!selectedItemName || nights.length === 0) {
      return { rows: [], total: 0, missingCount: 0 };
    }

    const rows = nights.map((nightDate) => {
      const season = seasons.find((s) =>
        isBetweenInclusive(nightDate, s.SEASON_START_DATE, s.SEASON_END_DATE)
      );

      const rate =
        season?.RATES?.find(
          (r) =>
            r?.ITEM_NAME === selectedItemName &&
            isBetweenInclusive(nightDate, r.RATE_START_DATE, r.RATE_END_DATE)
        ) || null;

      const amount = rate ? normalizeAmountNumber(rate.RATE_AMOUNT) : null;

      return {
        night: toYMD(nightDate),
        seasonName: season?.SEASON_NAME || "-",
        seasonId: season?.SEASON_ID || null,
        rateId: rate?.RATE_ID || null,
        amount,
        missing: !season || !rate || amount === null,
      };
    });

    const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
    const missingCount = rows.filter((r) => r.missing).length;

    return { rows, total, missingCount };
  }, [seasonsWithRates, nights, selectedItemName]);

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Seasons Pricing" />

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

            <Button
              color="primary"
              size="sm"
              onClick={() => navigate(`/contracting/hotels/${hotelId}/seasons`)}
            >
              <i className="bx bx-calendar me-1" />
              Manage Seasons
            </Button>
          </Col>
        </Row>

        {seasonsWithRatesError && (
          <Alert color="danger">{seasonsWithRatesError}</Alert>
        )}

        {loadingSeasonsWithRates ? (
          <Card>
            <CardBody className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading seasons pricing...
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Active contract summary */}
            <Card className="mb-3">
              <CardBody className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1">Active Contract</h6>
                  {activeContract ? (
                    <div className="text-muted">
                      {toYMD(activeContract.HOTEL_CONTRACT_START_DATE)} →{" "}
                      {toYMD(activeContract.HOTEL_CONTRACT_END_DATE)}
                    </div>
                  ) : (
                    <div className="text-muted">
                      No active contract for this hotel at the moment.
                    </div>
                  )}
                </div>

                <Badge color={activeContract ? "success" : "secondary"}>
                  {activeContract ? "Active" : "None"}
                </Badge>
              </CardBody>
            </Card>

            {/* ===== Stay Calculator ===== */}
            <Card className="mb-3">
              <CardBody>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-0">Stay Calculator</h6>
                    <small className="text-muted">
                      Select dates and a rate item to calculate total cost
                      (splits across seasons automatically).
                    </small>
                  </div>
                  <Badge color="primary" pill>
                    Nights: {nights.length}
                  </Badge>
                </div>

                <hr />

                <Form>
                  <Row className="g-3">
                    <Col md={3}>
                      <Label className="form-label">Check-in</Label>
                      <Input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                      />
                    </Col>

                    <Col md={3}>
                      <Label className="form-label">Check-out</Label>
                      <Input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </Col>

                    <small className="text-muted">
                      Check-in: {checkIn || "-"} | Check-out: {checkOut || "-"}{" "}
                      | Nights: {nights.length}
                    </small>

                    <Col md={6}>
                      <Label className="form-label">Rate Item</Label>
                      <Input
                        type="select"
                        value={selectedItemName}
                        onChange={(e) => setSelectedItemName(e.target.value)}
                        disabled={rateItemOptions.length === 0}
                      >
                        {rateItemOptions.length === 0 ? (
                          <option value="">No rate items available</option>
                        ) : (
                          rateItemOptions.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))
                        )}
                      </Input>
                    </Col>
                  </Row>
                </Form>

                <div className="mt-3">
                  {!checkIn || !checkOut ? (
                    <Alert color="info" className="mb-0">
                      Choose check-in and check-out dates to calculate the stay.
                    </Alert>
                  ) : nights.length === 0 ? (
                    <Alert color="warning" className="mb-0">
                      Check-out must be after check-in.
                    </Alert>
                  ) : (
                    <>
                      {calcResult.missingCount > 0 && (
                        <Alert color="warning">
                          {calcResult.missingCount} night(s) have no matching
                          season/rate for the selected Rate Item. Those nights
                          are counted as <b>0</b> in the total.
                        </Alert>
                      )}

                      <div className="table-responsive">
                        <Table className="table align-middle table-nowrap mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: 140 }}>Night</th>
                              <th>Season</th>
                              <th style={{ width: 160 }} className="text-end">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {calcResult.rows.map((r) => (
                              <tr key={r.night}>
                                <td>{r.night}</td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <span>{r.seasonName}</span>
                                    {r.missing ? (
                                      <Badge color="danger" pill>
                                        Missing
                                      </Badge>
                                    ) : (
                                      <Badge color="success" pill>
                                        OK
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="text-end fw-semibold">
                                  {r.amount === null ? "-" : r.amount}
                                </td>
                              </tr>
                            ))}

                            <tr>
                              <td colSpan={2} className="text-end fw-bold">
                                Total
                              </td>
                              <td className="text-end fw-bold">
                                {calcResult.total}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              </CardBody>
            </Card>

            {(seasonsWithRates?.SEASONS || []).length === 0 ? (
              <Alert color="info">No seasons found for this hotel.</Alert>
            ) : (
              (seasonsWithRates.SEASONS || []).map((s) => {
                const isActiveSeason =
                  s.SEASON_ID && s.SEASON_ID === activeSeasonId;

                const currentRates = (s.RATES || [])
                  .filter((r) =>
                    isBetweenInclusive(
                      today,
                      r.RATE_START_DATE,
                      r.RATE_END_DATE
                    )
                  )
                  .sort((a, b) => {
                    const aAmt = Number(a.RATE_AMOUNT);
                    const bAmt = Number(b.RATE_AMOUNT);
                    if (Number.isFinite(aAmt) && Number.isFinite(bAmt))
                      return aAmt - bAmt;
                    return (a.ITEM_NAME || "").localeCompare(b.ITEM_NAME || "");
                  });

                const hasRates = (s.RATES || []).length > 0;
                const hasCurrent = currentRates.length > 0;

                return (
                  <Card
                    key={s.SEASON_ID}
                    className={`mb-3 ${
                      isActiveSeason ? "border border-success" : ""
                    }`}
                  >
                    <CardBody>
                      <div className="d-flex align-items-start justify-content-between">
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="mb-1">{s.SEASON_NAME || "-"}</h6>
                            {isActiveSeason && (
                              <Badge color="success" pill>
                                <i className="bx bx-badge-check me-1" />
                                Active Season
                              </Badge>
                            )}
                          </div>

                          <div className="text-muted">
                            {toYMD(s.SEASON_START_DATE)} →{" "}
                            {toYMD(s.SEASON_END_DATE)}
                          </div>
                        </div>

                        <div className="text-end">
                          <Badge color="light" className="text-dark mb-2">
                            Season ID: {s.SEASON_ID}
                          </Badge>

                          {hasRates && (
                            <div>
                              <Button
                                color={isActiveSeason ? "success" : "primary"}
                                outline
                                size="sm"
                                onClick={() => toggleSeason(s.SEASON_ID)}
                              >
                                {openSeason[s.SEASON_ID] ? (
                                  <>
                                    <i className="bx bx-chevron-up me-1" />
                                    Hide all rates
                                  </>
                                ) : (
                                  <>
                                    <i className="bx bx-chevron-down me-1" />
                                    View all rates
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <hr />

                      {/* Current rates highlighted */}
                      {!hasRates ? (
                        <p className="text-muted mb-0">
                          No rates inside this season.
                        </p>
                      ) : (
                        <>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div>
                              <h6 className="mb-0">Current rates</h6>
                              <small className="text-muted">
                                Rates effective on {toYMD(today)}
                              </small>
                            </div>

                            <Badge
                              color={hasCurrent ? "info" : "secondary"}
                              pill
                            >
                              {hasCurrent
                                ? `${currentRates.length} active`
                                : "None active"}
                            </Badge>
                          </div>

                          {hasCurrent ? (
                            <div className="table-responsive mb-3">
                              <Table className="table align-middle table-nowrap mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th>Rate Item</th>
                                    <th
                                      style={{ width: 140 }}
                                      className="text-end"
                                    >
                                      Amount
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentRates.map((r) => (
                                    <tr key={r.RATE_ID}>
                                      <td>
                                        <div className="d-flex align-items-center gap-2">
                                          <Badge color="soft-success">
                                            <i className="bx bx-time-five" />
                                          </Badge>
                                          <span>{r.ITEM_NAME || "-"}</span>
                                        </div>
                                        <small className="text-muted">
                                          {toYMD(r.RATE_START_DATE) || "-"} →{" "}
                                          {toYMD(r.RATE_END_DATE) || "-"}
                                        </small>
                                      </td>
                                      <td className="text-end fw-semibold">
                                        {normalizeAmount(r.RATE_AMOUNT)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ) : (
                            <Alert color="warning" className="mb-3">
                              No rates are active today for this season.
                            </Alert>
                          )}

                          {/* All rates (collapsible) */}
                          <Collapse isOpen={!!openSeason[s.SEASON_ID]}>
                            <div className="table-responsive">
                              <Table className="table align-middle table-nowrap mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th>Rate Item</th>
                                    <th style={{ width: 140 }}>Start</th>
                                    <th style={{ width: 140 }}>End</th>
                                    <th
                                      style={{ width: 140 }}
                                      className="text-end"
                                    >
                                      Amount
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(s.RATES || []).map((r) => {
                                    const isCurrent = isBetweenInclusive(
                                      today,
                                      r.RATE_START_DATE,
                                      r.RATE_END_DATE
                                    );

                                    return (
                                      <tr key={r.RATE_ID}>
                                        <td>
                                          <div className="d-flex align-items-center gap-2">
                                            {isCurrent && (
                                              <Badge color="success" pill>
                                                Current
                                              </Badge>
                                            )}
                                            <span>{r.ITEM_NAME || "-"}</span>
                                          </div>
                                        </td>
                                        <td>
                                          {toYMD(r.RATE_START_DATE) || "-"}
                                        </td>
                                        <td>{toYMD(r.RATE_END_DATE) || "-"}</td>
                                        <td className="text-end">
                                          {normalizeAmount(r.RATE_AMOUNT)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </Table>
                            </div>
                          </Collapse>
                        </>
                      )}
                    </CardBody>
                  </Card>
                );
              })
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default function HotelSeasonsWithRates() {
  return (
    <RequireModule moduleCode="CONTRACTING_USER">
      <HotelSeasonsWithRatesInner />
    </RequireModule>
  );
}
