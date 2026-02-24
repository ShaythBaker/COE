const dbService = require("../../core/dbService");
const pool = require("../../core/db"); // ⬅️ add this

// You already have these somewhere:
const HOTEL_SEASON_RATES_VIEW = "COE_VIEW_HOTEL_SEASON_RATES_LOOKUP";
// const HOTEL_SEASON_RATES_FILTERABLE_COLUMNS = [...];

const ACCOM_OPTIONS_TABLE = "COE_TBL_QOUTATION_ACCOM_OPTIONS";
const ACCOM_ROOMS_TABLE = "COE_TBL_QOUTATION_ACCOM_OPTION_ROOMS";
const ACCOM_ROOMS_VIEW = "COE_VIEW_QOUTATION_ACCOM_OPTION_ROOMS_LOOKUP";

const HOTEL_SEASON_RATES_FILTERABLE_COLUMNS = [
  "HOTEL_ID",
  "SEASON_ID",
  "SEASON_NAME_ID",
  "RATE_FOR_ID",
  "RATE_ID",
  "HOTEL_AREA",
  "HOTEL_AREA_NAME",
  "HOTEL_STARS",
  "HOTEL_CHAIN",
];

// Helper to get COMPANY_ID from backend (same style as other modules)
function getCompanyId(req) {
  if (req.user && req.user.COMPANY_ID) return req.user.COMPANY_ID;
  if (req.session && req.session.COMPANY_ID) return req.session.COMPANY_ID;
  return null;
}

// Helper: group flat rows into HOTEL -> SEASONS -> ROOMS
function groupHotelSeasonRooms(rows) {
  const hotelsMap = new Map();

  for (const row of rows) {
    const hotelId = row.HOTEL_ID;

    // 1) Ensure hotel node exists
    let hotel = hotelsMap.get(hotelId);
    if (!hotel) {
      hotel = {
        COMPANY_ID: row.COMPANY_ID,
        HOTEL_ID: row.HOTEL_ID,
        HOTEL_NAME: row.HOTEL_NAME,
        HOTEL_ADDRESS: row.HOTEL_ADDRESS,
        HOTEL_AREA: row.HOTEL_AREA,
        HOTEL_AREA_NAME: row.HOTEL_AREA_NAME,
        HOTEL_STARS: row.HOTEL_STARS,
        HOTEL_PHONE: row.HOTEL_PHONE,
        HOTEL_RESERVATION_EMAIL: row.HOTEL_RESERVATION_EMAIL,
        HOTEL_LAT: row.HOTEL_LAT,
        HOTEL_LAN: row.HOTEL_LAN,
        HOTEL_CHAIN: row.HOTEL_CHAIN,
        HOTEL_CHAIN_NAME: row.HOTEL_CHAIN_NAME,
        HOTEL_LOGO: row.HOTEL_LOGO,
        HOTEL_CONTACT_PERSON_NAME: row.HOTEL_CONTACT_PERSON_NAME,
        HOTEL_ACTIVE_STATUS: row.HOTEL_ACTIVE_STATUS,
        HOTEL_CREATED_ON: row.HOTEL_CREATED_ON,
        HOTEL_CREATED_BY: row.HOTEL_CREATED_BY,
        SEASONS: [],
      };
      hotelsMap.set(hotelId, hotel);
    }

    // 2) Ensure season node exists inside this hotel
    const seasonId = row.SEASON_ID;
    let season = hotel.SEASONS.find((s) => s.SEASON_ID === seasonId);
    if (!season) {
      season = {
        SEASON_ID: row.SEASON_ID,
        SEASON_NAME_ID: row.SEASON_NAME_ID,
        SEASON_NAME: row.SEASON_NAME,
        SEASON_START_DATE: row.SEASON_START_DATE,
        SEASON_END_DATE: row.SEASON_END_DATE,
        SEASON_CREATED_ON: row.SEASON_CREATED_ON,
        SEASON_CREATED_BY: row.SEASON_CREATED_BY,
        SEASON_UPDATED_ON: row.SEASON_UPDATED_ON,
        SEASON_UPDATED_BY: row.SEASON_UPDATED_BY,
        ROOMS: [],
      };
      hotel.SEASONS.push(season);
    }

    // 3) Push rate/room info into season. Each row = one room/rate.
    season.ROOMS.push({
      RATE_ID: row.RATE_ID,
      RATE_FOR_ID: row.RATE_FOR_ID,
      RATE_FOR_NAME: row.RATE_FOR_NAME,
      RATE_AMOUNT: row.RATE_AMOUNT,
      RATE_HALF_BOARD_AMOUNT: row.RATE_HALF_BOARD_AMOUNT,
      RATE_FULL_BOARD_AMOUNT: row.RATE_FULL_BOARD_AMOUNT,
      RATE_SINGLE_SPPLIMENT_AMOUNT: row.RATE_SINGLE_SPPLIMENT_AMOUNT,
      RATE_CREATED_ON: row.RATE_CREATED_ON,
      RATE_CREATED_BY: row.RATE_CREATED_BY,
      RATE_CHANGED_ON: row.RATE_CHANGED_ON,
      RATE_CHANGED_BY: row.RATE_CHANGED_BY,
    });
  }

  return Array.from(hotelsMap.values());
}

