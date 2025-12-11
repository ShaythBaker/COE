// modules/flights/flights.controller.js
const axios = require("axios");

const OPEN_SKY_AUTH_URL =
  process.env.OPENSKY_AUTH_URL ||
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

const OPEN_SKY_API_BASE =
  process.env.OPENSKY_API_BASE || "https://opensky-network.org/api";

/**
 * OAuth2 token for API client (client_credentials).
 */
async function getOpenSkyToken() {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET are not set");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await axios.post(OPEN_SKY_AUTH_URL, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10000,
  });

  const token = response.data && response.data.access_token;
  if (!token) {
    throw new Error("No access_token in OpenSky auth response");
  }

  return token;
}

/**
 * Add correct authentication to axios config:
 * - OAuth2 (client_id / client_secret), or
 * - legacy basic auth (username / password), or
 * - anonymous (if neither is provided).
 */
async function buildAuthConfig(baseConfig = {}) {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  const username = process.env.OPENSKY_USERNAME;
  const password = process.env.OPENSKY_PASSWORD;

  const config = { ...baseConfig };

  if (clientId && clientSecret) {
    const token = await getOpenSkyToken();
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  } else if (username && password) {
    config.auth = { username, password };
  }

  return config;
}

function normalizeCallsign(v) {
  if (!v) return "";
  return String(v).trim().toUpperCase();
}

/**
 * /states/all — live state vectors
 */
async function fetchStatesAll() {
  const config = await buildAuthConfig({
    params: {
      extended: 1, // include category field
    },
    timeout: 15000,
  });

  const response = await axios.get(`${OPEN_SKY_API_BASE}/states/all`, config);
  return response.data;
}

/**
 * /flights/aircraft — historical flights by aircraft (for airport info)
 */
async function fetchFlightsByAircraft(icao24) {
  if (!icao24) return [];

  const now = Math.floor(Date.now() / 1000);
  const twoDays = 2 * 24 * 60 * 60;

  const end = now;
  const begin = end - (twoDays - 60); // just under 2 days, inside limit

  const config = await buildAuthConfig({
    params: {
      icao24: String(icao24).toLowerCase(),
      begin,
      end,
    },
    timeout: 20000,
    validateStatus: (s) => s < 500, // handle 404 manually
  });

  const response = await axios.get(
    `${OPEN_SKY_API_BASE}/flights/aircraft`,
    config
  );

  if (response.status === 404) {
    return [];
  }

  return Array.isArray(response.data) ? response.data : [];
}

/**
 * GET /api/flights/status/:flightNumber
 * Live status (IN_AIR / ON_GROUND) + best-effort departure/arrival airports
 */
async function getFlightStatus(req, res) {
  try {
    const rawFlightNumber = req.params.flightNumber || "";
    const flightNumber = normalizeCallsign(rawFlightNumber);

    if (!flightNumber) {
      return res
        .status(400)
        .json({ message: "flightNumber path parameter is required" });
    }

    // 1) live state
    const data = await fetchStatesAll();
    const states = Array.isArray(data.states) ? data.states : [];

    if (!states.length) {
      return res.status(404).json({
        message: "No states returned from OpenSky",
      });
    }

    const matches = states.filter((state) => {
      const callsign = normalizeCallsign(state[1]);
      return callsign === flightNumber;
    });

    if (!matches.length) {
      return res.status(404).json({
        message: `No live state found for callsign ${flightNumber}`,
      });
    }

    const s = matches[0];

    const icao24 = s[0];
    const callsign = normalizeCallsign(s[1]);
    const origin_country = s[2];
    const time_position = s[3];
    const last_contact = s[4];
    const longitude = s[5];
    const latitude = s[6];
    const baro_altitude = s[7];
    const on_ground = s[8];
    const velocity = s[9];
    const true_track = s[10];
    const vertical_rate = s[11];
    const sensors = s[12];
    const geo_altitude = s[13];
    const squawk = s[14];
    const spi = s[15];
    const position_source = s[16];
    const category = s[17];

    const status = on_ground ? "ON_GROUND" : "IN_AIR";

    // 2) airport info (historical)
    let departureAirport = null;
    let arrivalAirport = null;
    let departureTime = null;
    let arrivalTime = null;

    try {
      const flights = await fetchFlightsByAircraft(icao24);
      if (flights && flights.length) {
        const latest = flights.reduce((a, b) =>
          (a.lastSeen || 0) > (b.lastSeen || 0) ? a : b
        );

        departureAirport = latest.estDepartureAirport || null;
        arrivalAirport = latest.estArrivalAirport || null;
        departureTime = latest.firstSeen || null;
        arrivalTime = latest.lastSeen || null;
      }
    } catch (e) {
      console.error("fetchFlightsByAircraft error:", e.response?.data || e);
    }

    const result = {
      flightNumber: callsign || flightNumber,
      status,
      opensky_time: data.time || null,

      origin_country,
      last_contact,
      time_position,

      position: {
        latitude,
        longitude,
        baro_altitude,
        geo_altitude,
      },

      speed: {
        velocity,
        true_track,
        vertical_rate,
      },

      transponder: {
        squawk,
        spi,
      },

      aircraft: {
        icao24,
        category,
        position_source,
        sensors,
      },

      airports: {
        departure: departureAirport,
        arrival: arrivalAirport,
        departureTime,
        arrivalTime,
      },
    };

    return res.json(result);
  } catch (err) {
    console.error(
      "getFlightStatus error:",
      err.response?.status,
      err.response?.data || err.message
    );

    if (err.response) {
      const { status, data } = err.response;

      if (status === 401) {
        return res.status(502).json({
          message:
            "Unauthorized calling OpenSky API (check OAuth client or username/password).",
          providerStatus: status,
          providerResponse: data,
        });
      }

      if (status === 429) {
        return res.status(502).json({
          message: "OpenSky rate limit reached.",
          providerStatus: status,
          providerResponse: data,
        });
      }
    }

    return res.status(500).json({
      message: "Failed to retrieve flight status from OpenSky",
    });
  }
}

