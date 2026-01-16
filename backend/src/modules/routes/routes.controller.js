// modules/routes/routes.controller.js
const dbService = require("../../core/dbService");
const pool = require("../../core/db");

const ROUTES_TABLE = "COE_TBL_ROUTS";
const ROUTE_PLACES_TABLE = "COE_TBL_ROUTS_PLACES";
const PLACES_TABLE = "COE_TBL_PLACES";
const PLACE_ENTRANCE_FEES_TABLE = "COE_TBL_PLACES_ENTRANCE_FEES";
const LIST_ITEMS_TABLE = "COE_TBL_LIST_ITEMS";

// Helper to get COMPANY_ID from backend (JWT user or session)
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) {
    return req.user.COMPANY_ID;
  }
  if (req.session && req.session.COMPANY_ID) {
    return req.session.COMPANY_ID;
  }
  return null;
}

/**
 * Internal helper:
 * Load routes (optionally single route) with:
 * - places (name, description, area)
 * - entrance fees (optionally filtered by nationality)
 * - nationality name from LIST_ITEMS (ITEM_NAME)
 *
 * options = { routeId?: number, countryId?: number }
 *
 * If countryId is provided and a place has no fee for that country,
 * we still return the place with a single fee object of 0,
 * and compute TOTAL_ENTRY_FEES per route.
 */
