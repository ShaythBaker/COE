// modules/qoutations/qoutations.step1.controller.js
const dbService = require("../../core/dbService");

const QOUTATIONS_TABLE = "COE_TBL_QOUTATIONS";
const CLIENTS_TABLE = "COE_TBL_CLIENTS";
const TRANSPORTATION_FEES_VIEW = "COE_VIEW_TRANSPORTATION_FEES_LOOKUP";

const QOUTATION_ROUTES_TABLE = "COE_TBL_QOUTATION_ROUTES";
const QOUTATION_PLACES_TABLE = "COE_TBL_QOUTATION_PLACES";
const QOUTATION_MEALS_TABLE = "COE_TBL_QOUTATION_MEALS";
const QOUTATION_EXTRA_SERVICES_TABLE = "COE_TBL_QOUTATION_EXTRA_SERVICES";

const QOUTATION_ROUTES_VIEW = "COE_VIEW_QOUTATION_ROUTES_LOOKUP";
const QOUTATION_PLACES_VIEW = "COE_VIEW_QOUTATION_PLACES_LOOKUP";
const QOUTATION_MEALS_VIEW = "COE_VIEW_QOUTATION_MEALS_LOOKUP";
const QOUTATION_EXTRA_SERVICES_VIEW =
  "COE_VIEW_QOUTATION_EXTRA_SERVICES_LOOKUP";

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

// Helper to normalize route date from "DD-MM-YYYY" or "YYYY-MM-DD" to "YYYY-MM-DD"
function normalizeRouteDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }

  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    return dateStr;
  }

  // If already YYYY-MM-DD
  if (parts[0].length === 4) {
    return dateStr;
  }

  // Assume DD-MM-YYYY -> convert to YYYY-MM-DD
  if (parts[2].length === 4) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }

  return dateStr;
}

// Internal helper: call /api/routes?COUNTRY_ID=...
async function fetchRoutesForCountry(req, countryId) {
  try {
    if (typeof fetch !== "function") {
      console.warn(
        "fetch is not available in this Node version; cannot load routes"
      );
      return [];
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = new URL("/api/routes", baseUrl);
    url.searchParams.set("COUNTRY_ID", countryId);

    const headers = {};
    if (req.headers["authorization"]) {
      headers["authorization"] = req.headers["authorization"];
    }
    if (req.headers["cookie"]) {
      headers["cookie"] = req.headers["cookie"];
    }

    const resp = await fetch(url.toString(), { headers });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("Failed to fetch routes:", resp.status, text);
      return [];
    }

    const data = await resp.json();
    if (!Array.isArray(data)) {
      return [];
    }

    // Clean up the response: remove PLACE_DESCRIPTION, UPDATED_BY, UPDATED_ON, CREATED_BY
    return data.map((route) => {
      const { UPDATED_BY, UPDATED_ON, CREATED_BY, ...routeRest } = route;

      const places = Array.isArray(route.PLACES)
        ? route.PLACES.map((place) => {
            const {
              PLACE_DESCRIPTION,
              UPDATED_BY,
              UPDATED_ON,
              CREATED_BY,
              ...placeRest
            } = place;

            return {
              ...placeRest,
              ENTRANCE_FEES: Array.isArray(place.ENTRANCE_FEES)
                ? place.ENTRANCE_FEES.map((fee) => {
                    const { UPDATED_BY, UPDATED_ON, CREATED_BY, ...feeRest } =
                      fee;
                    return feeRest;
                  })
                : [],
            };
          })
        : [];

      return {
        ...routeRest,
        PLACES: places,
      };
    });
  } catch (err) {
    console.error("fetchRoutesForCountry error:", err);
    return [];
  }
}

/**
 * GET /api/qoutations/:QOUTATION_ID/step1
 *
 * - Loads base qoutation info from COE_TBL_QOUTATIONS
 * - Calculates NUMBER_OF_DAYS / NUMBER_OF_NIGHTS
 * - Loads client from COE_TBL_CLIENTS to get COUNTRY_ID
 * - Calls internal /api/routes?COUNTRY_ID=... to get routes + entrance fees
 * - Loads transportation fees for QOUTATION_TRANSPORTATION_COMPANY_ID
 */
