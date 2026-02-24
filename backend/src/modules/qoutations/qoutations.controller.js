// modules/qoutations/qoutations.controller.js
const dbService = require("../../core/dbService");
const pool = require("../../core/db");

const QOUTATIONS_TABLE = "COE_TBL_QOUTATIONS";
const QOUTATIONS_VIEW = "COE_VIEW_QOUTATIONS_LOOKUP";

const ROUTES_VIEW = "COE_VIEW_QOUTATION_ROUTES_LOOKUP";
const PLACES_VIEW = "COE_VIEW_QOUTATION_PLACES_LOOKUP";
const PLACES_TABLE = "COE_TBL_PLACES";
const PLACES_IMAGES_TABLE = "COE_TBL_PLACES_IMAGES";
const ACCOM_OPTIONS_VIEW = "COE_VIEW_QOUTATION_ACCOM_OPTION_ROOMS_LOOKUP";
const EXTRA_SERVICES_VIEW = "COE_VIEW_QOUTATION_EXTRA_SERVICES_LOOKUP";
const MEALS_VIEW = "COE_VIEW_QOUTATION_MEALS_LOOKUP";

// Helper to get company id from backend (JWT user or session)
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) {
    return req.user.COMPANY_ID;
  }
  if (req.session && req.session.COMPANY_ID) {
    return req.session.COMPANY_ID;
  }
  return null;
}

// Helper to compute basic stay info (days & nights) from arriving/departuring dates
function calculateStayBasicInfo(arrivingDate, departingDate) {
  if (!arrivingDate || !departingDate) {
    return null;
  }

  const start = new Date(arrivingDate);
  const end = new Date(departingDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return null;
  }

  const MS_IN_DAY = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((end.getTime() - start.getTime()) / MS_IN_DAY);

  // Convention: nights = diff in days, days = nights + 1
  const numberOfNights = diffDays;
  const numberOfDays = diffDays + 1;

  return {
    NUMBER_OF_DAYS: numberOfDays,
    NUMBER_OF_NIGHTS: numberOfNights,
  };
}

// All columns that can be used as filters on the VIEW
const QOUTATIONS_FILTERABLE_COLUMNS = [
  "QOUTATION_ID",
  "QOUTATION_CLIENT_ID",
  "QOUTATION_TRANSPORTATION_COMPANY_ID",
  "QOUTATION_TOTAL_PAX",
  "QOUTATION_GROUP_NAME",
  "QOUTATION_ARRIVING_DATE",
  "QOUTATION_DEPARTURING_DATE",
  "COMPANY_ID",
  "CREATED_ON",
  "UPDATED_ON",
  "ACTIVE_STATUS",
  "CREATED_BY_NAME",
  "UPDATED_BY_NAME",
  "CLIENT_NAME",
  "CLIENT_COUNTRY_ID",
  "CLIENT_COUNTRY_NAME",
  "CLIENT_EMAIL",
  "CLIENT_PHONE",
  "CLIENT_CONTACT_PERSON_NAME",
  "TRANSPORTATION_COMPANY_NAME",
  "TRANSPORTATION_PHONE",
  "TRANSPORTATION_COMPANY_EMAIL",
];

/**
 * GET /api/qoutations
 *
 * Dynamic filter using COE_VIEW_QOUTATIONS.
 * Any query param whose key matches a column in the view
 * is added as an equality filter.
 *
 * /api/qoutations?QOUTATION_CLIENT_ID=10&CLIENT_NAME=ACME
 */