async function fetchRoutesWithPlacesAndFees(companyId, options = {}) {
  const { routeId, countryId } = options;

  const params = [];

  // Build the fee JOIN so that the COUNTRY filter is in the ON clause,
  // this keeps places even if no fee for that country.
  let feesJoin = `
    LEFT JOIN ${PLACE_ENTRANCE_FEES_TABLE} f
      ON f.PLACE_ENTRANCE_FEE_PLACE_ID = p.PLACE_ID
     AND f.COMPANY_ID = r.COMPANY_ID
  `;
  if (typeof countryId === "number") {
    feesJoin += " AND f.PLACE_ENTRANCE_FEE_COUNTRY_ID = ?";
    params.push(countryId);
  }

  let sql = `
    SELECT
      r.ROUTE_ID,
      r.ROUTE_NAME,
      r.ACTIVE_STATUS AS ROUTE_ACTIVE_STATUS,
      r.CREATED_ON AS ROUTE_CREATED_ON,
      r.CREATED_BY AS ROUTE_CREATED_BY,
      r.UPDATED_ON AS ROUTE_UPDATED_ON,
      r.UPDATED_BY AS ROUTE_UPDATED_BY,

      rp.ROUTS_PLACE_ID,
      rp.ORIGINAL_PLACE_ID,

      p.PLACE_NAME,
      p.PLACE_AREA_ID,
      p.PLACE_DESCRIPTION,

      f.PLACE_ENTRANCE_FEE_ID,
      f.PLACE_ENTRANCE_FEE_AMOUNT,
      f.PLACE_ENTRANCE_FEE_COUNTRY_ID,

      li.ITEM_NAME AS COUNTRY_NAME
    FROM ${ROUTES_TABLE} r
    LEFT JOIN ${ROUTE_PLACES_TABLE} rp
      ON rp.ROUTE_ID = r.ROUTE_ID
     AND rp.COMPANY_ID = r.COMPANY_ID
    LEFT JOIN ${PLACES_TABLE} p
      ON p.PLACE_ID = rp.ORIGINAL_PLACE_ID
     AND p.COMPANY_ID = r.COMPANY_ID
    ${feesJoin}
    LEFT JOIN ${LIST_ITEMS_TABLE} li
      ON li.LIST_ITEM_ID = f.PLACE_ENTRANCE_FEE_COUNTRY_ID
     AND li.COMPANY_ID = r.COMPANY_ID
    WHERE r.COMPANY_ID = ?
  `;

  params.push(companyId);

  if (routeId) {
    sql += " AND r.ROUTE_ID = ?";
    params.push(routeId);
  }

  sql += `
    ORDER BY
      r.ROUTE_ID ASC,
      rp.ROUTS_PLACE_ID ASC,
      f.PLACE_ENTRANCE_FEE_ID ASC
  `;

  const [rows] = await pool.query(sql, params);

  const routesMap = new Map();

  for (const row of rows) {
    // 1) Route level
    let route = routesMap.get(row.ROUTE_ID);
    if (!route) {
      route = {
        ROUTE_ID: row.ROUTE_ID,
        ROUTE_NAME: row.ROUTE_NAME,
        ACTIVE_STATUS: row.ROUTE_ACTIVE_STATUS,
        CREATED_ON: row.ROUTE_CREATED_ON,
        CREATED_BY: row.ROUTE_CREATED_BY,
        UPDATED_ON: row.ROUTE_UPDATED_ON,
        UPDATED_BY: row.ROUTE_UPDATED_BY,
        PLACES: [],
        TOTAL_ENTRY_FEES: 0, // will be recalculated below
      };
      routesMap.set(row.ROUTE_ID, route);
    }

    // If route has no places joined (empty route), skip place logic
    if (!row.ROUTS_PLACE_ID || !row.ORIGINAL_PLACE_ID) {
      continue;
    }

    // 2) Place level (within this route)
    let place = route.PLACES.find(
      (p) => p.ROUTS_PLACE_ID === row.ROUTS_PLACE_ID
    );
    if (!place) {
      place = {
        ROUTS_PLACE_ID: row.ROUTS_PLACE_ID,
        PLACE_ID: row.ORIGINAL_PLACE_ID,
        PLACE_NAME: row.PLACE_NAME,
        PLACE_AREA_ID: row.PLACE_AREA_ID,
        PLACE_DESCRIPTION: row.PLACE_DESCRIPTION,
        ENTRANCE_FEES: [],
      };
      route.PLACES.push(place);
    }

    // 3) Entrance fee level (within this place) – only push actual fees
    if (row.PLACE_ENTRANCE_FEE_ID) {
      place.ENTRANCE_FEES.push({
        PLACE_ENTRANCE_FEE_ID: row.PLACE_ENTRANCE_FEE_ID,
        PLACE_ENTRANCE_FEE_AMOUNT: row.PLACE_ENTRANCE_FEE_AMOUNT,
        PLACE_ENTRANCE_FEE_COUNTRY_ID: row.PLACE_ENTRANCE_FEE_COUNTRY_ID,
        COUNTRY_NAME: row.COUNTRY_NAME,
      });
    }
  }

  // 4) After building routes → places → fees:
  //    - ensure zero-fee for places with no fee for selected country
  //    - compute TOTAL_ENTRY_FEES for each route
  for (const route of routesMap.values()) {
    let routeTotal = 0;

    for (const place of route.PLACES) {
      // If a country is selected and no fees found for this place → add a zero-fee row
    if (
  typeof countryId === "number" &&
  (!place.ENTRANCE_FEES || place.ENTRANCE_FEES.length === 0)
) {
  place.ENTRANCE_FEES = [
    {
      PLACE_ENTRANCE_FEE_ID: null,
      PLACE_ENTRANCE_FEE_AMOUNT: 0,
      PLACE_ENTRANCE_FEE_COUNTRY_ID: countryId,
      COUNTRY_NAME: null,
      NO_ENTRANCE_FEE_FOUND: true,
      MESSAGE:
        "No entrance fee configured for this place for the selected country; using 0 as default.",
    },
  ];
}


      // Sum all fees of this place into routeTotal
      if (place.ENTRANCE_FEES && place.ENTRANCE_FEES.length > 0) {
        for (const fee of place.ENTRANCE_FEES) {
          const amount = Number(fee.PLACE_ENTRANCE_FEE_AMOUNT) || 0;
          routeTotal += amount;
        }
      }
    }

    route.TOTAL_ENTRY_FEES = routeTotal;
  }

  return Array.from(routesMap.values());
}

/**
 * POST /api/routes
 *
 * BODY example:
 * {
 *   "ROUTE_NAME": "Amman City Tour",
 *   "ACTIVE_STATUS": 1,
 *   "PLACES": [
 *     10,
 *     11,
 *     { "ORIGINAL_PLACE_ID": 12 }
 *   ]
 * }
 *
 * Creates:
 * - 1 row in COE_TBL_ROUTS
 * - N rows in COE_TBL_ROUTS_PLACES
 */