async function getQoutationStep1(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const { QOUTATION_ID } = req.params;
    const qoutationIdNum = Number(QOUTATION_ID);
    if (!qoutationIdNum) {
      return res
        .status(400)
        .json({ message: "QOUTATION_ID must be a valid number" });
    }

    // 1) Load base qoutation data from COE_TBL_QOUTATIONS
    const qoutations = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: {
          QOUTATION_ID: qoutationIdNum,
          ACTIVE_STATUS: 1,
        },
        fields: [
          "QOUTATION_ID",
          "QOUTATION_CLIENT_ID",
          "QOUTATION_TOTAL_PAX",
          "QOUTATION_TRANSPORTATION_COMPANY_ID",
          "QOUTATION_GROUP_NAME",
          "QOUTATION_ARRIVING_DATE",
          "QOUTATION_DEPARTURING_DATE",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "ACTIVE_STATUS",
        ],
        limit: 1,
      },
      companyId
    );

    if (!qoutations || qoutations.length === 0) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    const q = qoutations[0];

    // 2) Calculate stay basic info (days/nights)
    const stayBasicInfo = calculateStayBasicInfo(
      q.QOUTATION_ARRIVING_DATE,
      q.QOUTATION_DEPARTURING_DATE
    );

    // 3) Get client COUNTRY_ID from COE_TBL_CLIENTS, then fetch routes
    let routes = [];
    if (q.QOUTATION_CLIENT_ID) {
      const clients = await dbService.find(
        {
          table: CLIENTS_TABLE,
          where: {
            CLIENT_ID: q.QOUTATION_CLIENT_ID,
            ACTIVE_STATUS: 1,
          },
          fields: [
            "CLIENT_ID",
            "CLIENT_NAME",
            "COUNTRY_ID",
            "EMAIL",
            "PHONE",
            "CLIENT_LOGO",
            "CONTACT_PERSON_NAME",
            "ACTIVE_STATUS",
            "COMPANY_ID",
            "CREATED_BY",
            "CREATED_ON",
            "UPDATED_BY",
            "UPDATED_ON",
          ],
          limit: 1,
        },
        companyId
      );

      if (clients && clients.length > 0) {
        const client = clients[0];
        const countryId = client.COUNTRY_ID;
        if (countryId) {
          routes = await fetchRoutesForCountry(req, countryId);
        }
      }
    }

    // 4) Get transportation fees for this quotation's transportation company
    let transportation = [];
    if (q.QOUTATION_TRANSPORTATION_COMPANY_ID) {
      const fees = await dbService.find(
        {
          table: TRANSPORTATION_FEES_VIEW,
          where: {
            TRANSPORTATION_FEE_COMPANY_ID:
              q.QOUTATION_TRANSPORTATION_COMPANY_ID,
            ACTIVE_STATSUS: 1, // note: column name from view
          },
          fields: [
            "TRANSPORTATION_FEE_ID",
            "TRANSPORTATION_FEE_COMPANY_ID",
            "TRANSPORTATION_COMPANY_NAME",
            "TRANSPORTATION_FEE_VECHLE_TYPE",
            "VEHICLE_TYPE_NAME",
            "TRANSPORTATION_FEE_TYPE",
            "TRANSPORTATION_FEE_TYPE_NAME",
            "TRANSPORTATION_FEE_AMOUNT",
            "COMPANY_ID",
            "CREATED_ON",
            "CREATED_BY",
            "UPDATED_ON",
            "UPDATED_BY",
            "ACTIVE_STATSUS",
          ],
          orderBy: "TRANSPORTATION_FEE_TYPE_NAME ASC, VEHICLE_TYPE_NAME ASC",
        },
        companyId
      );

      if (fees && fees.length > 0) {
        const grouped = {};

        for (const fee of fees) {
          const key =
            String(fee.TRANSPORTATION_FEE_TYPE) +
            "|" +
            String(fee.TRANSPORTATION_FEE_TYPE_NAME || "");

          if (!grouped[key]) {
            grouped[key] = {
              TRANSPORTATION_FEE_TYPE: fee.TRANSPORTATION_FEE_TYPE,
              TRANSPORTATION_FEE_TYPE_NAME: fee.TRANSPORTATION_FEE_TYPE_NAME,
              OPTIONS: [],
            };
          }

          grouped[key].OPTIONS.push({
            TRANSPORTATION_FEE_VECHLE_TYPE: fee.TRANSPORTATION_FEE_VECHLE_TYPE,
            VEHICLE_TYPE_NAME: fee.VEHICLE_TYPE_NAME,
            TRANSPORTATION_FEE_AMOUNT: fee.TRANSPORTATION_FEE_AMOUNT,
          });
        }

        transportation = Object.values(grouped);
      }
    }

    const responseBody = {
      QOUTATION: {
        QOUTATION_ID: q.QOUTATION_ID,
        QOUTATION_CLIENT_ID: q.QOUTATION_CLIENT_ID,
        QOUTATION_TOTAL_PAX: q.QOUTATION_TOTAL_PAX,
        QOUTATION_TRANSPORTATION_COMPANY_ID:
          q.QOUTATION_TRANSPORTATION_COMPANY_ID,
        QOUTATION_GROUP_NAME: q.QOUTATION_GROUP_NAME,
        QOUTATION_ARRIVING_DATE: q.QOUTATION_ARRIVING_DATE,
        QOUTATION_DEPARTURING_DATE: q.QOUTATION_DEPARTURING_DATE,
      },
      ROUTS: routes,
      TRANSPORTATION: transportation,
    };

    if (stayBasicInfo) {
      responseBody.STAY_INFO = {
        STAY_BASIC_INFO: stayBasicInfo,
      };
    }

    return res.json(responseBody);
  } catch (err) {
    console.error("getQoutationStep1 error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/qoutations/step1
 *
 * Saves / replaces Step 1 details for a quotation:
 * - ROUTS -> COE_TBL_QOUTATION_ROUTES
 * - PLACES -> COE_TBL_QOUTATION_PLACES
 * - MEALS -> COE_TBL_QOUTATION_MEALS
 * - EXTRA_SERVICES -> COE_TBL_QOUTATION_EXTRA_SERVICES
 *
 * Expected payload:
 * {
 *   "QOUTATION_ID": 1,
 *   "ROUTS": [
 *     {
 *       "ROUTE_DATE": "01-01-2026",
 *       "ROUTE_ID": 4,
 *       "TRANSPORTATION_TYPE_ID": 36,
 *       "TRANSPORTATION_AMOUNT": 36,
 *       "PLACES": [ ... ],
 *       "MEALS": [ ... ],
 *       "EXTRA_SERVICES": [ ... ]
 *     }
 *   ]
 * }
 */
async function saveQoutationStep1(req, res) {
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

    const { QOUTATION_ID, ROUTS } = req.body || {};
    const qoutationIdNum = Number(QOUTATION_ID);

    if (!qoutationIdNum) {
      return res
        .status(400)
        .json({ message: "QOUTATION_ID must be a valid number" });
    }

    // Ensure qoutation exists and belongs to this company
    const existingQoutations = await dbService.find(
      {
        table: QOUTATIONS_TABLE,
        where: {
          QOUTATION_ID: qoutationIdNum,
          ACTIVE_STATUS: 1,
        },
        fields: ["QOUTATION_ID", "COMPANY_ID"],
        limit: 1,
      },
      companyId
    );

    if (!existingQoutations || existingQoutations.length === 0) {
      return res.status(404).json({ message: "Qoutation not found" });
    }

    // Remove existing step-1 related details for this quotation
    await dbService.remove(
      QOUTATION_PLACES_TABLE,
      { QOUTATION_ID: qoutationIdNum },
      companyId
    );
    await dbService.remove(
      QOUTATION_MEALS_TABLE,
      { QOUTATION_ID: qoutationIdNum },
      companyId
    );
    await dbService.remove(
      QOUTATION_EXTRA_SERVICES_TABLE,
      { QOUTATION_ID: qoutationIdNum },
      companyId
    );
    await dbService.remove(
      QOUTATION_ROUTES_TABLE,
      { QOUTATION_ID: qoutationIdNum },
      companyId
    );

    const now = new Date();

    // If no routes sent, we just cleared everything
    if (!Array.isArray(ROUTS) || ROUTS.length === 0) {
      // fall through to "load from views" which will return empty ROUTS
    } else {
      // Insert everything fresh
      for (const route of ROUTS) {
        if (!route) continue;

        const routeDate = normalizeRouteDate(route.ROUTE_DATE);
        const originalRouteId = route.ROUTE_ID || route.ORIGINAL_ROUTE_ID;

        // Insert into COE_TBL_QOUTATION_ROUTES
        const routeInsertData = {
          QOUTATION_ID: qoutationIdNum,
          ROUTE_DATE: routeDate,
          ORIGINAL_ROUTE_ID: originalRouteId,
          TRANSPORTATION_TYPE_ID:
            route.TRANSPORTATION_TYPE_ID !== undefined
              ? route.TRANSPORTATION_TYPE_ID
              : null,
          TRANSPORTATION_AMOUNT:
            route.TRANSPORTATION_AMOUNT !== undefined
              ? route.TRANSPORTATION_AMOUNT
              : null,
          CREATED_BY: userFromToken.USER_ID,
          CREATED_ON: now,
          UPDATED_ON: now,
          UPDATED_BY: userFromToken.USER_ID,
        };

        const routeResult = await dbService.insert(
          QOUTATION_ROUTES_TABLE,
          routeInsertData,
          companyId
        );

        const qoutationRouteId = routeResult.insertId;

        // Insert PLACES for this route
        if (Array.isArray(route.PLACES)) {
          for (const place of route.PLACES) {
            if (!place) continue;

            const placeInsertData = {
              QOUTATION_ID: qoutationIdNum,
              ORIGINAL_PLACE_ID: place.ORIGINAL_PLACE_ID,
              ROUTE_ID: qoutationRouteId,
              ENTRANCE_FEES_PP:
                place.ENTRANCE_FEES_PP !== undefined
                  ? place.ENTRANCE_FEES_PP
                  : 0,
              // IF NOT PASSED => NO GUIDE SELECTED
              GUIDE_TYPE:
                place.GUIDE_TYPE !== undefined ? place.GUIDE_TYPE : null,
              // IF NO GUIDE SELECTED / NOT PASSED => COST IS ZERO
              GUIDE_COST: place.GUIDE_COST !== undefined ? place.GUIDE_COST : 0,
              CREATED_BY: userFromToken.USER_ID,
              UPDATED_BY: userFromToken.USER_ID,
              CREATED_ON: now,
              UPDATED_ON: now,
            };

            await dbService.insert(
              QOUTATION_PLACES_TABLE,
              placeInsertData,
              companyId
            );
          }
        }

        // Insert MEALS for this route
        if (Array.isArray(route.MEALS)) {
          for (const meal of route.MEALS) {
            if (!meal) continue;

            const mealInsertData = {
              QOUTATION_ID: qoutationIdNum,
              ROUTE_ID: qoutationRouteId,
              ORIGINAL_MEAL_ID: meal.ORIGINAL_MEAL_ID,
              RESAURANT_ID: meal.RESAURANT_ID,
              TOTAL_AMOUNT_PP:
                meal.TOTAL_AMOUNT_PP !== undefined
                  ? meal.TOTAL_AMOUNT_PP
                  : null,
              CREATED_BY: userFromToken.USER_ID,
              UPDATED_BY: userFromToken.USER_ID,
              CREATED_ON: now,
              UPDATED_ON: now,
            };

            await dbService.insert(
              QOUTATION_MEALS_TABLE,
              mealInsertData,
              companyId
            );
          }
        }

        // Insert EXTRA_SERVICES for this route
        if (Array.isArray(route.EXTRA_SERVICES)) {
          for (const extra of route.EXTRA_SERVICES) {
            if (!extra) continue;

            const extraInsertData = {
              QOUTATION_ID: qoutationIdNum,
              ROUTE_ID: qoutationRouteId,
              EXTRA_SERVICE_ID: extra.EXTRA_SERVICE_ID,
              EXTRA_SERVICE_COST_PP:
                extra.EXTRA_SERVICE_COST_PP !== undefined
                  ? extra.EXTRA_SERVICE_COST_PP
                  : null,
              CREATED_BY: userFromToken.USER_ID,
              UPDATED_BY: userFromToken.USER_ID,
              CREATED_ON: now,
              UPDATED_ON: now,
            };

            await dbService.insert(
              QOUTATION_EXTRA_SERVICES_TABLE,
              extraInsertData,
              companyId
            );
          }
        }
      }
    }

    // 🔽🔽 NEW PART: load from VIEWS and return enriched data 🔽🔽

    // Load all saved data from the lookup views
    const routesFromView = await dbService.find(
      {
        table: QOUTATION_ROUTES_VIEW,
        where: {
          QOUTATION_ID: qoutationIdNum,
        },
        fields: [
          "QOUTATION_ROUTE_ID",
          "QOUTATION_ID",
          "ROUTE_DATE",
          "ORIGINAL_ROUTE_ID",
          "ROUTE_NAME",
          "TRANSPORTATION_TYPE_ID",
          "TRANSPORTATION_TYPE_NAME",
          "TRANSPORTATION_AMOUNT",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
        ],
        orderBy: "ROUTE_DATE ASC, QOUTATION_ROUTE_ID ASC",
      },
      companyId
    );

    const placesFromView = await dbService.find(
      {
        table: QOUTATION_PLACES_VIEW,
        where: {
          QOUTATION_ID: qoutationIdNum,
        },
        fields: [
          "QOUTATION_PLACE_ID",
          "QOUTATION_ID",
          "ORIGINAL_PLACE_ID",
          "ROUTE_ID",
          "PLACE_NAME",
          "ENTRANCE_FEES_PP",
          "GUIDE_TYPE",
          "GUIDE_TYPE_NAME",
          "GUIDE_COST",
          "COMPANY_ID",
          "CREATED_BY",
          "UPDATED_BY",
          "CREATED_ON",
          "UPDATED_ON",
        ],
      },
      companyId
    );

    const mealsFromView = await dbService.find(
      {
        table: QOUTATION_MEALS_VIEW,
        where: {
          QOUTATION_ID: qoutationIdNum,
        },
        fields: [
          "QOUTATION_MEAL_ID",
          "ORIGINAL_MEAL_ID",
          "RESAURANT_ID",
          "RESTUARANT_NAME",
          "TOTAL_AMOUNT_PP",
          "ROUTE_ID",
          "QOUTATION_ID",
          "RESTAURANT_MEAL_DESCRIPTION",
          "RESTAURANT_MEAL_RATE_PP",
          "RESTAURANT_MEAL_TYPE_ID",
          "RESTAURANT_MEAL_TYPE_NAME",
          "COMPANY_ID",
          "CREATED_ON",
          "UPDATED_ON",
          "CREATED_BY",
          "UPDATED_BY",
        ],
      },
      companyId
    );

    const extraFromView = await dbService.find(
      {
        table: QOUTATION_EXTRA_SERVICES_VIEW,
        where: {
          QOUTATION_ID: qoutationIdNum,
        },
        fields: [
          "QOUTATION_EXTRA_SERVICE_ID",
          "EXTRA_SERVICE_ID",
          "EXTRA_SERVICE_NAME",
          "EXTRA_SERVICE_DESCRIPTION",
          "EXTRA_SERVICE_COST_PP",
          "QOUTATION_ID",
          "ROUTE_ID",
          "COMPANY_ID",
          "CREATED_ON",
          "UPDATED_ON",
          "CREATED_BY",
          "UPDATED_BY",
        ],
      },
      companyId
    );

    // Group children by ROUTE_ID (which = QOUTATION_ROUTE_ID)
    const placesByRoute = {};
    for (const p of placesFromView) {
      if (!placesByRoute[p.ROUTE_ID]) placesByRoute[p.ROUTE_ID] = [];
      placesByRoute[p.ROUTE_ID].push(p);
    }

 const mealsByRoute = {};
for (const m of mealsFromView) {
  const rid = m.ROUTE_ID;              // ✅ use ROUTE_ID from view
  if (!mealsByRoute[rid]) mealsByRoute[rid] = [];
  mealsByRoute[rid].push(m);
}

    const extrasByRoute = {};
    for (const e of extraFromView) {
      if (!extrasByRoute[e.ROUTE_ID]) extrasByRoute[e.ROUTE_ID] = [];
      extrasByRoute[e.ROUTE_ID].push(e);
    }

    const responseRoutes = routesFromView.map((r) => {
      const routeId = r.QOUTATION_ROUTE_ID;

      const routePlaces = (placesByRoute[routeId] || []).map((p) => ({
        QOUTATION_PLACE_ID: p.QOUTATION_PLACE_ID,
        QOUTATION_ID: p.QOUTATION_ID,
        ROUTE_ID: p.ROUTE_ID,
        ORIGINAL_PLACE_ID: p.ORIGINAL_PLACE_ID,
        PLACE_NAME: p.PLACE_NAME,
        ENTRANCE_FEES_PP: p.ENTRANCE_FEES_PP,
        GUIDE_TYPE: p.GUIDE_TYPE,
        GUIDE_TYPE_NAME: p.GUIDE_TYPE_NAME,
        GUIDE_COST: p.GUIDE_COST,
      }));

      const routeMeals = (mealsByRoute[routeId] || []).map((m) => ({
        QOUTATION_MEAL_ID: m.QOUTATION_MEAL_ID,
        QOUTATION_ID: m.QOUTATION_ID,
        ROUTE_ID: routeId,
        ORIGINAL_MEAL_ID: m.ORIGINAL_MEAL_ID,
        RESAURANT_ID: m.RESAURANT_ID,
        RESTUARANT_NAME: m.RESTUARANT_NAME,
        TOTAL_AMOUNT_PP: m.TOTAL_AMOUNT_PP,
        RESTAURANT_MEAL_DESCRIPTION: m.RESTAURANT_MEAL_DESCRIPTION,
        RESTAURANT_MEAL_RATE_PP: m.RESTAURANT_MEAL_RATE_PP,
        RESTAURANT_MEAL_TYPE_ID: m.RESTAURANT_MEAL_TYPE_ID,
        RESTAURANT_MEAL_TYPE_NAME: m.RESTAURANT_MEAL_TYPE_NAME,
      }));

      const routeExtras = (extrasByRoute[routeId] || []).map((e) => ({
        QOUTATION_EXTRA_SERVICE_ID: e.QOUTATION_EXTRA_SERVICE_ID,
        QOUTATION_ID: e.QOUTATION_ID,
        ROUTE_ID: e.ROUTE_ID,
        EXTRA_SERVICE_ID: e.EXTRA_SERVICE_ID,
        EXTRA_SERVICE_NAME: e.EXTRA_SERVICE_NAME,
        EXTRA_SERVICE_DESCRIPTION: e.EXTRA_SERVICE_DESCRIPTION,
        EXTRA_SERVICE_COST_PP: e.EXTRA_SERVICE_COST_PP,
      }));

      return {
        // keep structure compatible with POST payload, but enriched
        QOUTATION_ROUTE_ID: r.QOUTATION_ROUTE_ID,
        QOUTATION_ID: r.QOUTATION_ID,
        ROUTE_DATE: r.ROUTE_DATE,
        ROUTE_ID: r.ORIGINAL_ROUTE_ID, // same name as POST payload
        ROUTE_NAME: r.ROUTE_NAME,
        TRANSPORTATION_TYPE_ID: r.TRANSPORTATION_TYPE_ID,
        TRANSPORTATION_TYPE_NAME: r.TRANSPORTATION_TYPE_NAME,
        TRANSPORTATION_AMOUNT: r.TRANSPORTATION_AMOUNT,
        PLACES: routePlaces,
        MEALS: routeMeals,
        EXTRA_SERVICES: routeExtras,
      };
    });

    return res.json({
      message: "Step 1 data saved successfully",
      QOUTATION_ID: qoutationIdNum,
      ROUTS: responseRoutes,
    });
  } catch (err) {
    console.error("saveQoutationStep1 error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getQoutationStep1,
  saveQoutationStep1,
};