async function listQoutations(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const where = {};
    const query = req.query || {};

    // Build dynamic WHERE from query params (only columns in the view)
    for (const key of Object.keys(query)) {
      if (QOUTATIONS_FILTERABLE_COLUMNS.includes(key)) {
        where[key] = query[key];
      }
    }

    // Optional pagination: ?limit=&offset=
    let limit;
    let offset;

    if (query.limit !== undefined) {
      const parsedLimit = parseInt(query.limit, 10);
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    if (query.offset !== undefined) {
      const parsedOffset = parseInt(query.offset, 10);
      if (!Number.isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }

    const rows = await dbService.find(
      {
        table: QOUTATIONS_VIEW,
        where,
        orderBy: "QOUTATION_ID DESC",
        limit,
        offset,
      },
      companyId,
    );

    // RESPONSE DATA FROM VIEW
    return res.json(rows);
  } catch (err) {
    console.error("listQoutations error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/qoutations/:QOUTATION_ID
 *
 * Uses COE_VIEW_QOUTATIONS (enriched row).
 */
async function getQoutationById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const QOUTATION_ID = parseInt(req.params.QOUTATION_ID, 10);
    if (!QOUTATION_ID || Number.isNaN(QOUTATION_ID)) {
      return res.status(400).json({ message: "Invalid QOUTATION_ID" });
    }

    const rows = await dbService.find(
      {
        table: QOUTATIONS_VIEW,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId,
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    // RESPONSE DATA FROM VIEW
    return res.json(rows[0]);
  } catch (err) {
    console.error("getQoutationById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/qoutations
 *
 * BODY:
 * {
 *   "QOUTATION_CLIENT_ID": 123,              // required
 *   "QOUTATION_TOTAL_PAX": 25,
 *   "QOUTATION_TRANSPORTATION_COMPANY_ID": 5,
 *   "QOUTATION_GROUP_NAME": "Group A",      // required
 *   "QOUTATION_ARRIVING_DATE": "2026-01-01",
 *   "QOUTATION_DEPARTURING_DATE": "2026-01-07",
 *   "ACTIVE_STATUS": 1
 * }
 *
 * Backend handles:
 *   COMPANY_ID (from token/session via dbService)
 *   CREATED_ON, CREATED_BY, UPDATED_ON, UPDATED_BY
 *
 * RESPONSE: created row FROM VIEW.
 */
async function createQoutation(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      QOUTATION_CLIENT_ID,
      QOUTATION_TOTAL_PAX,
      QOUTATION_TRANSPORTATION_COMPANY_ID,
      QOUTATION_GROUP_NAME,
      QOUTATION_ARRIVING_DATE,
      QOUTATION_DEPARTURING_DATE,
      ACTIVE_STATUS,
    } = req.body;

    if (!QOUTATION_CLIENT_ID || !QOUTATION_GROUP_NAME) {
      return res.status(400).json({
        message: "QOUTATION_CLIENT_ID and QOUTATION_GROUP_NAME are required",
      });
    }

    const now = new Date();

    const insertData = {
      QOUTATION_CLIENT_ID,
      QOUTATION_TOTAL_PAX:
        QOUTATION_TOTAL_PAX !== undefined ? QOUTATION_TOTAL_PAX : null,
      QOUTATION_TRANSPORTATION_COMPANY_ID:
        QOUTATION_TRANSPORTATION_COMPANY_ID !== undefined
          ? QOUTATION_TRANSPORTATION_COMPANY_ID
          : null,
      QOUTATION_GROUP_NAME,
      QOUTATION_ARRIVING_DATE:
        QOUTATION_ARRIVING_DATE !== undefined ? QOUTATION_ARRIVING_DATE : null,
      QOUTATION_DEPARTURING_DATE:
        QOUTATION_DEPARTURING_DATE !== undefined
          ? QOUTATION_DEPARTURING_DATE
          : null,
      ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
      CREATED_BY: userFromToken.USER_ID,
      CREATED_ON: now,
      UPDATED_BY: userFromToken.USER_ID,
      UPDATED_ON: now,
      // COMPANY_ID will be injected by dbService.insert using companyId param
    };

    const result = await dbService.insert(
      QOUTATIONS_TABLE,
      insertData,
      companyId,
    );

    const QOUTATION_ID = result.insertId;

    // RESPONSE DATA FROM VIEW
    const rows = await dbService.find(
      {
        table: QOUTATIONS_VIEW,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId,
    );

    const createdQoutation = rows[0] || null;

    // Compute STAY_INFO -> STAY_BASIC_INFO based on arriving/departuring dates
    let stayBasicInfo = null;
    if (createdQoutation) {
      stayBasicInfo = calculateStayBasicInfo(
        createdQoutation.QOUTATION_ARRIVING_DATE,
        createdQoutation.QOUTATION_DEPARTURING_DATE,
      );
    } else if (req.body) {
      // Fallback: use body if for some reason view row is missing
      stayBasicInfo = calculateStayBasicInfo(
        req.body.QOUTATION_ARRIVING_DATE,
        req.body.QOUTATION_DEPARTURING_DATE,
      );
    }

    const responseBody = {
      message: "Qoutation created",
      QOUTATION: createdQoutation,
    };

    if (stayBasicInfo) {
      responseBody.STAY_INFO = {
        STAY_BASIC_INFO: stayBasicInfo,
      };
    }

    return res.status(201).json(responseBody);
  } catch (err) {
    console.error("createQoutation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/qoutations/:QOUTATION_ID
 *
 * BODY (any subset):
 * {
 *   "QOUTATION_CLIENT_ID": ...,
 *   "QOUTATION_TOTAL_PAX": ...,
 *   "QOUTATION_TRANSPORTATION_COMPANY_ID": ...,
 *   "QOUTATION_GROUP_NAME": "...",
 *   "QOUTATION_ARRIVING_DATE": "...",
 *   "QOUTATION_DEPARTURING_DATE": "...",
 *   "ACTIVE_STATUS": 0/1
 * }
 *
 * RESPONSE: updated row FROM VIEW.
 */
async function updateQoutation(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const QOUTATION_ID = parseInt(req.params.QOUTATION_ID, 10);
    if (!QOUTATION_ID || Number.isNaN(QOUTATION_ID)) {
      return res.status(400).json({ message: "Invalid QOUTATION_ID" });
    }

    // Ensure row exists for this company (table is fine, no response)
    const existing = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId,
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    const {
      QOUTATION_CLIENT_ID,
      QOUTATION_TOTAL_PAX,
      QOUTATION_TRANSPORTATION_COMPANY_ID,
      QOUTATION_GROUP_NAME,
      QOUTATION_ARRIVING_DATE,
      QOUTATION_DEPARTURING_DATE,
      ACTIVE_STATUS,
    } = req.body;

    const updateData = {};

    if (QOUTATION_CLIENT_ID !== undefined) {
      updateData.QOUTATION_CLIENT_ID = QOUTATION_CLIENT_ID;
    }
    if (QOUTATION_TOTAL_PAX !== undefined) {
      updateData.QOUTATION_TOTAL_PAX = QOUTATION_TOTAL_PAX;
    }
    if (QOUTATION_TRANSPORTATION_COMPANY_ID !== undefined) {
      updateData.QOUTATION_TRANSPORTATION_COMPANY_ID =
        QOUTATION_TRANSPORTATION_COMPANY_ID;
    }
    if (QOUTATION_GROUP_NAME !== undefined) {
      updateData.QOUTATION_GROUP_NAME = QOUTATION_GROUP_NAME;
    }
    if (QOUTATION_ARRIVING_DATE !== undefined) {
      updateData.QOUTATION_ARRIVING_DATE = QOUTATION_ARRIVING_DATE;
    }
    if (QOUTATION_DEPARTURING_DATE !== undefined) {
      updateData.QOUTATION_DEPARTURING_DATE = QOUTATION_DEPARTURING_DATE;
    }
    if (ACTIVE_STATUS !== undefined) {
      updateData.ACTIVE_STATUS = ACTIVE_STATUS;
    }

    const now = new Date();
    updateData.UPDATED_BY = userFromToken.USER_ID;
    updateData.UPDATED_ON = now;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    await dbService.update(
      QOUTATIONS_TABLE,
      updateData,
      { QOUTATION_ID },
      companyId,
    );

    // RESPONSE DATA FROM VIEW
    const updated = await dbService.find(
      {
        table: QOUTATIONS_VIEW,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId,
    );

    return res.json({
      message: "Qoutation updated",
      QOUTATION: updated[0] || null,
    });
  } catch (err) {
    console.error("updateQoutation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/qoutations/:QOUTATION_ID
 *
 * Soft delete: ACTIVE_STATUS = 0
 * (No need to return data; only a message.)
 */
async function deleteQoutation(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const userFromToken = req.user;
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const QOUTATION_ID = parseInt(req.params.QOUTATION_ID, 10);
    if (!QOUTATION_ID || Number.isNaN(QOUTATION_ID)) {
      return res.status(400).json({ message: "Invalid QOUTATION_ID" });
    }

    const existing = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId,
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    const now = new Date();

    await dbService.update(
      QOUTATIONS_TABLE,
      {
        ACTIVE_STATUS: 0,
        UPDATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
      },
      { QOUTATION_ID },
      companyId,
    );

    return res.json({ message: "Qoutation deleted (soft)" });
  } catch (err) {
    console.error("deleteQoutation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// helper – you can move this to a shared utils file if you like
function ceilIfNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.ceil(num);
}

// GET /api/qoutations/:QOUTATION_ID/details
async function getQuotationDetails(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const QOUTATION_ID = parseInt(req.params.QOUTATION_ID, 10);
    if (!QOUTATION_ID || Number.isNaN(QOUTATION_ID)) {
      return res.status(400).json({ message: "Invalid QOUTATION_ID" });
    }

    // 1) Main quotation row
    const quotations = await dbService.find(
      {
        table: QOUTATIONS_VIEW,
        where: { QOUTATION_ID },
        limit: 1,
      },
      companyId,
    );

    if (!quotations.length) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const quotation = quotations[0];

    // 2) Routes (days + transportation)
    const routes = await dbService.find(
      {
        table: ROUTES_VIEW,
        where: { QOUTATION_ID },
        orderBy: "ROUTE_DATE ASC, QOUTATION_ROUTE_ID ASC",
      },
      companyId,
    );

    const routeIds = routes.map((r) => r.QOUTATION_ROUTE_ID); // currently unused, but fine

    // 3) Places attached to quotation routes
    const places = await dbService.find(
      {
        table: PLACES_VIEW,
        where: { QOUTATION_ID },
        orderBy: "ROUTE_ID ASC, QOUTATION_PLACE_ID ASC",
      },
      companyId,
    );

    const originalPlaceIds = [
      ...new Set(
        places
          .map((p) => p.ORIGINAL_PLACE_ID)
          .filter((id) => id !== null && id !== undefined),
      ),
    ];

    // 4) Place descriptions from COE_TBL_PLACES
    let placeDetailsById = {};
    if (originalPlaceIds.length > 0) {
      const [placeRows] = await pool.query(
        `
        SELECT
          PLACE_ID,
          PLACE_NAME,
          PLACE_AREA_ID,
          PLACE_DESCRIPTION,
          COMPANY_ID,
          CREATED_ON,
          CREATED_BY,
          UPDATED_ON,
          UPDATED_BY
        FROM ${PLACES_TABLE}
        WHERE PLACE_ID IN (?)
          AND COMPANY_ID = ?
      `,
        [originalPlaceIds, companyId],
      );

      placeRows.forEach((row) => {
        placeDetailsById[row.PLACE_ID] = row;
      });
    }

    // 5) One image per place from COE_TBL_PLACES_IMAGES
    let placeImageByPlaceId = {};
    if (originalPlaceIds.length > 0) {
      const [imageRows] = await pool.query(
        `
        SELECT
          PLACE_IMAGE_ID,
          PLACE_IMAGE_ATTACHMENT_ID,
          PLACE_IMAGE_PLACE_ID,
          COMPANY_ID,
          CREATED_ON,
          CREATED_BY,
          UPDATED_ON,
          UPDATED_BY
        FROM ${PLACES_IMAGES_TABLE}
        WHERE PLACE_IMAGE_PLACE_ID IN (?)
          AND COMPANY_ID = ?
        ORDER BY PLACE_IMAGE_PLACE_ID ASC, CREATED_ON ASC, PLACE_IMAGE_ID ASC
      `,
        [originalPlaceIds, companyId],
      );

      // Pick the first image per PLACE_ID
      for (const row of imageRows) {
        if (!placeImageByPlaceId[row.PLACE_IMAGE_PLACE_ID]) {
          placeImageByPlaceId[row.PLACE_IMAGE_PLACE_ID] = row;
        }
      }
    }

    // 6) Stay options (accommodation)
    const stayOptions = await dbService.find(
      {
        table: ACCOM_OPTIONS_VIEW,
        where: { QOUTATION_ID },
        orderBy: "OPTION_ID ASC, HOTEL_NAME ASC, RATE_ID ASC",
      },
      companyId,
    );

    // 7) Extra services
    const extraServices = await dbService.find(
      {
        table: EXTRA_SERVICES_VIEW,
        where: { QOUTATION_ID },
        orderBy: "QOUTATION_EXTRA_SERVICE_ID ASC",
      },
      companyId,
    );

    // 8) Meals (attach to routes by ROUTE_ID)
    const meals = await dbService.find(
      {
        table: MEALS_VIEW,
        where: { QOUTATION_ID },
        orderBy: "ROUTE_ID ASC, QOUTATION_MEAL_ID ASC",
      },
      companyId,
    );

    const mealsByRouteId = {};
    for (const meal of meals) {
      if (!mealsByRouteId[meal.ROUTE_ID]) {
        mealsByRouteId[meal.ROUTE_ID] = [];
      }
      mealsByRouteId[meal.ROUTE_ID].push(meal);
    }

    // 9) Build routes map with nested PLACES + MEALS
    const routesMap = new Map();
    for (const r of routes) {
      routesMap.set(r.QOUTATION_ROUTE_ID, {
        ...r,
        PLACES: [],
        MEALS: mealsByRouteId[r.QOUTATION_ROUTE_ID] || [],
      });
    }

    // Attach places to their routes + add description & image
    for (const p of places) {
      const route = routesMap.get(p.ROUTE_ID);
      if (!route) continue;

      const placeDetail =
        p.ORIGINAL_PLACE_ID != null
          ? placeDetailsById[p.ORIGINAL_PLACE_ID] || null
          : null;

      const placeImage =
        p.ORIGINAL_PLACE_ID != null
          ? placeImageByPlaceId[p.ORIGINAL_PLACE_ID] || null
          : null;

      route.PLACES.push({
        ...p,
        PLACE_DETAILS: placeDetail,
        PLACE_IMAGE: placeImage,
      });
    }

    const routesWithNested = Array.from(routesMap.values());

    // 10) Cost calculations (per person & per group)
    const totalPax = Number(quotation.QOUTATION_TOTAL_PAX) || 0;

    // --- Transportation (group sum, then per person) ---
    let totalTransportationGroup = 0;
    for (const route of routesWithNested) {
      const amount = parseFloat(route.TRANSPORTATION_AMOUNT || 0);
      if (!Number.isNaN(amount)) {
        totalTransportationGroup += amount;
      }
    }
    const transportationPerPerson =
      totalPax > 0 ? totalTransportationGroup / totalPax : 0;

    // --- Entrance fees (per person sums) ---
    let totalEntranceFeesPerPerson = 0;
    for (const route of routesWithNested) {
      for (const place of route.PLACES || []) {
        const fee = parseFloat(place.ENTRANCE_FEES_PP || 0);
        if (!Number.isNaN(fee)) {
          totalEntranceFeesPerPerson += fee;
        }
      }
    }
    const totalEntranceFeesGroup =
      totalEntranceFeesPerPerson * (totalPax > 0 ? totalPax : 0);

    // --- Guide cost (group → per person) ---
    let totalGuideGroup = 0;
    for (const route of routesWithNested) {
      for (const place of route.PLACES || []) {
        const guideCost = parseFloat(place.GUIDE_COST || 0);
        if (!Number.isNaN(guideCost)) {
          totalGuideGroup += guideCost;
        }
      }
    }
    const guidePerPerson = totalPax > 0 ? totalGuideGroup / totalPax : 0;

    // --- Meals (TOTAL_AMOUNT_PP is per person) ---
    let totalMealsPerPerson = 0;
    for (const route of routesWithNested) {
      for (const meal of route.MEALS || []) {
        const mealAmount = parseFloat(meal.TOTAL_AMOUNT_PP || 0);
        if (!Number.isNaN(mealAmount)) {
          totalMealsPerPerson += mealAmount;
        }
      }
    }
    const totalMealsGroup = totalMealsPerPerson * (totalPax > 0 ? totalPax : 0);

    // --- Extra services (EXTRA_SERVICE_COST_PP is per person) ---
    let extraServicesPerPerson = 0;
    for (const service of extraServices) {
      const cost = parseFloat(service.EXTRA_SERVICE_COST_PP || 0);
      if (!Number.isNaN(cost)) {
        extraServicesPerPerson += cost;
      }
    }
    const extraServicesGroup =
      extraServicesPerPerson * (totalPax > 0 ? totalPax : 0);

    // --- Accommodation per option ---
    const optionTotals = {};
    for (const stay of stayOptions) {
      const optionId = stay.OPTION_ID;

      if (!optionTotals[optionId]) {
        optionTotals[optionId] = {
          OPTION_ID: optionId,
          OPTION_NAME: stay.OPTION_NAME,
          SORT_ORDER: stay.SORT_ORDER,
          HOTEL_NAME: stay.HOTEL_NAME,
          totals: {
            bb_group: 0,
            hb_extra_group: 0,
            fb_extra_group: 0,
            single_supplement_group: 0,
          },
        };
      }

      const nights = Number(stay.NIGHTS) || 0;
      const guests = Number(stay.GUESTS) || 0;
      const multiplier = nights * guests;

      const baseRate = parseFloat(stay.RATE_AMOUNT || 0);
      const hbRate = parseFloat(stay.RATE_HALF_BOARD_AMOUNT || 0);
      const fbRate = parseFloat(stay.RATE_FULL_BOARD_AMOUNT || 0);
      const ssRate = parseFloat(stay.RATE_SINGLE_SPPLIMENT_AMOUNT || 0);

      if (!Number.isNaN(baseRate)) {
        optionTotals[optionId].totals.bb_group += baseRate * multiplier;
      }
      if (!Number.isNaN(hbRate)) {
        optionTotals[optionId].totals.hb_extra_group += hbRate * multiplier;
      }
      if (!Number.isNaN(fbRate)) {
        optionTotals[optionId].totals.fb_extra_group += fbRate * multiplier;
      }
      if (!Number.isNaN(ssRate)) {
        optionTotals[optionId].totals.single_supplement_group +=
          ssRate * multiplier;
      }
    }

    // These aggregated values are **per person** (as per your validation),
    // then we multiply by totalPax to get per-group, and round everything up.
    const optionCosts = Object.values(optionTotals).map((opt) => {
      const bbPerPersonRaw = opt.totals.bb_group;
      const hbPerPersonRaw = opt.totals.bb_group + opt.totals.hb_extra_group;
      const fbPerPersonRaw =
        opt.totals.bb_group +
        opt.totals.hb_extra_group +
        opt.totals.fb_extra_group;
      const singleSuppPerPersonRaw = opt.totals.single_supplement_group;

      const bbGroupRaw = totalPax > 0 ? bbPerPersonRaw * totalPax : 0;
      const hbGroupRaw = totalPax > 0 ? hbPerPersonRaw * totalPax : 0;
      const fbGroupRaw = totalPax > 0 ? fbPerPersonRaw * totalPax : 0;
      const singleSuppGroupRaw =
        totalPax > 0 ? singleSuppPerPersonRaw * totalPax : 0;

      return {
        OPTION_ID: opt.OPTION_ID,
        OPTION_NAME: opt.OPTION_NAME,
        SORT_ORDER: opt.SORT_ORDER,
        HOTEL_NAME: opt.HOTEL_NAME,

        PER_PERSON: {
          BB: ceilIfNumber(bbPerPersonRaw),
          HALF_BOARD: ceilIfNumber(hbPerPersonRaw),
          FULL_BOARD: ceilIfNumber(fbPerPersonRaw),
          SINGLE_SUPPLEMENT: ceilIfNumber(singleSuppPerPersonRaw),
        },
        PER_GROUP: {
          BB: ceilIfNumber(bbGroupRaw),
          HALF_BOARD: ceilIfNumber(hbGroupRaw),
          FULL_BOARD: ceilIfNumber(fbGroupRaw),
          SINGLE_SUPPLEMENT: ceilIfNumber(singleSuppGroupRaw),
        },
      };
    });

    // --- Final rounded costs (without accommodation) ---
    const costPerPerson = {
      TRANSPORTATION: ceilIfNumber(transportationPerPerson),
      ENTRANCE_FEES: ceilIfNumber(totalEntranceFeesPerPerson),
      GUIDE: ceilIfNumber(guidePerPerson),
      MEALS: ceilIfNumber(totalMealsPerPerson),
      EXTRA_SERVICES: ceilIfNumber(extraServicesPerPerson),
    };

    costPerPerson.TOTAL_WITHOUT_ACCOMMODATION = ceilIfNumber(
      costPerPerson.TRANSPORTATION +
        costPerPerson.ENTRANCE_FEES +
        costPerPerson.GUIDE +
        costPerPerson.MEALS +
        costPerPerson.EXTRA_SERVICES,
    );

    const costPerGroup = {
      TRANSPORTATION: ceilIfNumber(totalTransportationGroup),
      ENTRANCE_FEES: ceilIfNumber(totalEntranceFeesGroup),
      GUIDE: ceilIfNumber(totalGuideGroup),
      MEALS: ceilIfNumber(totalMealsGroup),
      EXTRA_SERVICES: ceilIfNumber(extraServicesGroup),
    };

    costPerGroup.TOTAL_WITHOUT_ACCOMMODATION = ceilIfNumber(
      costPerGroup.TRANSPORTATION +
        costPerGroup.ENTRANCE_FEES +
        costPerGroup.GUIDE +
        costPerGroup.MEALS +
        costPerGroup.EXTRA_SERVICES,
    );

    // Final response
    return res.json({
      QOUTATION: quotation,
      ROUTES: routesWithNested,
      STAY_OPTIONS: stayOptions,
      EXTRA_SERVICES: extraServices,
      COSTS: {
        PER_PERSON: costPerPerson,
        PER_GROUP: costPerGroup,
        OPTIONS: optionCosts,
      },
    });
  } catch (err) {
    console.error("getQuotationDetails error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  listQoutations,
  getQoutationById,
  createQoutation,
  updateQoutation,
  deleteQoutation,
  getQuotationDetails,
};
