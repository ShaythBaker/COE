import React, { useMemo } from "react";
import { Alert, Badge, Card, CardBody, Col, Row, Table } from "reactstrap";

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const clampInt = (v, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
};

const formatMoney = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
};

const safeDate = (raw) => {
  if (!raw) return null;
  try {
    const s = String(raw);
    if (s.includes("T")) return new Date(s);
    return new Date(s.replace(" ", "T"));
  } catch {
    return null;
  }
};

const fmtDate = (raw) => {
  const d = safeDate(raw);
  if (!d || Number.isNaN(d.getTime())) return String(raw || "-");
  return d.toLocaleDateString();
};

// Step 2 (Accommodations) totals (same logic as step2 page)
const calcRoomCosts = (room) => {
  const nights = clampInt(room?.NIGHTS ?? 1, 1, 365);
  const guests = clampInt(room?.GUESTS ?? 1, 1, 10);

  const bb = toNum(room?.RATE_AMOUNT);
  const hb = toNum(room?.RATE_HALF_BOARD_AMOUNT);
  const fb = toNum(room?.RATE_FULL_BOARD_AMOUNT);
  const singleSupp = toNum(room?.RATE_SINGLE_SPPLIMENT_AMOUNT);

  const bbPP = nights * bb;
  const hbAddonPP = nights * hb;
  const fbAddonPP = nights * fb;
  const singleSuppPP = nights * singleSupp;

  return {
    bbTotal: bbPP * guests,
    hbAddonTotal: hbAddonPP * guests,
    fbAddonTotal: fbAddonPP * guests,
    singleSuppTotal: singleSuppPP * guests,
  };
};

const seasonSubtotal = (season) => {
  const rooms = Array.isArray(season?.rooms) ? season.rooms : [];
  return rooms.reduce(
    (acc, r) => {
      const t = calcRoomCosts(r);
      acc.bb += t.bbTotal;
      acc.hb += t.hbAddonTotal;
      acc.fb += t.fbAddonTotal;
      acc.singleSupp += t.singleSuppTotal;
      return acc;
    },
    { bb: 0, hb: 0, fb: 0, singleSupp: 0 },
  );
};

const hotelSubtotal = (hotel) => {
  const seasons = Array.isArray(hotel?.seasons) ? hotel.seasons : [];
  return seasons.reduce(
    (acc, s) => {
      const sub = seasonSubtotal(s);
      acc.bb += sub.bb;
      acc.hb += sub.hb;
      acc.fb += sub.fb;
      acc.singleSupp += sub.singleSupp;
      return acc;
    },
    { bb: 0, hb: 0, fb: 0, singleSupp: 0 },
  );
};

const optionSubtotal = (opt) => {
  const hotels = Array.isArray(opt?.hotels) ? opt.hotels : [];
  return hotels.reduce(
    (acc, h) => {
      const sub = hotelSubtotal(h);
      acc.bb += sub.bb;
      acc.hb += sub.hb;
      acc.fb += sub.fb;
      acc.singleSupp += sub.singleSupp;
      return acc;
    },
    { bb: 0, hb: 0, fb: 0, singleSupp: 0 },
  );
};

const normalizeStep2Options = (value) => {
  const arr = Array.isArray(value) ? value : [];

  // already in options format
  if (arr.length > 0 && Array.isArray(arr[0]?.hotels)) return arr;

  // legacy hotels-only array
  if (arr.length > 0 && arr[0]?.HOTEL_ID) {
    return [
      {
        OPTION_ID: "1",
        OPTION_NAME: "Option 1",
        hotels: arr,
      },
    ];
  }

  return [];
};