/**
 * GET /api/flights/arrivals?airport=EDDF&begin=...&end=...
 * Wraps OpenSky: GET /flights/arrival
 */
async function getArrivalsByAirport(req, res) {
  try {
    const airport = (req.query.airport || "").trim().toUpperCase();
    const begin = parseInt(req.query.begin, 10);
    const end = parseInt(req.query.end, 10);

    if (!airport || Number.isNaN(begin) || Number.isNaN(end)) {
      return res.status(400).json({
        message: "airport, begin and end query parameters are required",
      });
    }

    const maxInterval = 2 * 24 * 60 * 60; // 2 days
    if (end - begin > maxInterval) {
      return res.status(400).json({
        message: "Time interval for arrivals must not be larger than 2 days",
      });
    }

    const config = await buildAuthConfig({
      params: { airport, begin, end },
      timeout: 20000,
      validateStatus: (s) => s < 500,
    });

    const response = await axios.get(
      `${OPEN_SKY_API_BASE}/flights/arrival`,
      config
    );

    if (response.status === 404) {
      return res.status(404).json({
        message: "No arrivals found for that airport and period",
        flights: [],
      });
    }

    // OpenSky returns an array of flights; we forward it directly
    return res.json(response.data);
  } catch (err) {
    console.error(
      "getArrivalsByAirport error:",
      err.response?.status,
      err.response?.data || err.message
    );

    return res.status(500).json({
      message: "Failed to retrieve arrivals from OpenSky",
    });
  }
}

/**
 * GET /api/flights/departures?airport=EDDF&begin=...&end=...
 * Wraps OpenSky: GET /flights/departure
 */
async function getDeparturesByAirport(req, res) {
  try {
    const airport = (req.query.airport || "").trim().toUpperCase();
    const begin = parseInt(req.query.begin, 10);
    const end = parseInt(req.query.end, 10);

    if (!airport || Number.isNaN(begin) || Number.isNaN(end)) {
      return res.status(400).json({
        message: "airport, begin and end query parameters are required",
      });
    }

    const minInterval = 2 * 24 * 60 * 60; // > 2 days required (docs)
    if (end - begin <= minInterval) {
      return res.status(400).json({
        message: "Time interval for departures must cover more than 2 days",
      });
    }

    const config = await buildAuthConfig({
      params: { airport, begin, end },
      timeout: 20000,
      validateStatus: (s) => s < 500,
    });

    const response = await axios.get(
      `${OPEN_SKY_API_BASE}/flights/departure`,
      config
    );

    if (response.status === 404) {
      return res.status(404).json({
        message: "No departures found for that airport and period",
        flights: [],
      });
    }

    return res.json(response.data);
  } catch (err) {
    console.error(
      "getDeparturesByAirport error:",
      err.response?.status,
      err.response?.data || err.message
    );

    return res.status(500).json({
      message: "Failed to retrieve departures from OpenSky",
    });
  }
}

/**
 * GET /api/flights/track/:icao24?time=0
 * Wraps OpenSky: GET /tracks (example: /tracks/all?icao24=3c4b26&time=0)
 */
async function getTrackByAircraft(req, res) {
  try {
    const icao24 = (req.params.icao24 || "").trim().toLowerCase();
    let time = req.query.time !== undefined ? parseInt(req.query.time, 10) : 0;

    if (!icao24) {
      return res
        .status(400)
        .json({ message: "icao24 path parameter is required" });
    }

    if (Number.isNaN(time) || time < 0) {
      return res.status(400).json({
        message: "time query parameter must be a non-negative integer (seconds)",
      });
    }

    const config = await buildAuthConfig({
      params: { icao24, time },
      timeout: 20000,
      validateStatus: (s) => s < 500,
    });

    // Docs say /tracks, example uses /tracks/all; we follow the example.
    const response = await axios.get(
      `${OPEN_SKY_API_BASE}/tracks/all`,
      config
    );

    if (response.status === 404) {
      return res.status(404).json({
        message: "No track found for that aircraft/time",
        icao24,
        time,
      });
    }

    return res.json(response.data);
  } catch (err) {
    console.error(
      "getTrackByAircraft error:",
      err.response?.status,
      err.response?.data || err.message
    );

    return res.status(500).json({
      message: "Failed to retrieve track from OpenSky",
    });
  }
}

module.exports = {
  getFlightStatus,
  getArrivalsByAirport,
  getDeparturesByAirport,
  getTrackByAircraft,
};
