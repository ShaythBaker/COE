// src/modules/places/places.controller.js
const dbService = require("../../core/dbService");
const pool = require("../../core/db");

const PLACES_TABLE = "COE_TBL_PLACES";
const PLACE_IMAGES_TABLE = "COE_TBL_PLACES_IMAGES";
const PLACE_ENTRANCE_FEES_TABLE = "COE_TBL_PLACES_ENTRANCE_FEES";

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

// Helper to load a single place (by id + company) with its images
async function fetchPlaceWithImages(PLACE_ID, companyId) {
  const sql = `
    SELECT
      p.PLACE_ID,
      p.PLACE_NAME,
      p.PLACE_AREA_ID,
      p.PLACE_DESCRIPTION,
      p.COMPANY_ID,
      p.CREATED_ON,
      p.CREATED_BY,
      p.UPDATED_ON,
      p.UPDATED_BY,
      i.PLACE_IMAGE_ID,
      i.PLACE_IMAGE_ATTACHMENT_ID,
      i.PLACE_IMAGE_PLACE_ID,
      i.CREATED_ON AS IMAGE_CREATED_ON,
      i.CREATED_BY AS IMAGE_CREATED_BY,
      i.UPDATED_ON AS IMAGE_UPDATED_ON,
      i.UPDATED_BY AS IMAGE_UPDATED_BY
    FROM ${PLACES_TABLE} p
    LEFT JOIN ${PLACE_IMAGES_TABLE} i
      ON i.PLACE_IMAGE_PLACE_ID = p.PLACE_ID
     AND i.COMPANY_ID = p.COMPANY_ID
    WHERE p.COMPANY_ID = ?
      AND p.PLACE_ID = ?
    ORDER BY i.PLACE_IMAGE_ID ASC
  `;

  const [rows] = await pool.query(sql, [companyId, PLACE_ID]);

  if (!rows || rows.length === 0) {
    return null;
  }

  const first = rows[0];

  const place = {
    PLACE_ID: first.PLACE_ID,
    PLACE_NAME: first.PLACE_NAME,
    PLACE_AREA_ID: first.PLACE_AREA_ID,
    PLACE_DESCRIPTION: first.PLACE_DESCRIPTION,
    COMPANY_ID: first.COMPANY_ID,
    CREATED_ON: first.CREATED_ON,
    CREATED_BY: first.CREATED_BY,
    UPDATED_ON: first.UPDATED_ON,
    UPDATED_BY: first.UPDATED_BY,
    IMAGES: [],
  };

  for (const row of rows) {
    if (!row.PLACE_IMAGE_ID) continue;
    place.IMAGES.push({
      PLACE_IMAGE_ID: row.PLACE_IMAGE_ID,
      PLACE_IMAGE_ATTACHMENT_ID: row.PLACE_IMAGE_ATTACHMENT_ID,
      PLACE_IMAGE_PLACE_ID: row.PLACE_IMAGE_PLACE_ID,
      CREATED_ON: row.IMAGE_CREATED_ON,
      CREATED_BY: row.IMAGE_CREATED_BY,
      UPDATED_ON: row.IMAGE_UPDATED_ON,
      UPDATED_BY: row.IMAGE_UPDATED_BY,
    });
  }

  return place;
}

/**
 * GET /api/places
 * Optional query:
 *   ?PLACE_AREA_ID=...
 *
 * Returns: array of places, each with IMAGES[]
 */