const QuotationStep4Summary = ({
  qoutationId,
  details,
  step1Options,
  step1Submitted,
  step2Value,
  step3QuotationExtraServices,
}) => {
  const totalPax =
    toNum(details?.QOUTATION_TOTAL_PAX) ||
    toNum(step1Submitted?.QOUTATION_TOTAL_PAX) ||
    0;

  const arrivingDate =
    details?.QOUTATION_ARRIVING_DATE || step1Submitted?.QOUTATION_ARRIVING_DATE;
  const departingDate =
    details?.QOUTATION_DEPARTING_DATE ||
    step1Submitted?.QOUTATION_DEPARTING_DATE;

  const numberOfDays =
    step1Options?.STAY_INFO?.STAY_BASIC_INFO?.NUMBER_OF_DAYS ||
    step1Submitted?.STAY_INFO?.STAY_BASIC_INFO?.NUMBER_OF_DAYS ||
    0;

  const routes = step1Options?.ROUTS || [];
  const transportation = step1Options?.TRANSPORTATION || [];

  const feeTypeMap = useMemo(() => {
    const map = new Map();
    (transportation || []).forEach((t) =>
      map.set(String(t.TRANSPORTATION_FEE_TYPE), t),
    );
    return map;
  }, [transportation]);

  const vehicleOptionsForFeeType = (feeTypeId) => {
    const t = feeTypeMap.get(String(feeTypeId));
    const opts = t?.OPTIONS || [];
    return opts.map((o) => ({
      value: o.TRANSPORTATION_FEE_VECHLE_TYPE,
      label: o.VEHICLE_TYPE_NAME,
      amount: o.TRANSPORTATION_FEE_AMOUNT,
    }));
  };

  const routeById = useMemo(() => {
    const map = new Map();
    (routes || []).forEach((r) => map.set(String(r.ROUTE_ID), r));
    return map;
  }, [routes]);

  const step1Totals = useMemo(() => {
    const pax = clampInt(
      totalPax ?? details?.QOUTATION_TOTAL_PAX ?? 0,
      0,
      100000,
    );

    let totalTransportation = 0;
    let mealsTotal = 0;
    let entranceFeesTotal = 0;
    let guidesTotal = 0;

    const rts = Array.isArray(step1Submitted?.ROUTS)
      ? step1Submitted.ROUTS
      : [];
    rts.forEach((r) => {
      totalTransportation += toNum(r?.TRANSPORTATION_AMOUNT);

      (Array.isArray(r?.MEALS) ? r.MEALS : []).forEach((m) => {
        const pp = toNum(m?.TOTAL_AMOUNT_PP);
        mealsTotal += pp * pax;
      });

      (Array.isArray(r?.PLACES) ? r.PLACES : []).forEach((p) => {
        const pp = toNum(p?.ENTRANCE_FEES_PP);
        entranceFeesTotal += pp * pax;

        // GUIDE_COST in step 1 payload is not marked "PP", so treat it as a total.
        guidesTotal += toNum(p?.GUIDE_COST);
      });
    });

    const transportationPerPax = pax > 0 ? totalTransportation / pax : 0;

    return {
      totalTransportation,
      transportationPerPax,
      mealsTotal,
      entranceFeesTotal,
      guidesTotal,
    };
  }, [step1Submitted, totalPax, details, routes, transportation]);

  const step2Options = useMemo(
    () => normalizeStep2Options(step2Value),
    [step2Value],
  );

  const extraServicesRows = useMemo(() => {
    const raw = step3QuotationExtraServices;
    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
          ? raw.data.data
          : [];
    return arr;
  }, [step3QuotationExtraServices]);

  const extraServicesTotals = useMemo(() => {
    const sumPP = extraServicesRows.reduce(
      (acc, r) =>
        acc + toNum(r?.EXTRA_SERVICE_COST_PP ?? r?.COST_PP ?? r?.PRICE_PP),
      0,
    );
    return {
      totalPP: sumPP,
      total: sumPP * (totalPax || 0),
    };
  }, [extraServicesRows, totalPax]);

  const accommodationsTotalsByOption = useMemo(() => {
    return step2Options.map((opt) => {
      const sub = optionSubtotal(opt);
      return {
        OPTION_ID: opt?.OPTION_ID ?? "",
        OPTION_NAME: opt?.OPTION_NAME ?? `Option ${opt?.OPTION_ID ?? ""}`,
        ...sub,
        // derived totals
        totalBB: sub.bb,
        totalHB: sub.bb + sub.hb,
        totalFB: sub.bb + sub.fb,
      };
    });
  }, [step2Options]);

  return (
    <div>
      {/* OVERVIEW */}
      <Row>
        <Col lg={12}>
          <Card className="mb-3">
            <CardBody>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h5 className="mb-1">Quotation Review</h5>
                  <div className="text-muted">
                    Quotation ID: <strong>{qoutationId || "-"}</strong>
                  </div>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  <Badge color="info" pill>
                    Pax: {totalPax || "-"}
                  </Badge>
                  <Badge color="secondary" pill>
                    Days: {numberOfDays || "-"}
                  </Badge>
                  <Badge color="light" pill className="text-dark">
                    {fmtDate(arrivingDate)} → {fmtDate(departingDate)}
                  </Badge>
                </div>
              </div>

              <hr className="my-3" />

              <Row>
                <Col md={4}>
                  <div className="mb-2">
                    <strong>Group Name:</strong>{" "}
                    {details?.QOUTATION_GROUP_NAME || "-"}
                  </div>
                  <div className="mb-2">
                    <strong>Transportation:</strong>{" "}
                    {details?.TRANSPORTATION_NAME ||
                      step1Submitted?.TRANSPORTATION_NAME ||
                      "-"}
                  </div>
                </Col>

                <Col md={4}>
                  <div className="mb-2">
                    <strong>Arriving:</strong> {fmtDate(arrivingDate)}
                  </div>
                  <div className="mb-2">
                    <strong>Departing:</strong> {fmtDate(departingDate)}
                  </div>
                </Col>

                <Col md={4}>
                  <div className="mb-2">
                    <strong>Total Pax:</strong>{" "}
                    {details?.QOUTATION_TOTAL_PAX ?? "-"}
                  </div>
                  <div className="mb-2">
                    <strong>Status:</strong>{" "}
                    {details?.QOUTATION_STATUS_NAME ||
                      details?.QOUTATION_STATUS ||
                      "-"}
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* STEP 1 TRANSPORTATION / ROUTES */}
      <Row>
        <Col lg={12}>
          <Card className="mb-3">
            <CardBody>
              <h6 className="mb-2">Step 1 — Transportation & Daily Program</h6>

              {Array.isArray(step1Submitted?.ROUTS) &&
              step1Submitted.ROUTS.length > 0 ? (
                <>
                  <div className="d-flex gap-3 flex-wrap mb-2">
                    <span>
                      <strong>Total Transportation:</strong>{" "}
                      {formatMoney(step1Totals.totalTransportation)}
                    </span>
                    <span>
                      <strong>Transportation / Pax:</strong>{" "}
                      {formatMoney(step1Totals.transportationPerPax)}
                    </span>
                    <span>
                      <strong>Meals Total:</strong>{" "}
                      {formatMoney(step1Totals.mealsTotal)}
                    </span>
                    <span>
                      <strong>Entrance Fees Total:</strong>{" "}
                      {formatMoney(step1Totals.entranceFeesTotal)}
                    </span>
                    <span>
                      <strong>Guides Total:</strong>{" "}
                      {formatMoney(step1Totals.guidesTotal)}
                    </span>
                  </div>

                  <div className="table-responsive">
                    <Table className="table align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "12%" }}>Date</th>
                          <th style={{ width: "20%" }}>Route</th>
                          <th style={{ width: "18%" }}>Fee Type</th>
                          <th style={{ width: "18%" }}>Vehicle Type</th>
                          <th style={{ width: "12%" }} className="text-end">
                            Amount
                          </th>
                          <th style={{ width: "20%" }} className="text-end">
                            Total (Amount × 1)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(step1Submitted?.ROUTS || []).map((r, idx) => {
                          const date =
                            r?.ROUTE_DATE ||
                            r?.ROUTE_DATE_DMY ||
                            r?.ROUTE_DATE_YMD;
                          const routeName =
                            r?.ROUTE_NAME ||
                            routeById.get(String(r?.ROUTE_ID))?.ROUTE_NAME ||
                            "-";

                          const feeTypeName =
                            r?.TRANSPORTATION_TYPE_NAME ||
                            feeTypeMap.get(String(r?.TRANSPORTATION_TYPE_ID))
                              ?.TRANSPORTATION_FEE_TYPE_NAME ||
                            "-";

                          const vehicleId =
                            r?.TRANSPORTATION_FEE_VECHLE_TYPE ??
                            r?.VEHICLE_TYPE_ID ??
                            r?.VEHICLE_TYPE ??
                            r?.TRANSPORTATION_VECHLE_TYPE ??
                            r?.TRANSPORTATION_VEHICLE_TYPE_ID ??
                            "";

                          const vehicleName =
                            vehicleOptionsForFeeType(
                              r?.TRANSPORTATION_TYPE_ID,
                            ).find((o) => String(o.value) === String(vehicleId))
                              ?.label ||
                            r?.VEHICLE_TYPE_NAME ||
                            "-";

                          const amt = toNum(r?.TRANSPORTATION_AMOUNT);
                          return (
                            <tr key={`${idx}-${date}`}>
                              <td>{date || "-"}</td>
                              <td>{routeName}</td>
                              <td>{feeTypeName}</td>
                              <td>{vehicleName}</td>
                              <td className="text-end">{formatMoney(amt)}</td>
                              <td className="text-end">{formatMoney(amt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </>
              ) : (
                <Alert color="secondary" className="mb-0">
                  No Step 1 routes/transportation saved yet.
                </Alert>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* STEP 2 ACCOMMODATIONS */}
      <Row>
        <Col lg={12}>
          <Card className="mb-3">
            <CardBody>
              <h6 className="mb-2">Step 2 — Accommodations Summary</h6>

              {step2Options.length === 0 ? (
                <Alert color="secondary" className="mb-0">
                  No accommodations selected yet.
                </Alert>
              ) : (
                <>
                  {accommodationsTotalsByOption.map((opt) => (
                    <div key={String(opt.OPTION_ID)} className="mb-4">
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                        <div className="fw-semibold">{opt.OPTION_NAME}</div>
                        <div className="d-flex gap-3 flex-wrap">
                          <span>
                            <strong>BB:</strong> {formatMoney(opt.totalBB)}
                          </span>
                          <span>
                            <strong>HB:</strong> {formatMoney(opt.totalHB)}
                          </span>
                          <span>
                            <strong>FB:</strong> {formatMoney(opt.totalFB)}
                          </span>
                          <span>
                            <strong>Single Supp:</strong>{" "}
                            {formatMoney(opt.singleSupp)}
                          </span>
                        </div>
                      </div>

                      <div className="table-responsive">
                        <Table className="table align-middle table-nowrap mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: "22%" }}>Hotel</th>
                              <th style={{ width: "14%" }}>Season</th>
                              <th style={{ width: "12%" }}>Room Type</th>
                              <th style={{ width: "8%" }} className="text-end">
                                Nights
                              </th>
                              <th style={{ width: "8%" }} className="text-end">
                                Guests
                              </th>
                              <th style={{ width: "9%" }} className="text-end">
                                BB / Pax
                              </th>
                              <th style={{ width: "9%" }} className="text-end">
                                HB / Pax
                              </th>
                              <th style={{ width: "9%" }} className="text-end">
                                FB / Pax
                              </th>
                              <th style={{ width: "9%" }} className="text-end">
                                Single Supp / Pax
                              </th>
                              <th style={{ width: "10%" }} className="text-end">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(Array.isArray(
                              step2Options.find(
                                (x) =>
                                  String(x.OPTION_ID) === String(opt.OPTION_ID),
                              )?.hotels,
                            )
                              ? step2Options.find(
                                  (x) =>
                                    String(x.OPTION_ID) ===
                                    String(opt.OPTION_ID),
                                )?.hotels
                              : []
                            )
                              .flatMap((h, hIdx) => {
                                const seasons = Array.isArray(h?.seasons)
                                  ? h.seasons
                                  : [];
                                const hotelName =
                                  h?.HOTEL_NAME || h?.HOTEL || "-";
                                const hotelArea =
                                  h?.HOTEL_AREA_NAME || h?.HOTEL_AREA || "-";

                                // Build one row per room, grouped by season (rowSpan).
                                const rows = [];
                                seasons.forEach((s, sIdx) => {
                                  const seasonLabel =
                                    s?.SEASON_NAME ||
                                    (s?.SEASON_START_DATE
                                      ? `${fmtDate(s.SEASON_START_DATE)} → ${fmtDate(s.SEASON_END_DATE)}`
                                      : "-");

                                  const rooms = Array.isArray(s?.rooms)
                                    ? s.rooms
                                    : [];
                                  rooms.forEach((r, rIdx) => {
                                    const nights = clampInt(
                                      r?.NIGHTS ?? 1,
                                      1,
                                      365,
                                    );
                                    const guests = clampInt(
                                      r?.GUESTS ?? 1,
                                      1,
                                      10,
                                    );

                                    const bb = toNum(r?.RATE_AMOUNT);
                                    const hb = toNum(r?.RATE_HALF_BOARD_AMOUNT);
                                    const fb = toNum(r?.RATE_FULL_BOARD_AMOUNT);
                                    const ss = toNum(
                                      r?.RATE_SINGLE_SPPLIMENT_AMOUNT,
                                    );

                                    const bbPP = nights * bb;
                                    const hbPP = nights * hb;
                                    const fbPP = nights * fb;
                                    const ssPP = nights * ss;

                                    const totals = calcRoomCosts(r);
                                    const total =
                                      totals.bbTotal +
                                      totals.hbAddonTotal +
                                      totals.fbAddonTotal +
                                      totals.singleSuppTotal;

                                    rows.push({
                                      key: `${String(opt.OPTION_ID)}-${hIdx}-${sIdx}-${rIdx}`,
                                      hotelName,
                                      hotelArea,
                                      seasonLabel,
                                      roomType:
                                        r?.RATE_FOR_NAME ||
                                        r?.RATE_FOR_ID ||
                                        "-",
                                      nights,
                                      guests,
                                      bbPP,
                                      hbPP,
                                      fbPP,
                                      ssPP,
                                      total,
                                      showHotel: sIdx === 0 && rIdx === 0,
                                      showSeason: rIdx === 0,
                                      seasonRowSpan: rooms.length || 1,
                                      hotelRowSpan:
                                        seasons.reduce(
                                          (acc, sx) =>
                                            acc +
                                            (Array.isArray(sx?.rooms)
                                              ? sx.rooms.length
                                              : 0),
                                          0,
                                        ) || 1,
                                    });
                                  });

                                  // if season has no rooms show one row
                                  if (rooms.length === 0) {
                                    rows.push({
                                      key: `${String(opt.OPTION_ID)}-${hIdx}-${sIdx}-empty`,
                                      hotelName,
                                      hotelArea,
                                      seasonLabel,
                                      roomType: "-",
                                      nights: "-",
                                      guests: "-",
                                      bbPP: 0,
                                      hbPP: 0,
                                      fbPP: 0,
                                      ssPP: 0,
                                      total: 0,
                                      showHotel: sIdx === 0,
                                      showSeason: true,
                                      seasonRowSpan: 1,
                                      hotelRowSpan:
                                        seasons.reduce(
                                          (acc, sx) =>
                                            acc +
                                            (Array.isArray(sx?.rooms)
                                              ? sx.rooms.length
                                              : 0),
                                          0,
                                        ) || 1,
                                    });
                                  }
                                });

                                // if hotel has no seasons
                                if (seasons.length === 0) {
                                  rows.push({
                                    key: `${String(opt.OPTION_ID)}-${hIdx}-empty`,
                                    hotelName,
                                    hotelArea,
                                    seasonLabel: "-",
                                    roomType: "-",
                                    nights: "-",
                                    guests: "-",
                                    bbPP: 0,
                                    hbPP: 0,
                                    fbPP: 0,
                                    ssPP: 0,
                                    total: 0,
                                    showHotel: true,
                                    showSeason: true,
                                    seasonRowSpan: 1,
                                    hotelRowSpan: 1,
                                  });
                                }

                                return rows;
                              })
                              .map((row) => (
                                <tr key={row.key}>
                                  {row.showHotel ? (
                                    <td rowSpan={row.hotelRowSpan}>
                                      <div className="fw-semibold">
                                        {row.hotelName}
                                      </div>
                                      <div className="text-muted">
                                        {row.hotelArea}
                                      </div>
                                    </td>
                                  ) : null}

                                  {row.showSeason ? (
                                    <td rowSpan={row.seasonRowSpan}>
                                      {row.seasonLabel}
                                    </td>
                                  ) : null}

                                  <td>{row.roomType}</td>
                                  <td className="text-end">{row.nights}</td>
                                  <td className="text-end">{row.guests}</td>
                                  <td className="text-end">
                                    {formatMoney(row.bbPP)}
                                  </td>
                                  <td className="text-end">
                                    {formatMoney(row.hbPP)}
                                  </td>
                                  <td className="text-end">
                                    {formatMoney(row.fbPP)}
                                  </td>
                                  <td className="text-end">
                                    {formatMoney(row.ssPP)}
                                  </td>
                                  <td className="text-end">
                                    {formatMoney(row.total)}
                                  </td>
                                </tr>
                              ))}

                            <tr className="table-light">
                              <td colSpan={9} className="text-end fw-semibold">
                                Option Total (BB/HB/FB/Single)
                              </td>
                              <td className="text-end fw-semibold">
                                {formatMoney(
                                  opt.totalBB +
                                    opt.totalHB +
                                    opt.totalFB +
                                    opt.singleSupp,
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* STEP 3 EXTRA SERVICES */}
      <Row>
        <Col lg={12}>
          <Card className="mb-3">
            <CardBody>
              <h6 className="mb-2">Step 3 — Extra Services Summary</h6>

              {extraServicesRows.length === 0 ? (
                <Alert color="secondary" className="mb-0">
                  No extra services added yet.
                </Alert>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table className="table align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "55%" }}>Service</th>
                          <th style={{ width: "20%" }} className="text-end">
                            Cost PP
                          </th>
                          <th style={{ width: "25%" }} className="text-end">
                            Total (PP × Pax)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {extraServicesRows.map((r, idx) => {
                          const costPP = toNum(
                            r?.EXTRA_SERVICE_COST_PP ??
                              r?.COST_PP ??
                              r?.PRICE_PP,
                          );
                          const total = costPP * (totalPax || 0);
                          return (
                            <tr key={`es-${idx}`}>
                              <td className="fw-semibold">
                                {r?.EXTRA_SERVICE_NAME ||
                                  r?.SERVICE_NAME ||
                                  "-"}
                              </td>
                              <td className="text-end">
                                {formatMoney(costPP)}
                              </td>
                              <td className="text-end">{formatMoney(total)}</td>
                            </tr>
                          );
                        })}
                        <tr className="table-light">
                          <td className="text-end fw-semibold">Totals</td>
                          <td className="text-end fw-semibold">
                            {formatMoney(extraServicesTotals.totalPP)}
                          </td>
                          <td className="text-end fw-semibold">
                            {formatMoney(extraServicesTotals.total)}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* GRAND TOTALS */}
      <Row>
        <Col lg={12}>
          <Card className="mb-0">
            <CardBody>
              <h6 className="mb-2">Grand Totals</h6>

              {accommodationsTotalsByOption.length === 0 ? (
                <Alert color="secondary" className="mb-0">
                  Add accommodations in Step 2 to see totals.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table className="table align-middle table-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Option</th>
                        <th className="text-end">Accom (BB)</th>
                        <th className="text-end">Extra Services</th>
                        <th className="text-end">Grand (BB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accommodationsTotalsByOption.map((opt) => {
                        const accomBB = toNum(opt.totalBB);
                        const extra = toNum(extraServicesTotals.total);
                        const grand = accomBB + extra;
                        return (
                          <tr key={`gt-${opt.OPTION_ID}`}>
                            <td className="fw-semibold">{opt.OPTION_NAME}</td>
                            <td className="text-end">{formatMoney(accomBB)}</td>
                            <td className="text-end">{formatMoney(extra)}</td>
                            <td className="text-end fw-semibold">
                              {formatMoney(grand)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QuotationStep4Summary;