async function listHotelSeasonRates(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const query = req.query || {};
    const where = {};

    // === 1) Read and validate arrival/departure dates ===
    const arrivalRaw =
      query.arrivalDate ||
      query.ARRIVAL_DATE ||
      query.arrivingDate ||
      query.ARRIVING_DATE;
    const departureRaw =
      query.departureDate ||
      query.DEPARTURE_DATE ||
      query.leavingDate ||
      query.LEAVING_DATE;

    if (!arrivalRaw || !departureRaw) {
      return res.status(400).json({
        message:
          "arrivalDate/ARRIVAL_DATE and departureDate/DEPARTURE_DATE are required",
      });
    }

    const arrivalDate = new Date(arrivalRaw);
    const departureDate = new Date(departureRaw);

    if (
      Number.isNaN(arrivalDate.getTime()) ||
      Number.isNaN(departureDate.getTime())
    ) {
      return res
        .status(400)
        .json({ message: "Invalid arrival or departure date format" });
    }

    if (departureDate <= arrivalDate) {
      return res
        .status(400)
        .json({ message: "departureDate must be after arrivalDate" });
    }

    // === 2) Build WHERE based only on allowed filter columns (non-date filters) ===
    for (const col of HOTEL_SEASON_RATES_FILTERABLE_COLUMNS) {
      if (query[col] !== undefined && query[col] !== "") {
        where[col] = query[col];
      }
    }

    // === 3) Fetch from DB using dbService.find (COMPANY_ID handled by core) ===
    // NOTE: no limit/offset here; we paginate after date filter/group.
    const rows = await dbService.find(
      {
        table: HOTEL_SEASON_RATES_VIEW,
        where,
        orderBy: "HOTEL_AREA_NAME ASC, HOTEL_NAME ASC, HOTEL_STARS DESC",
      },
      companyId,
    );

    // === 4) Filter by season overlap with [arrivalDate, departureDate] ===
    const overlappingRows = rows.filter((row) => {
      const seasonStart = new Date(row.SEASON_START_DATE);
      const seasonEnd = new Date(row.SEASON_END_DATE);

      if (
        Number.isNaN(seasonStart.getTime()) ||
        Number.isNaN(seasonEnd.getTime())
      ) {
        return false;
      }

      // overlap: seasonStart <= departure AND seasonEnd >= arrival
      return seasonStart <= departureDate && seasonEnd >= arrivalDate;
    });

    // === 5) Optional pagination on the flat overlapping rows ===
    let limitedRows = overlappingRows;
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

    if (offset != null) {
      limitedRows = limitedRows.slice(offset);
    }
    if (limit != null) {
      limitedRows = limitedRows.slice(0, limit);
    }

    // === 6) Transform to HOTEL -> SEASONS -> ROOMS ===
    const response = groupHotelSeasonRooms(limitedRows);

    return res.json(response);
  } catch (err) {
    console.error("listHotelSeasonRates error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /.../accommodation
// Returns: { COMPANY_ID, QOUTATION_ID, OPTIONS: [...] }
async function getQuotationAccommodation(req, res) {
  try {
    const companyId = getCompanyId(req);
    if (companyId == null) {
      return res
        .status(401)
        .json({ message: "COMPANY_ID not found for current user" });
    }

    const body = req.body || {};
    const qidRaw =
      req.params.QOUTATION_ID ||
      req.params.quotationId ||
      body.QOUTATION_ID ||
      body.quotationId ||
      req.query.QOUTATION_ID ||
      req.query.quotationId;

    const QOUTATION_ID = parseInt(qidRaw, 10);
    if (!QOUTATION_ID || Number.isNaN(QOUTATION_ID)) {
      return res
        .status(400)
        .json({ message: "QOUTATION_ID is required and must be a number" });
    }

    const rows = await dbService.find(
      {
        table: ACCOM_ROOMS_VIEW,
        where: { QOUTATION_ID },
        orderBy:
          "OPTION_ID ASC, SORT_ORDER ASC, HOTEL_NAME ASC, SEASON_START_DATE ASC",
      },
      companyId,
    );

    const OPTIONS = groupQuotationAccommodation(rows);

    return res.json({
      COMPANY_ID: companyId,
      QOUTATION_ID,
      OPTIONS,
    });
  } catch (err) {
    console.error("getQuotationAccommodation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// Helper: group flat rows from COE_VIEW_QOUTATION_ACCOM_OPTION_ROOMS_LOOKUP
// into { OPTIONS: [ { OPTION_ID, OPTION_NAME, SORT_ORDER, ROOMS: [...] } ] }
function groupQuotationAccommodation(rows) {
  const optionsMap = new Map();

  for (const row of rows) {
    const optionId = row.OPTION_ID;
    if (!optionId) continue;

    let option = optionsMap.get(optionId);
    if (!option) {
      option = {
        OPTION_ID: row.OPTION_ID,
        OPTION_NAME: row.OPTION_NAME,
        SORT_ORDER: row.SORT_ORDER,
        ROOMS: [],
      };
      optionsMap.set(optionId, option);
    }

    // Some options might exist without any rooms
    if (row.HOTEL_ID == null && row.SEASON_ID == null && row.RATE_ID == null) {
      continue;
    }

    option.ROOMS.push({
      HOTEL_ID: row.HOTEL_ID,
      HOTEL_NAME: row.HOTEL_NAME,
      HOTEL_AREA: row.HOTEL_AREA,
      HOTEL_AREA_NAME: row.HOTEL_AREA_NAME,
      HOTEL_STARS: row.HOTEL_STARS,
      HOTEL_CHAIN: row.HOTEL_CHAIN,
      HOTEL_CHAIN_NAME: row.HOTEL_CHAIN_NAME,

      SEASON_ID: row.SEASON_ID,
      SEASON_NAME_ID: row.SEASON_NAME_ID,
      SEASON_NAME: row.SEASON_NAME,
      SEASON_START_DATE: row.SEASON_START_DATE,
      SEASON_END_DATE: row.SEASON_END_DATE,

      RATE_ID: row.RATE_ID,
      RATE_FOR_ID: row.RATE_FOR_ID,
      RATE_FOR_NAME: row.RATE_FOR_NAME,

      NIGHTS: row.NIGHTS,
      GUESTS: row.GUESTS,

      RATE_AMOUNT: row.RATE_AMOUNT,
      RATE_HALF_BOARD_AMOUNT: row.RATE_HALF_BOARD_AMOUNT,
      RATE_FULL_BOARD_AMOUNT: row.RATE_FULL_BOARD_AMOUNT,
      RATE_SINGLE_SPPLIMENT_AMOUNT: row.RATE_SINGLE_SPPLIMENT_AMOUNT,

      CREATED_ON: row.CREATED_ON,
      CREATED_BY: row.CREATED_BY,
      CHANGED_ON: row.CHANGED_ON,
      CHANGED_BY: row.CHANGED_BY,
    });
  }

  const options = Array.from(optionsMap.values());
  options.sort((a, b) => {
    const sa = a.SORT_ORDER ?? 999999;
    const sb = b.SORT_ORDER ?? 999999;
    if (sa !== sb) return sa - sb;
    return String(a.OPTION_NAME || "").localeCompare(
      String(b.OPTION_NAME || ""),
    );
  });

  return options;
}

// BODY example:
// {
//   "QOUTATION_ID": 123,
//   "COMPANY_ID": 10,        // ⛔️ ignored, backend COMPANY_ID is used
//   "OPTIONS": [
//     {
//       "OPTION_ID": "opt-1",
//       "OPTION_NAME": "OPTION ONE",
//       "SORT_ORDER": 1,
//       "ROOMS": [ ... ],
//       "DELETED": { "HOTEL_IDS": [...], "RATE_IDS": [...] }
//     }
//   ]
// }
async function saveQuotationAccommodation(req, res) {
  const companyId = getCompanyId(req);
  if (companyId == null) {
    return res
      .status(401)
      .json({ message: "COMPANY_ID not found for current user" });
  }

  const userFromToken = req.user;
  const currentUserId = userFromToken && userFromToken.USER_ID;
  if (!currentUserId) {
    return res.status(401).json({ message: "Unauthorized: USER_ID missing" });
  }

  const body = req.body || {};

  const qidRaw =
    body.QOUTATION_ID ||
    body.quotationId ||
    req.params.QOUTATION_ID ||
    req.params.quotationId;

  const QOUTATION_ID = parseInt(qidRaw, 10);
  if (!QOUTATION_ID || Number.isNaN(QOUTATION_ID)) {
    return res
      .status(400)
      .json({ message: "QOUTATION_ID is required and must be a number" });
  }

  const OPTIONS = body.OPTIONS;
  if (!Array.isArray(OPTIONS) || OPTIONS.length === 0) {
    return res
      .status(400)
      .json({ message: "OPTIONS must be a non-empty array" });
  }

  for (let i = 0; i < OPTIONS.length; i += 1) {
    const opt = OPTIONS[i];
    if (!opt || !opt.OPTION_ID || !opt.OPTION_NAME) {
      return res.status(400).json({
        message: `Each option must have OPTION_ID and OPTION_NAME (invalid at index ${i})`,
      });
    }
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const opt of OPTIONS) {
      const OPTION_ID = opt.OPTION_ID;
      const OPTION_NAME = opt.OPTION_NAME;
      const SORT_ORDER = opt.SORT_ORDER ?? null;

      // 1) UPSERT option row
      await dbService.upsert(
        ACCOM_OPTIONS_TABLE,
        {
          QOUTATION_ID,
          OPTION_ID,
          OPTION_NAME,
          SORT_ORDER,
        },
        ["COMPANY_ID", "QOUTATION_ID", "OPTION_ID"],
        {
          companyId,
          connection,
          auditUserId: currentUserId,
        },
      );

      // 2) Apply DELETED.HOTEL_IDS / DELETED.RATE_IDS
      const deleted = opt.DELETED || {};
      const rateIds = Array.isArray(deleted.RATE_IDS) ? deleted.RATE_IDS : [];
      const hotelIds = Array.isArray(deleted.HOTEL_IDS)
        ? deleted.HOTEL_IDS
        : [];

      if (rateIds.length > 0) {
        const placeholders = rateIds.map(() => "?").join(", ");
        const sql = `
          DELETE FROM ${ACCOM_ROOMS_TABLE}
          WHERE COMPANY_ID = ?
            AND QOUTATION_ID = ?
            AND OPTION_ID = ?
            AND RATE_ID IN (${placeholders})
        `;
        await connection.query(sql, [
          companyId,
          QOUTATION_ID,
          OPTION_ID,
          ...rateIds,
        ]);
      }

      if (hotelIds.length > 0) {
        const placeholders = hotelIds.map(() => "?").join(", ");
        const sql = `
          DELETE FROM ${ACCOM_ROOMS_TABLE}
          WHERE COMPANY_ID = ?
            AND QOUTATION_ID = ?
            AND OPTION_ID = ?
            AND HOTEL_ID IN (${placeholders})
        `;
        await connection.query(sql, [
          companyId,
          QOUTATION_ID,
          OPTION_ID,
          ...hotelIds,
        ]);
      }

      // 3) UPSERT each ROOM row
      const rooms = Array.isArray(opt.ROOMS) ? opt.ROOMS : [];
      for (const room of rooms) {
        if (!room) continue;

        const HOTEL_ID = room.HOTEL_ID;
        const SEASON_ID = room.SEASON_ID;
        const RATE_ID = room.RATE_ID;

        if (HOTEL_ID == null || SEASON_ID == null || RATE_ID == null) {
          continue;
        }

        const RATE_FOR_ID = room.RATE_FOR_ID ?? null;
        const NIGHTS = room.NIGHTS ?? null;
        const GUESTS = room.GUESTS ?? null;

        const RATE_AMOUNT = room.RATE_AMOUNT ?? null;
        const RATE_HALF_BOARD_AMOUNT = room.RATE_HALF_BOARD_AMOUNT ?? null;
        const RATE_FULL_BOARD_AMOUNT = room.RATE_FULL_BOARD_AMOUNT ?? null;
        const RATE_SINGLE_SPPLIMENT_AMOUNT =
          room.RATE_SINGLE_SPPLIMENT_AMOUNT ?? null;

        await dbService.upsert(
          ACCOM_ROOMS_TABLE,
          {
            QOUTATION_ID,
            OPTION_ID,
            HOTEL_ID,
            SEASON_ID,
            RATE_ID,
            RATE_FOR_ID,
            NIGHTS,
            GUESTS,
            RATE_AMOUNT,
            RATE_HALF_BOARD_AMOUNT,
            RATE_FULL_BOARD_AMOUNT,
            RATE_SINGLE_SPPLIMENT_AMOUNT,
          },
          ["COMPANY_ID", "QOUTATION_ID", "OPTION_ID", "SEASON_ID", "RATE_ID"],
          {
            companyId,
            connection,
            auditUserId: currentUserId,
          },
        );
      }
    }

    await connection.commit();

    return res.json({
      message: "Quotation accommodation saved",
      QOUTATION_ID,
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error(
          "saveQuotationAccommodation rollback error:",
          rollbackErr,
        );
      }
    }
    console.error("saveQuotationAccommodation error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  listHotelSeasonRates,
  saveQuotationAccommodation,
  getQuotationAccommodation,
};