async function createRoute(req, res) {
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

    const { ROUTE_NAME, ACTIVE_STATUS, PLACES } = req.body;

    if (!ROUTE_NAME) {
      return res.status(400).json({ message: "ROUTE_NAME is required" });
    }

    const placeIds = normalizePlaceIds(PLACES);

    if (Array.isArray(PLACES) && PLACES.length > 0 && placeIds.length === 0) {
      return res.status(400).json({
        message:
          "PLACES must be an array of numbers or objects with ORIGINAL_PLACE_ID",
      });
    }

    const now = new Date();

    // 1) Insert route
    const routeResult = await dbService.insert(
      ROUTES_TABLE,
      {
        ROUTE_NAME,
        ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
        CREATED_ON: now,
        CREATED_BY: userFromToken.USER_ID,
      },
      companyId
    );

    const ROUTE_ID = routeResult.insertId;

    // 2) Insert route places (if any)
    const createdPlaces = [];

    if (placeIds.length > 0) {
      for (const placeId of placeIds) {
        const placeInsertResult = await dbService.insert(
          ROUTE_PLACES_TABLE,
          {
            ORIGINAL_PLACE_ID: placeId,
            ROUTE_ID,
            ACTIVE_STATUS: 1,
            CREATED_ON: now,
            CREATED_BY: userFromToken.USER_ID,
          },
          companyId
        );

        createdPlaces.push({
          ROUTS_PLACE_ID: placeInsertResult.insertId,
          ORIGINAL_PLACE_ID: placeId,
        });
      }
    }

    return res.status(201).json({
      message: "Route created",
      ROUTE_ID,
      ROUTE_NAME,
      ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
      PLACES: createdPlaces,
    });
  } catch (err) {
    console.error("createRoute error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/routes
 *
 * Optional query:
 *   ?COUNTRY_ID=123
 *      OR
 *   ?PLACE_ENTRANCE_FEE_COUNTRY_ID=123
 *
 * This will filter entrance fees by nationality (country_id).
 * Response structure:
 * [
 *   {
 *     ROUTE_ID,
 *     ROUTE_NAME,
 *     ...,
 *     PLACES: [
 *       {
 *         ROUTS_PLACE_ID,
 *         PLACE_ID,
 *         PLACE_NAME,
 *         PLACE_AREA_ID,
 *         PLACE_DESCRIPTION,
 *         ENTRANCE_FEES: [
 *           {
 *             PLACE_ENTRANCE_FEE_ID,
 *             PLACE_ENTRANCE_FEE_AMOUNT,
 *             PLACE_ENTRANCE_FEE_COUNTRY_ID,
 *             COUNTRY_NAME
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 */
/**
 * GET /api/routes
 *
 * Optional query:
 *   ?COUNTRY_ID=123
 *      OR
 *   ?PLACE_ENTRANCE_FEE_COUNTRY_ID=123
 *
 * Filter entrance fees by nationality (country_id).
 * If a place has no fee for that country, it will have a 0 fee,
 * and each route will have TOTAL_ENTRY_FEES.
 */
async function listRoutes(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const rawCountry =
      req.query.PLACE_ENTRANCE_FEE_COUNTRY_ID ?? req.query.COUNTRY_ID;

    let countryId = undefined;
    if (rawCountry !== undefined) {
      const parsed = parseInt(rawCountry, 10);
      if (!parsed || Number.isNaN(parsed)) {
        return res
          .status(400)
          .json({ message: "COUNTRY_ID must be a valid number" });
      }
      countryId = parsed;
    }

    const routes = await fetchRoutesWithPlacesAndFees(companyId, {
      countryId,
    });

    return res.json(routes);
  } catch (err) {
    console.error("listRoutes error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/routes/:ROUTE_ID
 *
 * Same structure as listRoutes but for a single route.
 * Supports the same COUNTRY_ID / PLACE_ENTRANCE_FEE_COUNTRY_ID filter.
 */
/**
 * GET /api/routes/:ROUTE_ID
 *
 * Same structure as listRoutes but for a single route.
 * Supports COUNTRY_ID / PLACE_ENTRANCE_FEE_COUNTRY_ID.
 */
async function getRouteById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const ROUTE_ID = parseInt(req.params.ROUTE_ID, 10);
    if (!ROUTE_ID || Number.isNaN(ROUTE_ID)) {
      return res.status(400).json({ message: "Invalid ROUTE_ID" });
    }

    const rawCountry =
      req.query.PLACE_ENTRANCE_FEE_COUNTRY_ID ?? req.query.COUNTRY_ID;

    let countryId = undefined;
    if (rawCountry !== undefined) {
      const parsed = parseInt(rawCountry, 10);
      if (!parsed || Number.isNaN(parsed)) {
        return res
          .status(400)
          .json({ message: "COUNTRY_ID must be a valid number" });
      }
      countryId = parsed;
    }

    const routes = await fetchRoutesWithPlacesAndFees(companyId, {
      routeId: ROUTE_ID,
      countryId,
    });

    if (routes.length === 0) {
      return res.status(404).json({ message: "Route not found" });
    }

    // routes[0] already has PLACES + ENTRANCE_FEES (with zeros if needed)
    // and TOTAL_ENTRY_FEES calculated
    return res.json(routes[0]);
  } catch (err) {
    console.error("getRouteById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createRoute,
  listRoutes,
  getRouteById,
};