async function listPlaces(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const { PLACE_AREA_ID } = req.query;

    let sql = `
      SELECT
        p.PLACE_ID,
        p.PLACE_NAME,
        p.PLACE_AREA_ID,
        p.PLACE_DESCRIPTION,
        p.COMPANY_ID,
        p.CREATED_ON,
        p.CREATED_BY,
        p.UPDATED_ON,
        p.UPDATED_BY,
        i.PLACE_IMAGE_ID,
        i.PLACE_IMAGE_ATTACHMENT_ID,
        i.PLACE_IMAGE_PLACE_ID,
        i.CREATED_ON AS IMAGE_CREATED_ON,
        i.CREATED_BY AS IMAGE_CREATED_BY,
        i.UPDATED_ON AS IMAGE_UPDATED_ON,
        i.UPDATED_BY AS IMAGE_UPDATED_BY
      FROM ${PLACES_TABLE} p
      LEFT JOIN ${PLACE_IMAGES_TABLE} i
        ON i.PLACE_IMAGE_PLACE_ID = p.PLACE_ID
       AND i.COMPANY_ID = p.COMPANY_ID
      WHERE p.COMPANY_ID = ?
    `;
    const params = [companyId];

    if (PLACE_AREA_ID !== undefined) {
      sql += " AND p.PLACE_AREA_ID = ?";
      params.push(PLACE_AREA_ID);
    }

    sql += " ORDER BY p.PLACE_NAME ASC, i.PLACE_IMAGE_ID ASC";

    const [rows] = await pool.query(sql, params);

    const placesMap = new Map();

    for (const row of rows) {
      if (!placesMap.has(row.PLACE_ID)) {
        placesMap.set(row.PLACE_ID, {
          PLACE_ID: row.PLACE_ID,
          PLACE_NAME: row.PLACE_NAME,
          PLACE_AREA_ID: row.PLACE_AREA_ID,
          PLACE_DESCRIPTION: row.PLACE_DESCRIPTION,
          COMPANY_ID: row.COMPANY_ID,
          CREATED_ON: row.CREATED_ON,
          CREATED_BY: row.CREATED_BY,
          UPDATED_ON: row.UPDATED_ON,
          UPDATED_BY: row.UPDATED_BY,
          IMAGES: [],
        });
      }

      const place = placesMap.get(row.PLACE_ID);

      if (row.PLACE_IMAGE_ID) {
        place.IMAGES.push({
          PLACE_IMAGE_ID: row.PLACE_IMAGE_ID,
          PLACE_IMAGE_ATTACHMENT_ID: row.PLACE_IMAGE_ATTACHMENT_ID,
          PLACE_IMAGE_PLACE_ID: row.PLACE_IMAGE_PLACE_ID,
          CREATED_ON: row.IMAGE_CREATED_ON,
          CREATED_BY: row.IMAGE_CREATED_BY,
          UPDATED_ON: row.IMAGE_UPDATED_ON,
          UPDATED_BY: row.IMAGE_UPDATED_BY,
        });
      }
    }

    return res.json(Array.from(placesMap.values()));
  } catch (err) {
    console.error("listPlaces error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/places/:PLACE_ID
 * Returns: single place with IMAGES[]
 */
async function getPlaceById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const PLACE_ID = parseInt(req.params.PLACE_ID, 10);
    if (!PLACE_ID || Number.isNaN(PLACE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ID" });
    }

    const place = await fetchPlaceWithImages(PLACE_ID, companyId);
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    return res.json(place);
  } catch (err) {
    console.error("getPlaceById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/places
 * BODY:
 * {
 *   "PLACE_NAME": "...",            // required
 *   "PLACE_AREA_ID": 123,          // optional
 *   "PLACE_DESCRIPTION": "...",    // optional
 *   "IMAGES": [
 *      { "PLACE_IMAGE_ATTACHMENT_ID": 111 },
 *      { "PLACE_IMAGE_ATTACHMENT_ID": 222 }
 *   ]                              // optional
 * }
 *
 * Creates place and (optionally) its images in COE_TBL_PLACES_IMAGES.
 */
async function createPlace(req, res) {
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

    const { PLACE_NAME, PLACE_AREA_ID, PLACE_DESCRIPTION, IMAGES } = req.body;

    if (!PLACE_NAME) {
      return res.status(400).json({ message: "PLACE_NAME is required" });
    }

    const now = new Date();

    // Insert place
    const placeResult = await dbService.insert(
      PLACES_TABLE,
      {
        PLACE_NAME,
        PLACE_AREA_ID: PLACE_AREA_ID || null,
        PLACE_DESCRIPTION: PLACE_DESCRIPTION || null,
        CREATED_ON: now,
        CREATED_BY: userFromToken.USER_ID,
      },
      companyId
    );

    const PLACE_ID = placeResult.insertId;

    // Insert images if provided
    if (Array.isArray(IMAGES) && IMAGES.length > 0) {
      for (const img of IMAGES) {
        if (!img || !img.PLACE_IMAGE_ATTACHMENT_ID) continue;

        await dbService.insert(
          PLACE_IMAGES_TABLE,
          {
            PLACE_IMAGE_ATTACHMENT_ID: img.PLACE_IMAGE_ATTACHMENT_ID,
            PLACE_IMAGE_PLACE_ID: PLACE_ID,
            CREATED_ON: now,
            CREATED_BY: userFromToken.USER_ID,
          },
          companyId
        );
      }
    }

    // Return full place with images
    const place = await fetchPlaceWithImages(PLACE_ID, companyId);

    return res.status(201).json({
      message: "Place created",
      PLACE_ID,
      PLACE: place,
    });
  } catch (err) {
    console.error("createPlace error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/places/:PLACE_ID
 * BODY: any subset of:
 * {
 *   "PLACE_NAME": "...",
 *   "PLACE_AREA_ID": 123,
 *   "PLACE_DESCRIPTION": "...",
 *   "IMAGES": [
 *      { "PLACE_IMAGE_ATTACHMENT_ID": 111 },
 *      { "PLACE_IMAGE_ATTACHMENT_ID": 222 }
 *   ]
 * }
 *
 * NOTE: if IMAGES is provided, it is treated as the full new list:
 * - All existing images for this place are deleted
 * - New ones are inserted from the array
 */
async function updatePlace(req, res) {
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

    const PLACE_ID = parseInt(req.params.PLACE_ID, 10);
    if (!PLACE_ID || Number.isNaN(PLACE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ID" });
    }

    const { PLACE_NAME, PLACE_AREA_ID, PLACE_DESCRIPTION, IMAGES } = req.body;

    // Ensure place exists (scoped by company)
    const places = await dbService.find(
      {
        table: PLACES_TABLE,
        where: { PLACE_ID },
        limit: 1,
      },
      companyId
    );

    if (places.length === 0) {
      return res.status(404).json({ message: "Place not found" });
    }

    const now = new Date();
    const updateData = {
      UPDATED_ON: now,
      UPDATED_BY: userFromToken.USER_ID,
    };

    if (PLACE_NAME !== undefined) updateData.PLACE_NAME = PLACE_NAME;
    if (PLACE_AREA_ID !== undefined) updateData.PLACE_AREA_ID = PLACE_AREA_ID;
    if (PLACE_DESCRIPTION !== undefined)
      updateData.PLACE_DESCRIPTION = PLACE_DESCRIPTION;

    if (Object.keys(updateData).length > 0) {
      await dbService.update(PLACES_TABLE, updateData, { PLACE_ID }, companyId);
    }

    // If IMAGES array is provided, replace existing images
    if (Array.isArray(IMAGES)) {
      // Delete existing images for this place
      await dbService.remove(
        PLACE_IMAGES_TABLE,
        { PLACE_IMAGE_PLACE_ID: PLACE_ID },
        companyId
      );

      // Insert new images
      for (const img of IMAGES) {
        if (!img || !img.PLACE_IMAGE_ATTACHMENT_ID) continue;

        await dbService.insert(
          PLACE_IMAGES_TABLE,
          {
            PLACE_IMAGE_ATTACHMENT_ID: img.PLACE_IMAGE_ATTACHMENT_ID,
            PLACE_IMAGE_PLACE_ID: PLACE_ID,
            CREATED_ON: now,
            CREATED_BY: userFromToken.USER_ID,
          },
          companyId
        );
      }
    }

    const updatedPlace = await fetchPlaceWithImages(PLACE_ID, companyId);

    return res.json({
      message: "Place updated",
      PLACE: updatedPlace,
    });
  } catch (err) {
    console.error("updatePlace error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/places/:PLACE_ID
 *
 * Hard delete:
 * - Deletes all images for this place
 * - Deletes the place itself
 */
async function deletePlace(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const PLACE_ID = parseInt(req.params.PLACE_ID, 10);
    if (!PLACE_ID || Number.isNaN(PLACE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ID" });
    }

    // Ensure place exists
    const places = await dbService.find(
      {
        table: PLACES_TABLE,
        where: { PLACE_ID },
        limit: 1,
      },
      companyId
    );

    if (places.length === 0) {
      return res.status(404).json({ message: "Place not found" });
    }

    // Delete images first
    await dbService.remove(
      PLACE_IMAGES_TABLE,
      { PLACE_IMAGE_PLACE_ID: PLACE_ID },
      companyId
    );

    // Delete place
    await dbService.remove(PLACES_TABLE, { PLACE_ID }, companyId);

    return res.json({ message: "Place deleted" });
  } catch (err) {
    console.error("deletePlace error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * Helper: normalize country IDs to an array of numbers
 */
function normalizeCountryIds(raw) {
  if (Array.isArray(raw)) {
    return raw.map((v) => parseInt(v, 10)).filter((v) => !Number.isNaN(v));
  }
  const single = parseInt(raw, 10);
  if (!single || Number.isNaN(single)) return [];
  return [single];
}

/**
 * GET /api/places/:PLACE_ID/entrance-fees
 *
 * List all entrance fees for a given place (scoped by COMPANY_ID)
 */
async function listPlaceEntranceFees(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const PLACE_ID = parseInt(req.params.PLACE_ID, 10);
    if (!PLACE_ID || Number.isNaN(PLACE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ID" });
    }

    // Optional: ensure place exists for this company
    const places = await dbService.find(
      {
        table: PLACES_TABLE,
        where: { PLACE_ID },
        limit: 1,
      },
      companyId
    );

    if (places.length === 0) {
      return res.status(404).json({ message: "Place not found" });
    }

    const fees = await dbService.find(
      {
        table: PLACE_ENTRANCE_FEES_TABLE,
        where: { PLACE_ENTRANCE_FEE_PLACE_ID: PLACE_ID },
        fields: [
          "PLACE_ENTRANCE_FEE_ID",
          "PLACE_ENTRANCE_FEE_PLACE_ID",
          "PLACE_ENTRANCE_FEE_AMOUNT",
          "PLACE_ENTRANCE_FEE_COUNTRY_ID",
          "COMPANY_ID",
          "CREATED_ON",
          "CREATED_BY",
          "UPDATED_ON",
          "UPDATED_BY",
        ],
        orderBy: "PLACE_ENTRANCE_FEE_ID ASC",
      },
      companyId
    );

    return res.json(fees);
  } catch (err) {
    console.error("listPlaceEntranceFees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/places/:PLACE_ID/entrance-fees/:PLACE_ENTRANCE_FEE_ID
 *
 * Get a single entrance fee row for a place
 */
async function getPlaceEntranceFeeById(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const PLACE_ID = parseInt(req.params.PLACE_ID, 10);
    const PLACE_ENTRANCE_FEE_ID = parseInt(
      req.params.PLACE_ENTRANCE_FEE_ID,
      10
    );

    if (!PLACE_ID || Number.isNaN(PLACE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ID" });
    }
    if (!PLACE_ENTRANCE_FEE_ID || Number.isNaN(PLACE_ENTRANCE_FEE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ENTRANCE_FEE_ID" });
    }

    const rows = await dbService.find(
      {
        table: PLACE_ENTRANCE_FEES_TABLE,
        where: {
          PLACE_ENTRANCE_FEE_ID: PLACE_ENTRANCE_FEE_ID,
          PLACE_ENTRANCE_FEE_PLACE_ID: PLACE_ID,
        },
        limit: 1,
      },
      companyId
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Entrance fee not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getPlaceEntranceFeeById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/places/:PLACE_ID/entrance-fees
 *
 * BODY:
 * {
 *   "PLACE_ENTRANCE_FEE_AMOUNT": 25.5,                 // required (number)
 *   "PLACE_ENTRANCE_FEE_COUNTRY_ID": [1, 2, 3]         // required (array or single)
 * }
 *
 * NOTE: PLACE_ENTRANCE_FEE_COUNTRY_ID can be an array.
 * We insert one row per country ID with the same amount.
 */
async function createPlaceEntranceFees(req, res) {
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

    const PLACE_ID = parseInt(req.params.PLACE_ID, 10);
    if (!PLACE_ID || Number.isNaN(PLACE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ID" });
    }

    const { PLACE_ENTRANCE_FEE_AMOUNT, PLACE_ENTRANCE_FEE_COUNTRY_ID } =
      req.body;

    const amount = Number(PLACE_ENTRANCE_FEE_AMOUNT);
    if (Number.isNaN(amount)) {
      return res
        .status(400)
        .json({ message: "PLACE_ENTRANCE_FEE_AMOUNT must be a number" });
    }

    const countryIds = normalizeCountryIds(PLACE_ENTRANCE_FEE_COUNTRY_ID);
    if (!countryIds.length) {
      return res.status(400).json({
        message:
          "PLACE_ENTRANCE_FEE_COUNTRY_ID must be a number or an array of numbers",
      });
    }

    // Ensure the place exists for this company
    const places = await dbService.find(
      {
        table: PLACES_TABLE,
        where: { PLACE_ID },
        limit: 1,
      },
      companyId
    );

    if (places.length === 0) {
      return res.status(404).json({ message: "Place not found" });
    }

    const now = new Date();
    const createdIds = [];

    for (const countryId of countryIds) {
      const result = await dbService.insert(
        PLACE_ENTRANCE_FEES_TABLE,
        {
          PLACE_ENTRANCE_FEE_PLACE_ID: PLACE_ID,
          PLACE_ENTRANCE_FEE_AMOUNT: amount,
          PLACE_ENTRANCE_FEE_COUNTRY_ID: countryId,
          CREATED_ON: now,
          CREATED_BY: userFromToken.USER_ID,
        },
        companyId
      );

      createdIds.push(result.insertId);
    }

    // Return newly created rows
    const createdFees = await dbService.find(
      {
        table: PLACE_ENTRANCE_FEES_TABLE,
        where: {
          PLACE_ENTRANCE_FEE_PLACE_ID: PLACE_ID,
        },
        orderBy: "PLACE_ENTRANCE_FEE_ID ASC",
      },
      companyId
    );

    return res.status(201).json({
      message: "Entrance fees created",
      PLACE_ID,
      CREATED_IDS: createdIds,
      FEES: createdFees,
    });
  } catch (err) {
    console.error("createPlaceEntranceFees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/places/:PLACE_ID/entrance-fees/:PLACE_ENTRANCE_FEE_ID
 *
 * BODY: any subset of:
 * {
 *   "PLACE_ENTRANCE_FEE_AMOUNT": 30,
 *   "PLACE_ENTRANCE_FEE_COUNTRY_ID": 5   // or [5] (single)
 * }
 *
 * NOTE: here we update a single row. If an array is passed for
 * PLACE_ENTRANCE_FEE_COUNTRY_ID it must contain exactly one ID.
 */
async function updatePlaceEntranceFee(req, res) {
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

    const PLACE_ID = parseInt(req.params.PLACE_ID, 10);
    const PLACE_ENTRANCE_FEE_ID = parseInt(
      req.params.PLACE_ENTRANCE_FEE_ID,
      10
    );

    if (!PLACE_ID || Number.isNaN(PLACE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ID" });
    }
    if (!PLACE_ENTRANCE_FEE_ID || Number.isNaN(PLACE_ENTRANCE_FEE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ENTRANCE_FEE_ID" });
    }

    const existingRows = await dbService.find(
      {
        table: PLACE_ENTRANCE_FEES_TABLE,
        where: {
          PLACE_ENTRANCE_FEE_ID: PLACE_ENTRANCE_FEE_ID,
          PLACE_ENTRANCE_FEE_PLACE_ID: PLACE_ID,
        },
        limit: 1,
      },
      companyId
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Entrance fee not found" });
    }

    const { PLACE_ENTRANCE_FEE_AMOUNT, PLACE_ENTRANCE_FEE_COUNTRY_ID } =
      req.body;

    const now = new Date();
    const updateData = {
      UPDATED_ON: now,
      UPDATED_BY: userFromToken.USER_ID,
    };

    if (PLACE_ENTRANCE_FEE_AMOUNT !== undefined) {
      const amount = Number(PLACE_ENTRANCE_FEE_AMOUNT);
      if (Number.isNaN(amount)) {
        return res.status(400).json({
          message: "PLACE_ENTRANCE_FEE_AMOUNT must be a number",
        });
      }
      updateData.PLACE_ENTRANCE_FEE_AMOUNT = amount;
    }

    if (PLACE_ENTRANCE_FEE_COUNTRY_ID !== undefined) {
      const ids = normalizeCountryIds(PLACE_ENTRANCE_FEE_COUNTRY_ID);
      if (ids.length !== 1) {
        return res.status(400).json({
          message:
            "For update, PLACE_ENTRANCE_FEE_COUNTRY_ID must be a single ID (number or array with one element)",
        });
      }
      updateData.PLACE_ENTRANCE_FEE_COUNTRY_ID = ids[0];
    }

    if (Object.keys(updateData).length <= 2) {
      // only UPDATED_ON / UPDATED_BY => nothing else to change
      return res.status(400).json({ message: "No fields to update" });
    }

    await dbService.update(
      PLACE_ENTRANCE_FEES_TABLE,
      updateData,
      {
        PLACE_ENTRANCE_FEE_ID: PLACE_ENTRANCE_FEE_ID,
        PLACE_ENTRANCE_FEE_PLACE_ID: PLACE_ID,
      },
      companyId
    );

    const updatedRows = await dbService.find(
      {
        table: PLACE_ENTRANCE_FEES_TABLE,
        where: {
          PLACE_ENTRANCE_FEE_ID: PLACE_ENTRANCE_FEE_ID,
          PLACE_ENTRANCE_FEE_PLACE_ID: PLACE_ID,
        },
        limit: 1,
      },
      companyId
    );

    return res.json({
      message: "Entrance fee updated",
      FEE: updatedRows[0],
    });
  } catch (err) {
    console.error("updatePlaceEntranceFee error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/places/:PLACE_ID/entrance-fees/:PLACE_ENTRANCE_FEE_ID
 *
 * Hard delete a single entrance fee row.
 */
async function deletePlaceEntranceFee(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const PLACE_ID = parseInt(req.params.PLACE_ID, 10);
    const PLACE_ENTRANCE_FEE_ID = parseInt(
      req.params.PLACE_ENTRANCE_FEE_ID,
      10
    );

    if (!PLACE_ID || Number.isNaN(PLACE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ID" });
    }
    if (!PLACE_ENTRANCE_FEE_ID || Number.isNaN(PLACE_ENTRANCE_FEE_ID)) {
      return res.status(400).json({ message: "Invalid PLACE_ENTRANCE_FEE_ID" });
    }

    const existingRows = await dbService.find(
      {
        table: PLACE_ENTRANCE_FEES_TABLE,
        where: {
          PLACE_ENTRANCE_FEE_ID: PLACE_ENTRANCE_FEE_ID,
          PLACE_ENTRANCE_FEE_PLACE_ID: PLACE_ID,
        },
        limit: 1,
      },
      companyId
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Entrance fee not found" });
    }

    await dbService.remove(
      PLACE_ENTRANCE_FEES_TABLE,
      {
        PLACE_ENTRANCE_FEE_ID: PLACE_ENTRANCE_FEE_ID,
        PLACE_ENTRANCE_FEE_PLACE_ID: PLACE_ID,
      },
      companyId
    );

    return res.json({ message: "Entrance fee deleted" });
  } catch (err) {
    console.error("deletePlaceEntranceFee error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/places/entrance-fees
 *
 * Optional query params:
 *   ?PLACE_ENTRANCE_FEE_PLACE_ID=123
 *   ?PLACE_ENTRANCE_FEE_COUNTRY_ID=5
 *
 * If both are omitted -> returns all entrance fees for the company.
 * If one or both are provided -> filters accordingly.
 */
/**
 * GET /api/places/entrance-fees
 *
 * Optional query params:
 *   ?PLACE_ENTRANCE_FEE_PLACE_ID=123
 *   ?PLACE_ENTRANCE_FEE_COUNTRY_ID=5
 *
 * If both are omitted -> returns all entrance fees for the company.
 * If one or both are provided -> filters accordingly.
 */
async function listEntranceFees(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const {
      PLACE_ENTRANCE_FEE_PLACE_ID,
      PLACE_ENTRANCE_FEE_COUNTRY_ID,
    } = req.query;

    // Always have a where object (can start empty)
    const where = {};

    if (PLACE_ENTRANCE_FEE_PLACE_ID !== undefined) {
      const placeId = parseInt(PLACE_ENTRANCE_FEE_PLACE_ID, 10);
      if (Number.isNaN(placeId)) {
        return res
          .status(400)
          .json({ message: "PLACE_ENTRANCE_FEE_PLACE_ID must be a number" });
      }
      where.PLACE_ENTRANCE_FEE_PLACE_ID = placeId;
    }

    if (PLACE_ENTRANCE_FEE_COUNTRY_ID !== undefined) {
      const countryId = parseInt(PLACE_ENTRANCE_FEE_COUNTRY_ID, 10);
      if (Number.isNaN(countryId)) {
        return res
          .status(400)
          .json({ message: "PLACE_ENTRANCE_FEE_COUNTRY_ID must be a number" });
      }
      where.PLACE_ENTRANCE_FEE_COUNTRY_ID = countryId;
    }

    const options = {
      table: PLACE_ENTRANCE_FEES_TABLE,
      fields: [
        "PLACE_ENTRANCE_FEE_ID",
        "PLACE_ENTRANCE_FEE_PLACE_ID",
        "PLACE_ENTRANCE_FEE_AMOUNT",
        "PLACE_ENTRANCE_FEE_COUNTRY_ID",
        "COMPANY_ID",
        "CREATED_ON",
        "CREATED_BY",
        "UPDATED_ON",
        "UPDATED_BY",
      ],
      where, // <= always pass a where object
      orderBy: "PLACE_ENTRANCE_FEE_ID ASC",
    };

    const fees = await dbService.find(options, companyId);

    return res.json(fees);
  } catch (err) {
    console.error("listEntranceFees error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


module.exports = {
  listPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  listPlaceEntranceFees,
  getPlaceEntranceFeeById,
  createPlaceEntranceFees,
  updatePlaceEntranceFee,
  deletePlaceEntranceFee,
   listEntranceFees,
};
