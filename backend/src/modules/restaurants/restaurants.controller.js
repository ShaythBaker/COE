// src/modules/restaurants/restaurants.controller.js
const dbService = require("../../core/dbService");

const RESTAURANTS_TABLE = "COE_TBL_RESTAURANTS";
const RESTAURANT_MEALS_TABLE = "COE_TBL_RESTAURANT_MEALS";
const RESTAURANT_MEALS_LOOKUP_VIEW = "COE_VIEW_RESTAURANT_MEALS_LOOKUP";

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

/* ----------------------------------------------------------------------
 * RESTAURANTS CRUD
 * ------------------------------------------------------------------- */

/**
 * GET /api/restaurants
 * Dynamic filter by ANY column using query parameters.
 *
 * Example:
 *   /api/restaurants?RESTUARANT_NAME=KFC&ACTIVE_STATUS=1
 *   /api/restaurants?RESTUARANT_AREA_ID=10
 */
async function listRestaurants(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const filterableColumns = [
      "RESTUARANT_ID",
      "RESTUARANT_NAME",
      "RESTUARANT_AREA_ID",
      "COMPANY_ID",
      "RESTUARANT_LOGO_ID",
      "RESTUARANT_LOCATION",
      "RESTUARANT_STARS_RATE",
      "CREATED_BY",
      "CREATED_ON",
      "UPDATED_BY",
      "UPDATED_ON",
      "ACTIVE_STATUS",
    ];

    const numericColumns = [
      "RESTUARANT_ID",
      "RESTUARANT_AREA_ID",
      "RESTUARANT_LOGO_ID",
      "RESTUARANT_STARS_RATE",
      "CREATED_BY",
      "UPDATED_BY",
      "ACTIVE_STATUS",
      "COMPANY_ID",
    ];

    const where = {};

    for (const col of filterableColumns) {
      if (req.query[col] !== undefined && req.query[col] !== "") {
        if (numericColumns.includes(col)) {
          const numVal = Number(req.query[col]);
          if (!Number.isNaN(numVal)) {
            where[col] = numVal;
          }
        } else {
          where[col] = req.query[col];
        }
      }
    }

    const restaurants = await dbService.find(
      {
        table: RESTAURANTS_TABLE,
        where,
        fields: [
          "RESTUARANT_ID",
          "RESTUARANT_NAME",
          "RESTUARANT_AREA_ID",
          "COMPANY_ID",
          "RESTUARANT_LOGO_ID",
          "RESTUARANT_LOCATION",
          "RESTUARANT_STARS_RATE",
          "CREATED_BY",
          "CREATED_ON",
          "UPDATED_BY",
          "UPDATED_ON",
          "ACTIVE_STATUS",
        ],
        orderBy: "RESTUARANT_NAME ASC",
      },
      companyId
    );

    return res.json(restaurants);
  } catch (err) {
    console.error("listRestaurants error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/restaurants/:RESTUARANT_ID
 */
async function getRestaurantById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const RESTUARANT_ID = parseInt(req.params.RESTUARANT_ID, 10);
    if (!RESTUARANT_ID || Number.isNaN(RESTUARANT_ID)) {
      return res.status(400).json({ message: "Invalid RESTUARANT_ID" });
    }

    const rows = await dbService.find(
      {
        table: RESTAURANTS_TABLE,
        where: { RESTUARANT_ID },
        limit: 1,
      },
      companyId
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getRestaurantById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/restaurants
 * BODY:
 * {
 *   "RESTUARANT_NAME": "KFC",
 *   "RESTUARANT_AREA_ID": 10,
 *   "RESTUARANT_LOGO_ID": 123,
 *   "RESTUARANT_LOCATION": "31.9,35.8",
 *   "RESTUARANT_STARS_RATE": 4.5,
 *   "ACTIVE_STATUS": 1
 * }
 */
async function createRestaurant(req, res) {
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
      RESTUARANT_NAME,
      RESTUARANT_AREA_ID,
      RESTUARANT_LOGO_ID,
      RESTUARANT_LOCATION,
      RESTUARANT_STARS_RATE,
      ACTIVE_STATUS,
    } = req.body;

    if (!RESTUARANT_NAME) {
      return res.status(400).json({
        message: "RESTUARANT_NAME is required",
      });
    }

    const now = new Date();

    const data = {
      RESTUARANT_NAME,
      RESTUARANT_AREA_ID:
        RESTUARANT_AREA_ID !== undefined ? RESTUARANT_AREA_ID : null,
      RESTUARANT_LOGO_ID:
        RESTUARANT_LOGO_ID !== undefined ? RESTUARANT_LOGO_ID : null,
      RESTUARANT_LOCATION:
        RESTUARANT_LOCATION !== undefined ? RESTUARANT_LOCATION : null,
      RESTUARANT_STARS_RATE:
        RESTUARANT_STARS_RATE !== undefined ? RESTUARANT_STARS_RATE : null,
      ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
      CREATED_BY: userFromToken.USER_ID,
      CREATED_ON: now,
    };

    const result = await dbService.insert(
      RESTAURANTS_TABLE,
      data,
      companyId // dbService will include COMPANY_ID
    );

    return res.status(201).json({
      message: "Restaurant created",
      RESTUARANT_ID: result.insertId,
    });
  } catch (err) {
    console.error("createRestaurant error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/restaurants/:RESTUARANT_ID
 */
async function updateRestaurant(req, res) {
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

    const RESTUARANT_ID = parseInt(req.params.RESTUARANT_ID, 10);
    if (!RESTUARANT_ID || Number.isNaN(RESTUARANT_ID)) {
      return res.status(400).json({ message: "Invalid RESTUARANT_ID" });
    }

    const existingRows = await dbService.find(
      {
        table: RESTAURANTS_TABLE,
        where: { RESTUARANT_ID },
        limit: 1,
      },
      companyId
    );

    if (!existingRows.length) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const {
      RESTUARANT_NAME,
      RESTUARANT_AREA_ID,
      RESTUARANT_LOGO_ID,
      RESTUARANT_LOCATION,
      RESTUARANT_STARS_RATE,
      ACTIVE_STATUS,
    } = req.body;

    const updateData = {};
    if (RESTUARANT_NAME !== undefined) {
      updateData.RESTUARANT_NAME = RESTUARANT_NAME;
    }
    if (RESTUARANT_AREA_ID !== undefined) {
      updateData.RESTUARANT_AREA_ID = RESTUARANT_AREA_ID;
    }
    if (RESTUARANT_LOGO_ID !== undefined) {
      updateData.RESTUARANT_LOGO_ID = RESTUARANT_LOGO_ID;
    }
    if (RESTUARANT_LOCATION !== undefined) {
      updateData.RESTUARANT_LOCATION = RESTUARANT_LOCATION;
    }
    if (RESTUARANT_STARS_RATE !== undefined) {
      updateData.RESTUARANT_STARS_RATE = RESTUARANT_STARS_RATE;
    }
    if (ACTIVE_STATUS !== undefined) {
      updateData.ACTIVE_STATUS = ACTIVE_STATUS;
    }

    const now = new Date();
    updateData.UPDATED_BY = userFromToken.USER_ID;
    updateData.UPDATED_ON = now;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(
        RESTAURANTS_TABLE,
        updateData,
        { RESTUARANT_ID },
        companyId
      );
    }

    const updated = await dbService.find(
      {
        table: RESTAURANTS_TABLE,
        where: { RESTUARANT_ID },
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Restaurant updated",
      RESTUARANT: updated[0],
    });
  } catch (err) {
    console.error("updateRestaurant error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/restaurants/:RESTUARANT_ID
 * Soft delete (ACTIVE_STATUS = 0)
 */
async function deleteRestaurant(req, res) {
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

    const RESTUARANT_ID = parseInt(req.params.RESTUARANT_ID, 10);
    if (!RESTUARANT_ID || Number.isNaN(RESTUARANT_ID)) {
      return res.status(400).json({ message: "Invalid RESTUARANT_ID" });
    }

    const existingRows = await dbService.find(
      {
        table: RESTAURANTS_TABLE,
        where: { RESTUARANT_ID },
        limit: 1,
      },
      companyId
    );

    if (!existingRows.length) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const now = new Date();

    await dbService.update(
      RESTAURANTS_TABLE,
      {
        ACTIVE_STATUS: 0,
        UPDATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
      },
      { RESTUARANT_ID },
      companyId
    );

    return res.json({ message: "Restaurant deleted (soft)" });
  } catch (err) {
    console.error("deleteRestaurant error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/* ----------------------------------------------------------------------
 * RESTAURANT MEALS CRUD
 * Table: COE_RESTAURANT_MEALS
 * ------------------------------------------------------------------- */

/**
 * GET /api/restaurants/meals
 * or  GET /api/restaurants/:RESTAURANT_ID/meals
 *
 * Dynamic filter by ANY column on COE_RESTAURANT_MEALS using query params.
 *
 * Supported filter columns:
 *   RESTAURANT_MEAL_ID
 *   RESTAURANT_MEAL_DESCRIPTION
 *   RESTAURANT_ID
 *   RESTAURANT_MEAL_TYPE_ID
 *   RESTAURANT_MEAL_RATE_PP
 *   CREATED_ON
 *   CREATED_BY
 *   UPDATED_ON
 *   UPDATED_BY
 *   ACTIVE_STATUS
 */
async function listRestaurantMeals(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const filterableColumns = [
      "RESTAURANT_MEAL_ID",
      "RESTAURANT_MEAL_DESCRIPTION",
      "RESTAURANT_ID",
      "RESTAURANT_MEAL_TYPE_ID",
      "RESTAURANT_MEAL_RATE_PP",
      "CREATED_ON",
      "CREATED_BY",
      "UPDATED_ON",
      "UPDATED_BY",
      "ACTIVE_STATUS",
    ];

    const numericColumns = [
      "RESTAURANT_MEAL_ID",
      "RESTAURANT_ID",
      "RESTAURANT_MEAL_TYPE_ID",
      "RESTAURANT_MEAL_RATE_PP",
      "CREATED_BY",
      "UPDATED_BY",
      "ACTIVE_STATUS",
    ];

    const where = {};

    // If RESTAURANT_ID is in the route, force it into where
    if (req.params.RESTAURANT_ID) {
      const restId = parseInt(req.params.RESTAURANT_ID, 10);
      if (!Number.isNaN(restId)) {
        where.RESTAURANT_ID = restId;
      }
    }

    for (const col of filterableColumns) {
      if (col === "RESTAURANT_ID" && where.RESTAURANT_ID !== undefined) {
        // Route param RESTAURANT_ID wins over query
        continue;
      }

      if (req.query[col] !== undefined && req.query[col] !== "") {
        if (numericColumns.includes(col)) {
          const numVal = Number(req.query[col]);
          if (!Number.isNaN(numVal)) {
            where[col] = numVal;
          }
        } else {
          where[col] = req.query[col];
        }
      }
    }

    const meals = await dbService.find(
      {
        table: RESTAURANT_MEALS_TABLE,
        where,
        fields: [
          "RESTAURANT_MEAL_ID",
          "RESTAURANT_MEAL_DESCRIPTION",
          "RESTAURANT_ID",
          "RESTAURANT_MEAL_TYPE_ID",
          "RESTAURANT_MEAL_RATE_PP",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
          "ACTIVE_STATUS",
        ],
        orderBy: "RESTAURANT_MEAL_DESCRIPTION ASC",
      },
      companyId
    );

    return res.json(meals);
  } catch (err) {
    console.error("listRestaurantMeals error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/restaurants/:RESTAURANT_ID/meals
 *
 * BODY:
 * {
 *   "RESTAURANT_MEAL_DESCRIPTION": "Lunch buffet",
 *   "RESTAURANT_MEAL_TYPE_ID": 1,
 *   "RESTAURANT_MEAL_RATE_PP": 15.5,
 *   "ACTIVE_STATUS": 1
 * }
 */
async function createRestaurantMeal(req, res) {
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

    const RESTAURANT_ID = parseInt(req.params.RESTAURANT_ID, 10);
    if (!RESTAURANT_ID || Number.isNaN(RESTAURANT_ID)) {
      return res.status(400).json({ message: "Invalid RESTAURANT_ID" });
    }

    const {
      RESTAURANT_MEAL_DESCRIPTION,
      RESTAURANT_MEAL_TYPE_ID,
      RESTAURANT_MEAL_RATE_PP,
      ACTIVE_STATUS,
    } = req.body;

    if (!RESTAURANT_MEAL_DESCRIPTION) {
      return res.status(400).json({
        message: "RESTAURANT_MEAL_DESCRIPTION is required",
      });
    }

    // Ensure restaurant exists for this company
    const restaurants = await dbService.find(
      {
        table: RESTAURANTS_TABLE,
        where: { RESTUARANT_ID: RESTAURANT_ID },
        limit: 1,
      },
      companyId
    );

    if (!restaurants.length) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const now = new Date();

    const data = {
      RESTAURANT_MEAL_DESCRIPTION,
      RESTAURANT_ID,
      RESTAURANT_MEAL_TYPE_ID:
        RESTAURANT_MEAL_TYPE_ID !== undefined ? RESTAURANT_MEAL_TYPE_ID : null,
      RESTAURANT_MEAL_RATE_PP:
        RESTAURANT_MEAL_RATE_PP !== undefined ? RESTAURANT_MEAL_RATE_PP : null,
      ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
      CREATED_BY: userFromToken.USER_ID,
      CREATED_ON: now,
    };

    const result = await dbService.insert(
      RESTAURANT_MEALS_TABLE,
      data,
      companyId
    );

    return res.status(201).json({
      message: "Restaurant meal created",
      RESTAURANT_MEAL_ID: result.insertId,
    });
  } catch (err) {
    console.error("createRestaurantMeal error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/restaurants/:RESTAURANT_ID/meals/:RESTAURANT_MEAL_ID
 */
async function updateRestaurantMeal(req, res) {
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

    const RESTAURANT_ID = parseInt(req.params.RESTAURANT_ID, 10);
    const RESTAURANT_MEAL_ID = parseInt(req.params.RESTAURANT_MEAL_ID, 10);

    if (!RESTAURANT_ID || Number.isNaN(RESTAURANT_ID)) {
      return res.status(400).json({ message: "Invalid RESTAURANT_ID" });
    }
    if (!RESTAURANT_MEAL_ID || Number.isNaN(RESTAURANT_MEAL_ID)) {
      return res.status(400).json({ message: "Invalid RESTAURANT_MEAL_ID" });
    }

    const {
      RESTAURANT_MEAL_DESCRIPTION,
      RESTAURANT_MEAL_TYPE_ID,
      RESTAURANT_MEAL_RATE_PP,
      ACTIVE_STATUS,
    } = req.body;

    const meals = await dbService.find(
      {
        table: RESTAURANT_MEALS_TABLE,
        where: { RESTAURANT_MEAL_ID, RESTAURANT_ID },
        limit: 1,
      },
      companyId
    );

    if (!meals.length) {
      return res.status(404).json({ message: "Restaurant meal not found" });
    }

    const updateData = {};

    if (RESTAURANT_MEAL_DESCRIPTION !== undefined) {
      updateData.RESTAURANT_MEAL_DESCRIPTION = RESTAURANT_MEAL_DESCRIPTION;
    }
    if (RESTAURANT_MEAL_TYPE_ID !== undefined) {
      updateData.RESTAURANT_MEAL_TYPE_ID = RESTAURANT_MEAL_TYPE_ID;
    }
    if (RESTAURANT_MEAL_RATE_PP !== undefined) {
      updateData.RESTAURANT_MEAL_RATE_PP = RESTAURANT_MEAL_RATE_PP;
    }
    if (ACTIVE_STATUS !== undefined) {
      updateData.ACTIVE_STATUS = ACTIVE_STATUS;
    }

    const now = new Date();
    updateData.UPDATED_BY = userFromToken.USER_ID;
    updateData.UPDATED_ON = now;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(
        RESTAURANT_MEALS_TABLE,
        updateData,
        { RESTAURANT_MEAL_ID, RESTAURANT_ID },
        companyId
      );
    }

    const updated = await dbService.find(
      {
        table: RESTAURANT_MEALS_TABLE,
        where: { RESTAURANT_MEAL_ID, RESTAURANT_ID },
        fields: [
          "RESTAURANT_MEAL_ID",
          "RESTAURANT_MEAL_DESCRIPTION",
          "RESTAURANT_ID",
          "RESTAURANT_MEAL_TYPE_ID",
          "RESTAURANT_MEAL_RATE_PP",
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

    return res.json({
      message: "Restaurant meal updated",
      RESTAURANT_MEAL: updated[0],
    });
  } catch (err) {
    console.error("updateRestaurantMeal error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/restaurants/:RESTAURANT_ID/meals/:RESTAURANT_MEAL_ID
 * Soft delete (ACTIVE_STATUS = 0)
 */
async function deleteRestaurantMeal(req, res) {
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

    const RESTAURANT_ID = parseInt(req.params.RESTAURANT_ID, 10);
    const RESTAURANT_MEAL_ID = parseInt(req.params.RESTAURANT_MEAL_ID, 10);

    if (!RESTAURANT_ID || Number.isNaN(RESTAURANT_ID)) {
      return res.status(400).json({ message: "Invalid RESTAURANT_ID" });
    }
    if (!RESTAURANT_MEAL_ID || Number.isNaN(RESTAURANT_MEAL_ID)) {
      return res.status(400).json({ message: "Invalid RESTAURANT_MEAL_ID" });
    }

    const meals = await dbService.find(
      {
        table: RESTAURANT_MEALS_TABLE,
        where: { RESTAURANT_MEAL_ID, RESTAURANT_ID },
        limit: 1,
      },
      companyId
    );

    if (!meals.length) {
      return res.status(404).json({ message: "Restaurant meal not found" });
    }

    const now = new Date();

    await dbService.update(
      RESTAURANT_MEALS_TABLE,
      {
        ACTIVE_STATUS: 0,
        UPDATED_BY: userFromToken.USER_ID,
        UPDATED_ON: now,
      },
      { RESTAURANT_MEAL_ID, RESTAURANT_ID },
      companyId
    );

    return res.json({ message: "Restaurant meal deleted (soft)" });
  } catch (err) {
    console.error("deleteRestaurantMeal error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/restaurants/meals/lookup
 *
 * Returns meals from COE_VIEW_RESTAURANT_MEALS_LOOKUP
 * grouped and sorted as:
 *  1) by restaurant
 *  2) by RESTAURANT_MEAL_TYPE
 *  3) by meal
 */
async function listRestaurantMealsLookup(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    // 1) Get flat rows from the view
    const rows = await dbService.find(
      {
        table: RESTAURANT_MEALS_LOOKUP_VIEW,
        where: {}, // COMPANY_ID is enforced inside dbService using companyId
        fields: [
          "RESTAURANT_MEAL_ID",
          "RESTAURANT_MEAL_DESCRIPTION",
          "RESTAURANT_ID",
          "RESTUARANT_NAME",
          "RESTAURANT_MEAL_TYPE_ID",
          "RESTAURANT_MEAL_TYPE_NAME",
          "RESTAURANT_MEAL_RATE_PP",
          "COMPANY_ID",
          "ACTIVE_STATUS",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
        ],
        // Sort at SQL level:
        //  1) restaurant
        //  2) meal type
        //  3) meal
        orderBy:
          "RESTUARANT_NAME ASC, RESTAURANT_MEAL_TYPE_NAME ASC, RESTAURANT_MEAL_DESCRIPTION ASC",
      },
      companyId
    );

    // 2) Transform to nested structure:
    // [
    //   {
    //     RESTAURANT_ID,
    //     RESTUARANT_NAME,
    //     RESTAURANT_MEAL_TYPES: [
    //       {
    //         RESTAURANT_MEAL_TYPE_ID,
    //         RESTAURANT_MEAL_TYPE_NAME,
    //         MEALS: [ { ...meal fields } ]
    //       }
    //     ]
    //   }
    // ]

    const restaurantsMap = new Map();
    const restaurantsArr = [];

    for (const row of rows) {
      // --- level 1: restaurant ---
      let restaurant = restaurantsMap.get(row.RESTAURANT_ID);
      if (!restaurant) {
        restaurant = {
          RESTAURANT_ID: row.RESTAURANT_ID,
          RESTUARANT_NAME: row.RESTUARANT_NAME,
          RESTAURANT_MEAL_TYPES: [],
        };
        restaurantsMap.set(row.RESTAURANT_ID, restaurant);
        restaurantsArr.push(restaurant);
      }

      // --- level 2: meal type within restaurant ---
      let type = restaurant.RESTAURANT_MEAL_TYPES.find(
        (t) => t.RESTAURANT_MEAL_TYPE_ID === row.RESTAURANT_MEAL_TYPE_ID
      );
      if (!type) {
        type = {
          RESTAURANT_MEAL_TYPE_ID: row.RESTAURANT_MEAL_TYPE_ID,
          RESTAURANT_MEAL_TYPE_NAME: row.RESTAURANT_MEAL_TYPE_NAME,
          MEALS: [],
        };
        restaurant.RESTAURANT_MEAL_TYPES.push(type);
      }

      // --- level 3: meal within type ---
      const meal = {
        RESTAURANT_MEAL_ID: row.RESTAURANT_MEAL_ID,
        RESTAURANT_MEAL_DESCRIPTION: row.RESTAURANT_MEAL_DESCRIPTION,
        RESTAURANT_MEAL_RATE_PP: row.RESTAURANT_MEAL_RATE_PP,
        ACTIVE_STATUS: row.ACTIVE_STATUS,
        CREATED_ON: row.CREATED_ON,
        CREATED_BY: row.CREATED_BY,
        UPDATED_ON: row.UPDATED_ON,
        UPDATED_BY: row.UPDATED_BY,
      };

      type.MEALS.push(meal);
    }

    // Optional: ensure arrays are sorted at JS side too
    restaurantsArr.sort((a, b) =>
      String(a.RESTUARANT_NAME).localeCompare(String(b.RESTUARANT_NAME))
    );
    for (const r of restaurantsArr) {
      r.RESTAURANT_MEAL_TYPES.sort((a, b) =>
        String(a.RESTAURANT_MEAL_TYPE_NAME).localeCompare(
          String(b.RESTAURANT_MEAL_TYPE_NAME)
        )
      );
      for (const t of r.RESTAURANT_MEAL_TYPES) {
        t.MEALS.sort((a, b) =>
          String(a.RESTAURANT_MEAL_DESCRIPTION).localeCompare(
            String(b.RESTAURANT_MEAL_DESCRIPTION)
          )
        );
      }
    }

    // 3) Send a *single object* containing all nested data
    return res.json({
      restaurants: restaurantsArr,
    });
  } catch (err) {
    console.error("listRestaurantMealsLookup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  // Restaurants
  listRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,

  // Restaurant meals
  listRestaurantMeals,
  createRestaurantMeal,
  updateRestaurantMeal,
  deleteRestaurantMeal,
    listRestaurantMealsLookup, 

};
