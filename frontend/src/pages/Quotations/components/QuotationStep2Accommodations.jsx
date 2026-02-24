import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Collapse,
  Input,
  Label,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  Popover,
  PopoverBody,
  Table,
} from "reactstrap";
import classnames from "classnames";
import { get, post } from "/src/helpers/api_helper";

const QuotationStep2Accommodations = ({
  value = [],
  onChange,
  arrivingDate,
  departingDate,
  qoutationId,
}) => {
  // -------------------- helpers --------------------
  const normalizeErr = (e) =>
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    "Unexpected error";

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
    if (!d || Number.isNaN(d.getTime())) return String(raw || "");
    return d.toLocaleDateString();
  };

  const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

  const groupBy = (arr, keyFn) => {
    const map = new Map();
    (arr || []).forEach((x) => {
      const k = keyFn(x);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(x);
    });
    return map;
  };

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const clampInt = (v, min, max) => {
    const n = Math.floor(toNum(v));
    if (n < min) return min;
    if (n > max) return max;
    return n;
  };

  const clampMoney = (v) => {
    const n = toNum(v);
    if (n < 0) return 0;
    return Math.round(n * 100) / 100;
  };

  const makeId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const normalizeValueToOptions = (v) => {
    const arr = Array.isArray(v) ? v : [];

    if (arr.length > 0 && Array.isArray(arr[0]?.hotels)) return arr;

    if (arr.length > 0 && arr[0]?.HOTEL_ID) {
      return [
        {
          OPTION_ID: "1",
          OPTION_NAME: "Option 1",
          hotels: arr,
          DELETED: { HOTEL_IDS: [], RATE_IDS: [] },
        },
      ];
    }

    return [];
  };

  // -------------------- UI-owned options state --------------------
  const [uiOptions, setUiOptions] = useState(() =>
    normalizeValueToOptions(value),
  );

  useEffect(() => {
    const incoming = normalizeValueToOptions(value);
    if (uiOptions.length === 0 && incoming.length > 0) {
      setUiOptions(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emitOptional = (next) => {
    if (typeof onChange === "function") onChange(next);
  };

  // -------------------- local state --------------------
  const [loadingInit, setLoadingInit] = useState(false);
  const [initError, setInitError] = useState(null);
  const [allRates, setAllRates] = useState([]);

  const [filterArea, setFilterArea] = useState("");
  const [filterStars, setFilterStars] = useState("");
  const [filterChain, setFilterChain] = useState("");
  const [filterHotelName, setFilterHotelName] = useState("");

  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [filteredError, setFilteredError] = useState(null);
  const [filteredRates, setFilteredRates] = useState([]);

  // accommodation (edit mode) load/save
  const [loadingAccommodation, setLoadingAccommodation] = useState(false);
  const [savingAccommodation, setSavingAccommodation] = useState(false);
  const [accommodationError, setAccommodationError] = useState(null);
  const [accommodationSavedMsg, setAccommodationSavedMsg] = useState(null);

  const [expandedOptions, setExpandedOptions] = useState({});
  const [expandedHotels, setExpandedHotels] = useState({});
  const [expandedSeasons, setExpandedSeasons] = useState({});

  // -------------------- UX helpers (no logic changes) --------------------
  const [hoveredAvailHotelId, setHoveredAvailHotelId] = useState(null);
  const [hoveredSelectedRoomKey, setHoveredSelectedRoomKey] = useState(null);

  // Room edit modal (UX only)
  const [roomEditModalOpen, setRoomEditModalOpen] = useState(false);
  const [roomEditModalCtx, setRoomEditModalCtx] = useState(null); // { optionId, hotelId, seasonId, roomId }

  const [hotelDetailsModalOpen, setHotelDetailsModalOpen] = useState(false);
  const [hotelDetailsModalCtx, setHotelDetailsModalCtx] = useState(null); // { optionId, hotelId }

  const [optionDetailsModalOpen, setOptionDetailsModalOpen] = useState(false);
  const [optionDetailsModalId, setOptionDetailsModalId] = useState(null);

  const [addToOptionId, setAddToOptionId] = useState("");

  useEffect(() => {
    if (uiOptions.length === 0) {
      setAddToOptionId("");
      return;
    }
    if (
      !addToOptionId ||
      !uiOptions.some((o) => String(o.OPTION_ID) === String(addToOptionId))
    ) {
      setAddToOptionId(String(uiOptions[0].OPTION_ID));
    }
  }, [uiOptions, addToOptionId]);

  // -------------------- calculations --------------------
  // We keep pricing as BB base + separate add-ons (HB/FB) + single supplement.
  // No board selection per room.
  const calcRoomCosts = (room) => {
    const nights = clampInt(room?.NIGHTS ?? 1, 1, 365);
    const guests = clampInt(room?.GUESTS ?? 1, 1, 10);

    const bb = toNum(room?.RATE_AMOUNT);
    const hb = toNum(room?.RATE_HALF_BOARD_AMOUNT);
    const fb = toNum(room?.RATE_FULL_BOARD_AMOUNT);
    const singleSupp = toNum(room?.RATE_SINGLE_SPPLIMENT_AMOUNT);

    // Component totals (per person)
    const bbPP = nights * bb;
    const hbAddonPP = nights * hb;
    const fbAddonPP = nights * fb;
    const singleSuppPP = nights * singleSupp;

    // Component totals including guests
    const bbTotal = bbPP * guests;
    const hbAddonTotal = hbAddonPP * guests;
    const fbAddonTotal = fbAddonPP * guests;
    const singleSuppTotal = singleSuppPP * guests;

    // Single person (1 guest) in a DOUBLE room pricing examples
    const singleInDblBB = nights * (bb + singleSupp);
    const singleInDblHB = nights * (bb + hb + singleSupp);
    const singleInDblFB = nights * (bb + fb + singleSupp);

    return {
      nights,
      guests,
      bbPP,
      hbAddonPP,
      fbAddonPP,
      singleSuppPP,
      bbTotal,
      hbAddonTotal,
      fbAddonTotal,
      singleSuppTotal,
      singleInDblBB,
      singleInDblHB,
      singleInDblFB,
    };
  };

  // Subtotals sum the component totals (BB base + add-ons) including guests.
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

  // -------------------- UX quick analytics helpers --------------------
  const getAvailHotelStats = (h) => {
    const seasons = Array.isArray(h?.SEASONS) ? h.SEASONS : [];
    let rooms = 0;
    let bbMin = null;
    let bbMax = null;
    seasons.forEach((s) => {
      const rs = Array.isArray(s?.ROOMS) ? s.ROOMS : [];
      rooms += rs.length;
      rs.forEach((r) => {
        const bb = toNum(r?.RATE_AMOUNT);
        if (bbMin === null || bb < bbMin) bbMin = bb;
        if (bbMax === null || bb > bbMax) bbMax = bb;
      });
    });
    return { seasons: seasons.length, rooms, bbMin, bbMax };
  };

  const getSelectedHotelStats = (hotel) => {
    const seasons = Array.isArray(hotel?.seasons) ? hotel.seasons : [];
    let rooms = 0;
    let bbMin = null;
    let bbMax = null;
    seasons.forEach((s) => {
      const rs = Array.isArray(s?.rooms) ? s.rooms : [];
      rooms += rs.length;
      rs.forEach((r) => {
        const bb = toNum(r?.RATE_AMOUNT);
        if (bbMin === null || bb < bbMin) bbMin = bb;
        if (bbMax === null || bb > bbMax) bbMax = bb;
      });
    });
    return { seasons: seasons.length, rooms, bbMin, bbMax };
  };

  const openHotelDetailsModal = (optionId, hotelId) => {
    setHotelDetailsModalCtx({
      optionId: String(optionId),
      hotelId: String(hotelId),
    });
    setHotelDetailsModalOpen(true);
  };

  const closeHotelDetailsModal = () => {
    setHotelDetailsModalOpen(false);
    setHotelDetailsModalCtx(null);
    setHoveredSelectedRoomKey(null);
  };

  const getOptionStats = (opt) => {
    const hotels = Array.isArray(opt?.hotels) ? opt.hotels : [];
    let seasons = 0;
    let rooms = 0;
    hotels.forEach((h) => {
      const ss = Array.isArray(h?.seasons) ? h.seasons : [];
      seasons += ss.length;
      ss.forEach((s) => {
        const rs = Array.isArray(s?.rooms) ? s.rooms : [];
        rooms += rs.length;
      });
    });
    return { hotels: hotels.length, seasons, rooms };
  };

  const openOptionDetailsModal = (optionId) => {
    setOptionDetailsModalId(String(optionId));
    setOptionDetailsModalOpen(true);
  };

  const closeOptionDetailsModal = () => {
    setOptionDetailsModalOpen(false);
    setOptionDetailsModalId(null);
  };

  const openRoomEditModal = (optionId, hotelId, seasonId, roomId) => {
    setRoomEditModalCtx({
      optionId: String(optionId),
      hotelId: String(hotelId),
      seasonId: String(seasonId),
      roomId: String(roomId),
    });
    setRoomEditModalOpen(true);
  };

  const closeRoomEditModal = () => {
    setRoomEditModalOpen(false);
    setRoomEditModalCtx(null);
  };

  // Grand totals removed: keep calculations per option only.

  const removeRoomFromHotel = (optionId, hotelId, seasonId, roomId) => {
    setUiOptions((prev) => {
      const next = prev.map((opt) => {
        if (String(opt?.OPTION_ID) !== String(optionId)) return opt;

        const deleted = opt.DELETED || { HOTEL_IDS: [], RATE_IDS: [] };
        const nextRateIds = uniq([...(deleted.RATE_IDS || []), roomId]);

        const hotels = (opt?.hotels || []).map((h) => {
          if (String(h?.HOTEL_ID) !== String(hotelId)) return h;

          const seasons = (h?.seasons || []).map((s) => {
            if (String(s?.SEASON_ID) !== String(seasonId)) return s;

            return {
              ...s,
              rooms: (s?.rooms || []).filter(
                (r) => String(r?.RATE_ID) !== String(roomId),
              ),
            };
          });

          return { ...h, seasons };
        });

        return {
          ...opt,
          DELETED: { ...deleted, RATE_IDS: nextRateIds },
          hotels,
        };
      });

      emitOptional(next);
      return next;
    });
  }; // -------------------- mutations --------------------
  const updateRoom = (optionId, hotelId, seasonId, roomId, patch) => {
    setUiOptions((prev) => {
      const next = prev.map((opt) => {
        if (String(opt?.OPTION_ID) !== String(optionId)) return opt;

        const hotels = (opt?.hotels || []).map((h) => {
          if (String(h?.HOTEL_ID) !== String(hotelId)) return h;

          const seasons = (h?.seasons || []).map((s) => {
            if (String(s?.SEASON_ID) !== String(seasonId)) return s;

            const rooms = (s?.rooms || []).map((r) => {
              if (String(r?.RATE_ID) !== String(roomId)) return r;

              const merged = { ...r, ...patch };
              if (!merged.NIGHTS) merged.NIGHTS = 1;
              if (!merged.GUESTS) merged.GUESTS = 1;

              if (patch?.RATE_AMOUNT !== undefined)
                merged.RATE_AMOUNT = clampMoney(patch.RATE_AMOUNT);
              if (patch?.RATE_HALF_BOARD_AMOUNT !== undefined)
                merged.RATE_HALF_BOARD_AMOUNT = clampMoney(
                  patch.RATE_HALF_BOARD_AMOUNT,
                );
              if (patch?.RATE_FULL_BOARD_AMOUNT !== undefined)
                merged.RATE_FULL_BOARD_AMOUNT = clampMoney(
                  patch.RATE_FULL_BOARD_AMOUNT,
                );
              if (patch?.RATE_SINGLE_SPPLIMENT_AMOUNT !== undefined)
                merged.RATE_SINGLE_SPPLIMENT_AMOUNT = clampMoney(
                  patch.RATE_SINGLE_SPPLIMENT_AMOUNT,
                );

              if (patch?.NIGHTS !== undefined)
                merged.NIGHTS = clampInt(patch.NIGHTS, 1, 365);
              if (patch?.GUESTS !== undefined)
                merged.GUESTS = clampInt(patch.GUESTS, 1, 10);

              return merged;
            });

            return { ...s, rooms };
          });

          return { ...h, seasons };
        });

        return { ...opt, hotels };
      });

      emitOptional(next);
      return next;
    });
  };

  const renameOption = (optionId, name) => {
    setUiOptions((prev) => {
      const next = prev.map((o) =>
        String(o.OPTION_ID) === String(optionId)
          ? { ...o, OPTION_NAME: name }
          : o,
      );
      emitOptional(next);
      return next;
    });
  };

  const removeOption = (optionId) => {
    setUiOptions((prev) => {
      const next = prev.filter((o) => String(o.OPTION_ID) !== String(optionId));
      emitOptional(next);
      return next;
    });
  };

  const addOption = () => {
    setUiOptions((prev) => {
      const idx = prev.length + 1;
      const newOpt = {
        OPTION_ID: makeId(),
        OPTION_NAME: `Option ${idx}`,
        hotels: [],
        DELETED: { HOTEL_IDS: [], RATE_IDS: [] },
      };
      const next = [...prev, newOpt];

      setExpandedOptions((p) => ({ ...p, [String(newOpt.OPTION_ID)]: true }));
      setAddToOptionId(String(newOpt.OPTION_ID));

      emitOptional(next);
      return next;
    });
  };

  const removeHotelFromOption = (optionId, hotelId) => {
    setUiOptions((prev) => {
      const next = prev.map((o) => {
        if (String(o.OPTION_ID) !== String(optionId)) return o;

        const deleted = o.DELETED || { HOTEL_IDS: [], RATE_IDS: [] };
        const nextHotelIds = uniq([...(deleted.HOTEL_IDS || []), hotelId]);

        return {
          ...o,
          DELETED: { ...deleted, HOTEL_IDS: nextHotelIds },
          hotels: (o.hotels || []).filter(
            (h) => String(h?.HOTEL_ID) !== String(hotelId),
          ),
        };
      });
      emitOptional(next);
      return next;
    });
  };

  const addHotelToOption = (optionId, hotel) => {
    if (!hotel?.HOTEL_ID) return;

    setUiOptions((prev) => {
      let working = prev;
      if (working.length === 0) {
        working = [
          {
            OPTION_ID: makeId(),
            OPTION_NAME: "Option 1",
            hotels: [],
            DELETED: { HOTEL_IDS: [], RATE_IDS: [] },
          },
        ];
      }

      const targetId = optionId || String(working[0].OPTION_ID);

      const next = working.map((opt) => {
        if (String(opt?.OPTION_ID) !== String(targetId)) return opt;

        const exists = (opt.hotels || []).some(
          (x) => String(x?.HOTEL_ID) === String(hotel.HOTEL_ID),
        );
        if (exists) return opt;

        const seasons = (hotel?.SEASONS || []).map((s) => {
          const rooms = (s?.ROOMS || []).map((r) => ({
            RATE_ID: r?.RATE_ID,
            RATE_FOR_ID: r?.RATE_FOR_ID,
            RATE_FOR_NAME: r?.RATE_FOR_NAME,
            RATE_AMOUNT: clampMoney(r?.RATE_AMOUNT),
            RATE_HALF_BOARD_AMOUNT: clampMoney(r?.RATE_HALF_BOARD_AMOUNT),
            RATE_FULL_BOARD_AMOUNT: clampMoney(r?.RATE_FULL_BOARD_AMOUNT),
            RATE_SINGLE_SPPLIMENT_AMOUNT: clampMoney(
              r?.RATE_SINGLE_SPPLIMENT_AMOUNT,
            ),

            // UI editable fields
            NIGHTS: 1,
            GUESTS: 1,
          }));

          rooms.sort((a, b) =>
            String(a.RATE_FOR_NAME || "").localeCompare(
              String(b.RATE_FOR_NAME || ""),
            ),
          );

          return {
            SEASON_ID: s?.SEASON_ID,
            SEASON_NAME: s?.SEASON_NAME,
            SEASON_START_DATE: s?.SEASON_START_DATE,
            SEASON_END_DATE: s?.SEASON_END_DATE,
            rooms,
          };
        });

        seasons.sort((a, b) =>
          String(a.SEASON_START_DATE || "").localeCompare(
            String(b.SEASON_START_DATE || ""),
          ),
        );

        const hotelOption = {
          HOTEL_ID: hotel.HOTEL_ID,
          HOTEL_NAME: hotel.HOTEL_NAME,
          HOTEL_CHAIN_NAME: hotel.HOTEL_CHAIN_NAME,
          HOTEL_STARS: hotel.HOTEL_STARS,
          HOTEL_AREA_NAME: hotel.HOTEL_AREA_NAME,
          HOTEL_ADDRESS: hotel.HOTEL_ADDRESS,
          HOTEL_PHONE: hotel.HOTEL_PHONE,
          seasons,
        };

        return { ...opt, hotels: [...(opt.hotels || []), hotelOption] };
      });

      const optKey = String(targetId);
      setExpandedOptions((p) => ({ ...p, [optKey]: true }));
      setExpandedHotels((p) => ({
        ...p,
        [`${optKey}:${hotel.HOTEL_ID}`]: true,
      }));

      emitOptional(next);
      return next;
    });
  };

  const hasRequiredDates = !!arrivingDate && !!departingDate;

  const buildParams = (extra = {}) => {
    const params = {
      ARRIVING_DATE: arrivingDate,
      DEPARTURE_DATE: departingDate,
      ...extra,
    };
    // Clean empties
    Object.keys(params).forEach((k) => {
      if (params[k] === "" || params[k] === null || params[k] === undefined) {
        delete params[k];
      }
    });
    return params;
  };

  // -------------------- accommodation GET/POST (edit/save) --------------------
  const buildUiOptionsFromAccommodation = (payload) => {
    const opts = Array.isArray(payload?.OPTIONS) ? payload.OPTIONS : [];
    return opts.map((opt) => {
      const rooms = Array.isArray(opt?.ROOMS) ? opt.ROOMS : [];
      const byHotel = groupBy(rooms, (r) => String(r?.HOTEL_ID));

      const hotels = Array.from(byHotel.entries()).map(([hotelId, hRooms]) => {
        const h0 = hRooms[0] || {};
        const bySeason = groupBy(hRooms, (r) => String(r?.SEASON_ID));

        const seasons = Array.from(bySeason.entries()).map(
          ([seasonId, sRooms]) => {
            const s0 = sRooms[0] || {};
            const mappedRooms = (sRooms || []).map((r) => ({
              RATE_ID: r?.RATE_ID,
              RATE_FOR_ID: r?.RATE_FOR_ID,
              RATE_FOR_NAME: r?.RATE_FOR_NAME,

              RATE_AMOUNT: clampMoney(r?.RATE_AMOUNT),
              RATE_HALF_BOARD_AMOUNT: clampMoney(r?.RATE_HALF_BOARD_AMOUNT),
              RATE_FULL_BOARD_AMOUNT: clampMoney(r?.RATE_FULL_BOARD_AMOUNT),
              RATE_SINGLE_SPPLIMENT_AMOUNT: clampMoney(
                r?.RATE_SINGLE_SPPLIMENT_AMOUNT,
              ),

              NIGHTS: clampInt(r?.NIGHTS ?? 1, 1, 365),
              GUESTS: clampInt(r?.GUESTS ?? 1, 1, 10),
            }));

            mappedRooms.sort((a, b) =>
              String(a.RATE_FOR_NAME || "").localeCompare(
                String(b.RATE_FOR_NAME || ""),
              ),
            );

            return {
              SEASON_ID: s0?.SEASON_ID ?? seasonId,
              SEASON_NAME: s0?.SEASON_NAME,
              SEASON_START_DATE: s0?.SEASON_START_DATE,
              SEASON_END_DATE: s0?.SEASON_END_DATE,
              rooms: mappedRooms,
            };
          },
        );

        seasons.sort((a, b) =>
          String(a.SEASON_START_DATE || "").localeCompare(
            String(b.SEASON_START_DATE || ""),
          ),
        );

        return {
          HOTEL_ID: h0?.HOTEL_ID ?? hotelId,
          HOTEL_NAME: h0?.HOTEL_NAME,

          // keep IDs too (optional but useful)
          HOTEL_CHAIN: h0?.HOTEL_CHAIN ?? h0?.HOTEL_CHAIN_ID ?? null,
          HOTEL_AREA: h0?.HOTEL_AREA ?? h0?.HOTEL_AREA_ID ?? null,

          // ✅ display labels (prefer explicit *_NAME fields)
          HOTEL_CHAIN_NAME:
            h0?.HOTEL_CHAIN_NAME ??
            h0?.HOTEL_CHAIN_LABEL ??
            (h0?.HOTEL_CHAIN ? String(h0.HOTEL_CHAIN) : null),

          HOTEL_STARS: h0?.HOTEL_STARS,

          HOTEL_AREA_NAME:
            h0?.HOTEL_AREA_NAME ??
            h0?.HOTEL_AREA_LABEL ??
            (h0?.HOTEL_AREA ? String(h0.HOTEL_AREA) : null),

          HOTEL_ADDRESS: h0?.HOTEL_ADDRESS,
          HOTEL_PHONE: h0?.HOTEL_PHONE,
          seasons,
        };
      });

      hotels.sort((a, b) =>
        String(a.HOTEL_NAME || "").localeCompare(String(b.HOTEL_NAME || "")),
      );

      return {
        OPTION_ID: opt?.OPTION_ID,
        OPTION_NAME: opt?.OPTION_NAME,
        SORT_ORDER: opt?.SORT_ORDER,
        hotels,
        DELETED: { HOTEL_IDS: [], RATE_IDS: [] },
      };
    });
  };

  const buildSavePayload = (options) => {
    return {
      OPTIONS: (options || []).map((opt, idx) => {
        const roomsFlat = [];
        (opt?.hotels || []).forEach((h) => {
          (h?.seasons || []).forEach((s) => {
            (s?.rooms || []).forEach((r) => {
              roomsFlat.push({
                HOTEL_ID: h?.HOTEL_ID,
                SEASON_ID: s?.SEASON_ID,
                RATE_ID: r?.RATE_ID,
                RATE_FOR_ID: r?.RATE_FOR_ID,
                NIGHTS: clampInt(r?.NIGHTS ?? 1, 1, 365),
                GUESTS: clampInt(r?.GUESTS ?? 1, 1, 10),
                RATE_AMOUNT: clampMoney(r?.RATE_AMOUNT),
                RATE_HALF_BOARD_AMOUNT: clampMoney(r?.RATE_HALF_BOARD_AMOUNT),
                RATE_FULL_BOARD_AMOUNT: clampMoney(r?.RATE_FULL_BOARD_AMOUNT),
                RATE_SINGLE_SPPLIMENT_AMOUNT: clampMoney(
                  r?.RATE_SINGLE_SPPLIMENT_AMOUNT,
                ),
              });
            });
          });
        });

        const deleted = opt?.DELETED || { HOTEL_IDS: [], RATE_IDS: [] };

        return {
          OPTION_ID: opt?.OPTION_ID,
          OPTION_NAME: opt?.OPTION_NAME,
          SORT_ORDER: opt?.SORT_ORDER ?? idx + 1,
          ROOMS: roomsFlat,
          DELETED: {
            HOTEL_IDS: uniq(deleted?.HOTEL_IDS || []),
            RATE_IDS: uniq(deleted?.RATE_IDS || []),
          },
        };
      }),
    };
  };

  const loadAccommodation = async () => {
    if (!qoutationId) return;
    setAccommodationSavedMsg(null);
    setAccommodationError(null);
    setLoadingAccommodation(true);
    try {
      const res = await get(
        `/api/qoutations/step2/${qoutationId}/accommodation`,
      );
      const payload = res?.data || res || {};
      const mapped = buildUiOptionsFromAccommodation(payload);
      setUiOptions(mapped);
      emitOptional(mapped);
    } catch (e) {
      setAccommodationError(normalizeErr(e));
    } finally {
      setLoadingAccommodation(false);
    }
  };

  const saveAccommodation = async () => {
    if (!qoutationId) {
      setAccommodationError("Missing QOUTATION_ID (route param).");
      return;
    }
    setAccommodationSavedMsg(null);
    setAccommodationError(null);
    setSavingAccommodation(true);
    try {
      const body = buildSavePayload(uiOptions);
      const res = await post(
        `/api/qoutations/step2/${qoutationId}/accommodation`,
        body,
      );
      const payload = res?.data || res || {};
      setAccommodationSavedMsg(payload?.message || "Accommodation saved");
      // Clear delete queues after a successful save
      setUiOptions((prev) => {
        const cleared = (prev || []).map((o) => ({
          ...o,
          DELETED: { HOTEL_IDS: [], RATE_IDS: [] },
        }));
        emitOptional(cleared);
        return cleared;
      });
    } catch (e) {
      setAccommodationError(normalizeErr(e));
    } finally {
      setSavingAccommodation(false);
    }
  };

  useEffect(() => {
    // Load existing data in edit mode
    if (qoutationId) loadAccommodation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qoutationId]);

  // -------------------- initial load for dropdowns --------------------
  useEffect(() => {
    const load = async () => {
      if (!hasRequiredDates) {
        setInitError(
          "ARRIVING_DATE and DEPARTURE_DATE are required to load hotel season rates.",
        );
        setAllRates([]);
        setFilteredRates([]);
        return;
      }

      setLoadingInit(true);
      setInitError(null);
      try {
        const res = await get("/api/qoutations/step2/hotel-season-rates", {
          params: buildParams(),
        });
        const data = res?.data || res || [];
        const hotels = Array.isArray(data) ? data : [];
        setAllRates(hotels);
        setFilteredRates(hotels);
      } catch (e) {
        setInitError(normalizeErr(e));
        setAllRates([]);
        setFilteredRates([]);
      } finally {
        setLoadingInit(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivingDate, departingDate]);

  const areaOptions = useMemo(() => {
    const seen = new Map();
    (allRates || []).forEach((h) => {
      const id = h?.HOTEL_AREA;
      const name = h?.HOTEL_AREA_NAME;
      if (id === null || id === undefined || id === "") return;
      if (!seen.has(String(id))) seen.set(String(id), { id, name });
    });
    return Array.from(seen.values()).sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || "")),
    );
  }, [allRates]);

  const starsOptions = useMemo(() => {
    return uniq(allRates.map((r) => String(r?.HOTEL_STARS ?? "")))
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b));
  }, [allRates]);

  const fetchFiltered = async (override = {}) => {
    if (!hasRequiredDates) return;

    const area = override.AREA ?? filterArea;
    const stars = override.HOTEL_STARS ?? filterStars;
    const chain = override.HOTEL_CHAIN ?? filterChain;
    const hotelName = override.HOTEL_NAME ?? filterHotelName;

    setLoadingFiltered(true);
    setFilteredError(null);
    try {
      const params = buildParams({
        AREA: area,
        HOTEL_STARS: stars,
        HOTEL_CHAIN: chain,
        HOTEL_NAME: hotelName,
      });

      const res = await get("/api/qoutations/step2/hotel-season-rates", {
        params,
      });
      const data = res?.data || res || [];
      setFilteredRates(Array.isArray(data) ? data : []);
    } catch (e) {
      setFilteredError(normalizeErr(e));
      setFilteredRates([]);
    } finally {
      setLoadingFiltered(false);
    }
  };

  useEffect(() => {
    setFilterChain("");
    setFilterHotelName("");
    fetchFiltered({ HOTEL_CHAIN: "", HOTEL_NAME: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterArea, filterStars]);

  const chainOptions = useMemo(() => {
    const seen = new Map();
    (filteredRates || []).forEach((h) => {
      const id = h?.HOTEL_CHAIN;
      const name = h?.HOTEL_CHAIN_NAME;
      if (id === null || id === undefined || id === "") return;
      if (!seen.has(String(id))) seen.set(String(id), { id, name });
    });
    return Array.from(seen.values()).sort((a, b) =>
      String(a?.name || "").localeCompare(String(b?.name || "")),
    );
  }, [filteredRates]);

  const hotelNameOptions = useMemo(() => {
    return uniq(filteredRates.map((r) => r?.HOTEL_NAME)).sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
  }, [filteredRates]);

  const visibleRates = useMemo(() => {
    let rows = filteredRates;

    if (filterChain) {
      rows = rows.filter(
        (r) => String(r?.HOTEL_CHAIN ?? "") === String(filterChain),
      );
    }
    if (filterHotelName) {
      rows = rows.filter(
        (r) => String(r?.HOTEL_NAME || "") === String(filterHotelName),
      );
    }
    return rows;
  }, [filteredRates, filterChain, filterHotelName]);

  const hotelsList = useMemo(() => {
    const hotels = Array.isArray(visibleRates) ? [...visibleRates] : [];
    hotels.sort((a, b) =>
      String(a?.HOTEL_NAME || "").localeCompare(String(b?.HOTEL_NAME || "")),
    );
    return hotels;
  }, [visibleRates]);

  // -------------------- modal-friendly renderer (same update/remove logic) --------------------
  const renderHotelSeasonsTable = (optId, hotel) => {
    const hotelId = String(hotel?.HOTEL_ID || "");
    return (
      <div>
        {(hotel?.seasons || []).map((season) => {
          const seasonId = String(season?.SEASON_ID || "");
          const sk = `${optId}:${hotelId}:${seasonId}`;
          const isSeasonOpen = true; // always expanded in modal/table renderer
          const seasonTotals = seasonSubtotal(season);

          return (
            <div className="mb-2 border rounded" key={sk}>
              <div className="d-flex align-items-center justify-content-between p-2 bg-light">
                <div>
                  <div className="fw-semibold">
                    {season?.SEASON_NAME || "Season"}
                  </div>
                  <div className="text-muted small">
                    {season?.SEASON_START_DATE
                      ? `${fmtDate(season.SEASON_START_DATE)} - ${fmtDate(season.SEASON_END_DATE)}`
                      : null}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Badge color="secondary">
                    BB: {seasonTotals.bb.toFixed(2)}
                  </Badge>
                  <Badge color="secondary">
                    HB: {seasonTotals.hb.toFixed(2)}
                  </Badge>
                  <Badge color="secondary">
                    FB: {seasonTotals.fb.toFixed(2)}
                  </Badge>
                  <Badge color="secondary">
                    Single Supp: {seasonTotals.singleSupp.toFixed(2)}
                  </Badge>
                </div>
              </div>

              <Collapse isOpen={isSeasonOpen}>
                <div className="p-2">
                  <div className="table-responsive">
                    <Table className="table table-sm align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ minWidth: 120 }}>Room</th>
                          <th
                            className="text-center"
                            style={{ width: 160, minWidth: 160 }}
                          >
                            Guests
                          </th>
                          <th
                            className="text-center"
                            style={{ width: 160, minWidth: 160 }}
                          >
                            Nights
                          </th>
                          <th style={{ minWidth: 140 }}>BB Rate</th>
                          <th style={{ minWidth: 140 }}>HB Add-on</th>
                          <th style={{ minWidth: 140 }}>FB Add-on</th>
                          <th style={{ minWidth: 160 }}>Single Supp</th>

                          <th style={{ minWidth: 190 }}>Single in DBL (BB)</th>
                          <th style={{ minWidth: 190 }}>Single in DBL (HB)</th>
                          <th style={{ minWidth: 190 }}>Single in DBL (FB)</th>

                          <th
                            className="text-center"
                            style={{ width: 120, minWidth: 120 }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {(season?.rooms || []).map((rm) => {
                          const rowId = String(
                            rm?.RATE_ID || rm?.RATE_FOR_ID || "",
                          );
                          const costs = calcRoomCosts(rm);
                          const roomAnchor = `room-${optId}-${hotelId}-${seasonId}-${rowId}`;

                          return (
                            <tr key={`${sk}:${rowId}`}>
                              <td
                                id={roomAnchor}
                                className="fw-semibold"
                                style={{ cursor: "help" }}
                                onMouseEnter={() =>
                                  setHoveredSelectedRoomKey(roomAnchor)
                                }
                                onMouseLeave={() =>
                                  setHoveredSelectedRoomKey(null)
                                }
                              >
                                {rm?.RATE_FOR_NAME || "-"}
                                <Popover
                                  isOpen={hoveredSelectedRoomKey === roomAnchor}
                                  target={roomAnchor}
                                  placement="right"
                                  fade={false}
                                >
                                  <PopoverBody>
                                    <div className="fw-semibold mb-1">
                                      {rm?.RATE_FOR_NAME || "Room"}
                                    </div>
                                    <div className="small text-muted">
                                      Guests: {costs.guests} • Nights:{" "}
                                      {costs.nights}
                                    </div>
                                    <hr className="my-2" />
                                    <div className="small">
                                      <div>
                                        <b>BB total:</b>{" "}
                                        {costs.bbTotal.toFixed(2)}
                                      </div>
                                      <div>
                                        <b>HB add-on total:</b>{" "}
                                        {costs.hbAddonTotal.toFixed(2)}
                                      </div>
                                      <div>
                                        <b>FB add-on total:</b>{" "}
                                        {costs.fbAddonTotal.toFixed(2)}
                                      </div>
                                      <div>
                                        <b>Single supp total:</b>{" "}
                                        {costs.singleSuppTotal.toFixed(2)}
                                      </div>
                                    </div>
                                  </PopoverBody>
                                </Popover>
                              </td>

                              <td className="text-center">
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={rm?.GUESTS ?? 1}
                                  onChange={(e) =>
                                    updateRoom(
                                      optId,
                                      hotelId,
                                      seasonId,
                                      rowId,
                                      { GUESTS: e.target.value },
                                    )
                                  }
                                />
                              </td>

                              <td className="text-center">
                                <Input
                                  type="number"
                                  min={1}
                                  max={365}
                                  value={rm?.NIGHTS ?? 1}
                                  onChange={(e) =>
                                    updateRoom(
                                      optId,
                                      hotelId,
                                      seasonId,
                                      rowId,
                                      { NIGHTS: e.target.value },
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={rm?.RATE_AMOUNT ?? 0}
                                  onChange={(e) =>
                                    updateRoom(
                                      optId,
                                      hotelId,
                                      seasonId,
                                      rowId,
                                      { RATE_AMOUNT: e.target.value },
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={rm?.RATE_HALF_BOARD_AMOUNT ?? 0}
                                  onChange={(e) =>
                                    updateRoom(
                                      optId,
                                      hotelId,
                                      seasonId,
                                      rowId,
                                      {
                                        RATE_HALF_BOARD_AMOUNT: e.target.value,
                                      },
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={rm?.RATE_FULL_BOARD_AMOUNT ?? 0}
                                  onChange={(e) =>
                                    updateRoom(
                                      optId,
                                      hotelId,
                                      seasonId,
                                      rowId,
                                      {
                                        RATE_FULL_BOARD_AMOUNT: e.target.value,
                                      },
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={rm?.RATE_SINGLE_SPPLIMENT_AMOUNT ?? 0}
                                  onChange={(e) =>
                                    updateRoom(
                                      optId,
                                      hotelId,
                                      seasonId,
                                      rowId,
                                      {
                                        RATE_SINGLE_SPPLIMENT_AMOUNT:
                                          e.target.value,
                                      },
                                    )
                                  }
                                />
                              </td>

                              <td className="fw-semibold">
                                {costs.singleInDblBB.toFixed(2)}
                              </td>
                              <td className="fw-semibold">
                                {costs.singleInDblHB.toFixed(2)}
                              </td>
                              <td className="fw-semibold">
                                {costs.singleInDblFB.toFixed(2)}
                              </td>

                              <td className="text-center">
                                <div className="d-flex align-items-center justify-content-center gap-1 flex-wrap">
                                  <Button
                                    color="primary"
                                    outline
                                    size="sm"
                                    title="Edit room rates"
                                    onClick={() =>
                                      openRoomEditModal(
                                        optId,
                                        hotelId,
                                        seasonId,
                                        rowId,
                                      )
                                    }
                                  >
                                    <i className="bx bx-edit-alt" />
                                  </Button>

                                  <Button
                                    color="danger"
                                    size="sm"
                                    title="Remove room"
                                    onClick={() =>
                                      removeRoomFromHotel(
                                        optId,
                                        hotelId,
                                        seasonId,
                                        rowId,
                                      )
                                    }
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </Collapse>
            </div>
          );
        })}
      </div>
    );
  };

  // -------------------- accordion toggles --------------------
  const toggleOption = (optionId) => {
    const k = String(optionId);
    setExpandedOptions((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const toggleHotel = (optionId, hotelId) => {
    const k = `${String(optionId)}:${String(hotelId)}`;
    setExpandedHotels((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const toggleSeason = (optionId, hotelId, seasonId) => {
    const k = `${String(optionId)}:${String(hotelId)}:${String(seasonId)}`;
    setExpandedSeasons((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  // -------------------- render --------------------
  return (
    <>
      <Card>
        <CardBody>
          {qoutationId ? (
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
              <Button
                color="secondary"
                outline
                size="sm"
                onClick={loadAccommodation}
                disabled={loadingAccommodation || savingAccommodation}
              >
                {loadingAccommodation ? "Loading..." : "Reload saved data"}
              </Button>

              <Button
                color="primary"
                size="sm"
                onClick={saveAccommodation}
                disabled={savingAccommodation}
              >
                {savingAccommodation ? "Saving..." : "Save Step 2"}
              </Button>

              {accommodationSavedMsg ? (
                <Badge color="success" pill>
                  {accommodationSavedMsg}
                </Badge>
              ) : null}
            </div>
          ) : null}

          {accommodationError ? (
            <Alert color="danger" className="mb-3">
              {accommodationError}
            </Alert>
          ) : null}

          <div className="d-flex flex-wrap gap-3 align-items-end">
            <div style={{ minWidth: 220 }}>
              <Label className="mb-1">Area</Label>
              <Input
                type="select"
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                disabled={loadingInit}
              >
                <option value="">All areas</option>
                {areaOptions.map((a) => (
                  <option key={String(a?.id)} value={String(a?.id)}>
                    {a?.name}
                  </option>
                ))}
              </Input>
            </div>

            <div style={{ minWidth: 140 }}>
              <Label className="mb-1">Stars</Label>
              <Input
                type="select"
                value={filterStars}
                onChange={(e) => setFilterStars(e.target.value)}
                disabled={loadingInit}
              >
                <option value="">All</option>
                {starsOptions.map((s) => (
                  <option key={String(s)} value={s}>
                    {s}
                  </option>
                ))}
              </Input>
            </div>

            <div style={{ minWidth: 220 }}>
              <Label className="mb-1">Chain</Label>
              <Input
                type="select"
                value={filterChain}
                onChange={(e) => setFilterChain(e.target.value)}
                disabled={loadingFiltered}
              >
                <option value="">All chains</option>
                {chainOptions.map((c) => (
                  <option key={String(c?.id)} value={String(c?.id)}>
                    {c?.name}
                  </option>
                ))}
              </Input>
            </div>

            <div style={{ minWidth: 260 }}>
              <Label className="mb-1">Hotel</Label>
              <Input
                type="select"
                value={filterHotelName}
                onChange={(e) => setFilterHotelName(e.target.value)}
                disabled={loadingFiltered}
              >
                <option value="">All hotels</option>
                {hotelNameOptions.map((h) => (
                  <option key={String(h)} value={h}>
                    {h}
                  </option>
                ))}
              </Input>
            </div>

            <div className="ms-auto d-flex align-items-center gap-2">
              <small className="text-muted">
                {arrivingDate ? `Arrival: ${fmtDate(arrivingDate)}` : null}
                {arrivingDate && departingDate ? " | " : null}
                {departingDate ? `Departure: ${fmtDate(departingDate)}` : null}
              </small>

              <Button
                color="primary"
                onClick={() => fetchFiltered()}
                disabled={loadingFiltered}
              >
                {loadingFiltered ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Loading
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>

          {initError ? (
            <Alert color="danger" className="mt-3 mb-0">
              {initError}
            </Alert>
          ) : null}

          <hr className="my-3" />

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <h5 className="mb-0">Available Hotels</h5>

            <div className="d-flex align-items-center gap-2">
              <Label className="mb-0 text-muted">Add to option</Label>
              <Input
                type="select"
                value={addToOptionId}
                onChange={(e) => setAddToOptionId(e.target.value)}
                style={{ minWidth: 220 }}
              >
                <option value="">
                  {uiOptions.length === 0
                    ? "Create an option first"
                    : "Select option"}
                </option>
                {uiOptions.map((o) => (
                  <option key={String(o.OPTION_ID)} value={String(o.OPTION_ID)}>
                    {o.OPTION_NAME || `Option ${o.OPTION_ID}`}
                  </option>
                ))}
              </Input>

              <Button color="success" onClick={addOption} size="sm">
                + Add Option
              </Button>
            </div>
          </div>

          {filteredError ? (
            <Alert color="danger" className="mb-3">
              {filteredError}
            </Alert>
          ) : null}

          {loadingFiltered ? (
            <div className="text-center my-4">
              <Spinner size="sm" className="me-2" />
              Loading hotels...
            </div>
          ) : hotelsList.length === 0 ? (
            <Alert color="secondary" className="mb-0">
              No hotels found with the selected filters.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table className="table align-middle table-nowrap mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Hotel</th>
                    <th>Chain</th>
                    <th className="text-center">Stars</th>
                    <th>Area</th>
                    <th>Address</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {hotelsList.map((h) => {
                    const targetOptId =
                      addToOptionId ||
                      (uiOptions[0] ? String(uiOptions[0].OPTION_ID) : "");

                    const alreadyAdded =
                      !!targetOptId &&
                      uiOptions.some(
                        (o) =>
                          String(o.OPTION_ID) === String(targetOptId) &&
                          (o.hotels || []).some(
                            (x) => String(x?.HOTEL_ID) === String(h.HOTEL_ID),
                          ),
                      );

                    return (
                      <tr key={String(h.HOTEL_ID)}>
                        <td>
                          <div
                            id={`avail-hotel-${String(h.HOTEL_ID)}`}
                            className="fw-semibold"
                            style={{ cursor: "help" }}
                            onMouseEnter={() =>
                              setHoveredAvailHotelId(String(h.HOTEL_ID))
                            }
                            onMouseLeave={() => setHoveredAvailHotelId(null)}
                          >
                            {h.HOTEL_NAME}{" "}
                            <Badge color="light" className="text-muted ms-1">
                              hover
                            </Badge>
                          </div>
                          <Popover
                            isOpen={hoveredAvailHotelId === String(h.HOTEL_ID)}
                            target={`avail-hotel-${String(h.HOTEL_ID)}`}
                            placement="right"
                            fade={false}
                          >
                            <PopoverBody>
                              {(() => {
                                const st = getAvailHotelStats(h);
                                return (
                                  <div style={{ minWidth: 260 }}>
                                    <div className="fw-semibold mb-1">
                                      {h.HOTEL_NAME}
                                    </div>
                                    <div className="small text-muted">
                                      {h.HOTEL_CHAIN_NAME || "-"} •{" "}
                                      {h.HOTEL_STARS
                                        ? `${h.HOTEL_STARS}★`
                                        : "-"}
                                    </div>
                                    <hr className="my-2" />
                                    <div className="small">
                                      <div>
                                        <b>Area:</b> {h.HOTEL_AREA_NAME || "-"}
                                      </div>
                                      <div>
                                        <b>Seasons:</b> {st.seasons}
                                      </div>
                                      <div>
                                        <b>Rooms:</b> {st.rooms}
                                      </div>
                                      <div>
                                        <b>BB range:</b>{" "}
                                        {st.bbMin === null
                                          ? "-"
                                          : st.bbMin.toFixed(2)}{" "}
                                        -{" "}
                                        {st.bbMax === null
                                          ? "-"
                                          : st.bbMax.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </PopoverBody>
                          </Popover>
                          <div className="text-muted small">
                            {h.HOTEL_PHONE || ""}
                          </div>
                        </td>
                        <td>{h.HOTEL_CHAIN_NAME || "-"}</td>
                        <td className="text-center">
                          <Badge color="secondary">{h.HOTEL_STARS}</Badge>
                        </td>
                        <td>{h.HOTEL_AREA_NAME || "-"}</td>
                        <td>{h.HOTEL_ADDRESS || "-"}</td>
                        <td className="text-center">
                          <Button
                            color={alreadyAdded ? "secondary" : "success"}
                            size="sm"
                            onClick={() => addHotelToOption(targetOptId, h)}
                            disabled={!targetOptId || alreadyAdded}
                            title={
                              !targetOptId
                                ? "Please add/select an option first"
                                : ""
                            }
                          >
                            {alreadyAdded ? "Added" : "Add"}
                          </Button>
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

      <Card>
        <CardBody>
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
            <h5 className="card-title mb-0">Accommodation Options</h5>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Button color="success" size="sm" onClick={addOption}>
                + Add Option
              </Button>
            </div>
          </div>

          {uiOptions.length === 0 ? (
            <Alert color="secondary" className="mb-0">
              No options added yet. Click <b>Add Option</b>, then add hotels
              into it.
            </Alert>
          ) : (
            <div className="accordion" id="step2OptionsAccordion">
              {uiOptions.map((opt) => {
                const optId = String(opt.OPTION_ID);
                const optOpen = !!expandedOptions[optId];
                const optTotals = optionSubtotal(opt);

                return (
                  <div className="accordion-item" key={optId}>
                    <h2 className="accordion-header">
                      <button
                        className={classnames("accordion-button", {
                          collapsed: !optOpen,
                        })}
                        type="button"
                        onClick={() => toggleOption(optId)}
                      >
                        <div className="d-flex flex-column w-100">
                          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-semibold">Option</span>
                              <Input
                                value={opt.OPTION_NAME || ""}
                                onChange={(e) =>
                                  renameOption(optId, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                style={{ maxWidth: 260 }}
                                placeholder="Option name"
                              />
                            </div>

                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <Badge color="primary">
                                BB: {optTotals.bb.toFixed(2)}
                              </Badge>
                              <Badge color="primary">
                                HB: {optTotals.hb.toFixed(2)}
                              </Badge>
                              <Badge color="primary">
                                FB: {optTotals.fb.toFixed(2)}
                              </Badge>
                              <Badge color="primary">
                                Single Supp: {optTotals.singleSupp.toFixed(2)}
                              </Badge>
                              <Button
                                color="primary"
                                outline
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOptionDetailsModal(optId);
                                }}
                              >
                                <i className="bx bx-show-alt me-1" />
                                Details
                              </Button>

                              <Button
                                color="danger"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeOption(optId);
                                }}
                              >
                                Remove Option
                              </Button>
                            </div>
                          </div>
                        </div>
                      </button>
                    </h2>

                    <Collapse isOpen={optOpen}>
                      <div className="accordion-body">
                        {(opt.hotels || []).length === 0 ? (
                          <Alert color="secondary" className="mb-0">
                            No hotels in this option yet. Use “Add” from the
                            hotel list above.
                          </Alert>
                        ) : (
                          <div className="accordion" id={`optHotels-${optId}`}>
                            {(opt.hotels || []).map((hotel) => {
                              const hotelId = String(hotel?.HOTEL_ID || "");
                              const hk = `${optId}:${hotelId}`;
                              const isHotelOpen = !!expandedHotels[hk];
                              const hotelTotals = hotelSubtotal(hotel);

                              return (
                                <div className="accordion-item" key={hk}>
                                  <h2 className="accordion-header">
                                    <button
                                      className={classnames(
                                        "accordion-button",
                                        {
                                          collapsed: !isHotelOpen,
                                        },
                                      )}
                                      type="button"
                                      onClick={() =>
                                        toggleHotel(optId, hotelId)
                                      }
                                    >
                                      <div className="d-flex flex-column w-100">
                                        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                                          <div>
                                            <div className="fw-semibold">
                                              {hotel?.HOTEL_NAME}
                                              <span className="text-muted ms-2">
                                                ({hotel?.HOTEL_AREA_NAME || "-"}
                                                )
                                              </span>
                                            </div>
                                            <div className="text-muted small">
                                              {hotel?.HOTEL_CHAIN_NAME || "-"} •{" "}
                                              {hotel?.HOTEL_STARS
                                                ? `${hotel.HOTEL_STARS}★`
                                                : "-"}
                                            </div>
                                          </div>

                                          <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <Badge color="info">
                                              BB: {hotelTotals.bb.toFixed(2)}
                                            </Badge>
                                            <Badge color="info">
                                              HB: {hotelTotals.hb.toFixed(2)}
                                            </Badge>
                                            <Badge color="info">
                                              FB: {hotelTotals.fb.toFixed(2)}
                                            </Badge>
                                            <Badge color="info">
                                              Single Supp:{" "}
                                              {hotelTotals.singleSupp.toFixed(
                                                2,
                                              )}
                                            </Badge>
                                            <Button
                                              color="primary"
                                              outline
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openHotelDetailsModal(
                                                  optId,
                                                  hotelId,
                                                );
                                              }}
                                            >
                                              <i className="bx bx-show-alt me-1" />
                                              Details
                                            </Button>

                                            <Button
                                              color="danger"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                removeHotelFromOption(
                                                  optId,
                                                  hotelId,
                                                );
                                              }}
                                            >
                                              Remove Hotel
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  </h2>

                                  <Collapse isOpen={isHotelOpen}>
                                    <div className="accordion-body">
                                      {(hotel?.seasons || []).map((season) => {
                                        const seasonId = String(
                                          season?.SEASON_ID || "",
                                        );
                                        const sk = `${optId}:${hotelId}:${seasonId}`;
                                        const isSeasonOpen =
                                          !!expandedSeasons[sk];
                                        const seasonTotals =
                                          seasonSubtotal(season);

                                        return (
                                          <div
                                            className="mb-2 border rounded"
                                            key={sk}
                                          >
                                            <div
                                              className="d-flex align-items-center justify-content-between p-2 bg-light"
                                              style={{ cursor: "pointer" }}
                                              onClick={() =>
                                                toggleSeason(
                                                  optId,
                                                  hotelId,
                                                  seasonId,
                                                )
                                              }
                                            >
                                              <div>
                                                <div className="fw-semibold">
                                                  {season?.SEASON_NAME ||
                                                    "Season"}
                                                </div>
                                                <div className="text-muted small">
                                                  {season?.SEASON_START_DATE
                                                    ? `${fmtDate(season.SEASON_START_DATE)} - ${fmtDate(
                                                        season.SEASON_END_DATE,
                                                      )}`
                                                    : null}
                                                </div>
                                              </div>
                                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                                <Badge color="secondary">
                                                  BB:{" "}
                                                  {seasonTotals.bb.toFixed(2)}
                                                </Badge>
                                                <Badge color="secondary">
                                                  HB:{" "}
                                                  {seasonTotals.hb.toFixed(2)}
                                                </Badge>
                                                <Badge color="secondary">
                                                  FB:{" "}
                                                  {seasonTotals.fb.toFixed(2)}
                                                </Badge>
                                                <Badge color="secondary">
                                                  Single Supp:{" "}
                                                  {seasonTotals.singleSupp.toFixed(
                                                    2,
                                                  )}
                                                </Badge>
                                                <i
                                                  className={classnames("bx", {
                                                    "bx-chevron-down":
                                                      isSeasonOpen,
                                                    "bx-chevron-right":
                                                      !isSeasonOpen,
                                                  })}
                                                />
                                              </div>
                                            </div>

                                            <Collapse isOpen={isSeasonOpen}>
                                              <div className="p-2">
                                                <div className="table-responsive">
                                                  <Table className="table table-sm align-middle table-nowrap mb-0">
                                                    <thead className="table-light">
                                                      <tr>
                                                        <th
                                                          style={{
                                                            minWidth: 120,
                                                          }}
                                                        >
                                                          Room
                                                        </th>
                                                        <th
                                                          className="text-center"
                                                          style={{
                                                            width: 160,
                                                            minWidth: 160,
                                                          }}
                                                        >
                                                          Guests
                                                        </th>
                                                        <th
                                                          className="text-center"
                                                          style={{
                                                            width: 160,
                                                            minWidth: 160,
                                                          }}
                                                        >
                                                          Nights
                                                        </th>
                                                        <th
                                                          style={{
                                                            minWidth: 140,
                                                          }}
                                                        >
                                                          BB Rate
                                                        </th>
                                                        <th
                                                          style={{
                                                            minWidth: 140,
                                                          }}
                                                        >
                                                          HB Add-on
                                                        </th>
                                                        <th
                                                          style={{
                                                            minWidth: 140,
                                                          }}
                                                        >
                                                          FB Add-on
                                                        </th>
                                                        <th
                                                          style={{
                                                            minWidth: 160,
                                                          }}
                                                        >
                                                          Single Supp
                                                        </th>

                                                        <th
                                                          style={{
                                                            minWidth: 190,
                                                          }}
                                                        >
                                                          Single in DBL (BB)
                                                        </th>
                                                        <th
                                                          style={{
                                                            minWidth: 190,
                                                          }}
                                                        >
                                                          Single in DBL (HB)
                                                        </th>
                                                        <th
                                                          style={{
                                                            minWidth: 190,
                                                          }}
                                                        >
                                                          Single in DBL (FB)
                                                        </th>

                                                        <th
                                                          className="text-center"
                                                          style={{
                                                            width: 120,
                                                            minWidth: 120,
                                                          }}
                                                        >
                                                          Action
                                                        </th>
                                                      </tr>
                                                    </thead>

                                                    <tbody>
                                                      {(
                                                        season?.rooms || []
                                                      ).map((rm) => {
                                                        const rowId = String(
                                                          rm?.RATE_ID ||
                                                            rm?.RATE_FOR_ID ||
                                                            "",
                                                        );
                                                        const costs =
                                                          calcRoomCosts(rm);

                                                        return (
                                                          <tr
                                                            key={`${sk}:${rowId}`}
                                                          >
                                                            <td className="fw-semibold">
                                                              {rm?.RATE_FOR_NAME ||
                                                                "-"}
                                                            </td>

                                                            <td className="text-center">
                                                              <Input
                                                                type="number"
                                                                min={1}
                                                                max={10}
                                                                value={
                                                                  rm?.GUESTS ??
                                                                  1
                                                                }
                                                                onChange={(e) =>
                                                                  updateRoom(
                                                                    optId,
                                                                    hotelId,
                                                                    seasonId,
                                                                    rowId,
                                                                    {
                                                                      GUESTS:
                                                                        e.target
                                                                          .value,
                                                                    },
                                                                  )
                                                                }
                                                              />
                                                            </td>

                                                            <td className="text-center">
                                                              <Input
                                                                type="number"
                                                                min={1}
                                                                max={365}
                                                                value={
                                                                  rm?.NIGHTS ??
                                                                  1
                                                                }
                                                                onChange={(e) =>
                                                                  updateRoom(
                                                                    optId,
                                                                    hotelId,
                                                                    seasonId,
                                                                    rowId,
                                                                    {
                                                                      NIGHTS:
                                                                        e.target
                                                                          .value,
                                                                    },
                                                                  )
                                                                }
                                                              />
                                                            </td>

                                                            <td>
                                                              <Input
                                                                type="number"
                                                                step="0.01"
                                                                min={0}
                                                                value={
                                                                  rm?.RATE_AMOUNT ??
                                                                  0
                                                                }
                                                                onChange={(e) =>
                                                                  updateRoom(
                                                                    optId,
                                                                    hotelId,
                                                                    seasonId,
                                                                    rowId,
                                                                    {
                                                                      RATE_AMOUNT:
                                                                        e.target
                                                                          .value,
                                                                    },
                                                                  )
                                                                }
                                                              />
                                                            </td>

                                                            <td>
                                                              <Input
                                                                type="number"
                                                                step="0.01"
                                                                min={0}
                                                                value={
                                                                  rm?.RATE_HALF_BOARD_AMOUNT ??
                                                                  0
                                                                }
                                                                onChange={(e) =>
                                                                  updateRoom(
                                                                    optId,
                                                                    hotelId,
                                                                    seasonId,
                                                                    rowId,
                                                                    {
                                                                      RATE_HALF_BOARD_AMOUNT:
                                                                        e.target
                                                                          .value,
                                                                    },
                                                                  )
                                                                }
                                                              />
                                                            </td>

                                                            <td>
                                                              <Input
                                                                type="number"
                                                                step="0.01"
                                                                min={0}
                                                                value={
                                                                  rm?.RATE_FULL_BOARD_AMOUNT ??
                                                                  0
                                                                }
                                                                onChange={(e) =>
                                                                  updateRoom(
                                                                    optId,
                                                                    hotelId,
                                                                    seasonId,
                                                                    rowId,
                                                                    {
                                                                      RATE_FULL_BOARD_AMOUNT:
                                                                        e.target
                                                                          .value,
                                                                    },
                                                                  )
                                                                }
                                                              />
                                                            </td>

                                                            <td>
                                                              <Input
                                                                type="number"
                                                                step="0.01"
                                                                min={0}
                                                                value={
                                                                  rm?.RATE_SINGLE_SPPLIMENT_AMOUNT ??
                                                                  0
                                                                }
                                                                onChange={(e) =>
                                                                  updateRoom(
                                                                    optId,
                                                                    hotelId,
                                                                    seasonId,
                                                                    rowId,
                                                                    {
                                                                      RATE_SINGLE_SPPLIMENT_AMOUNT:
                                                                        e.target
                                                                          .value,
                                                                    },
                                                                  )
                                                                }
                                                              />
                                                            </td>

                                                            <td className="fw-semibold">
                                                              {costs.singleInDblBB.toFixed(
                                                                2,
                                                              )}
                                                            </td>
                                                            <td className="fw-semibold">
                                                              {costs.singleInDblHB.toFixed(
                                                                2,
                                                              )}
                                                            </td>
                                                            <td className="fw-semibold">
                                                              {costs.singleInDblFB.toFixed(
                                                                2,
                                                              )}
                                                            </td>

                                                            <td className="text-center">
                                                              <Button
                                                                color="danger"
                                                                size="sm"
                                                                onClick={() =>
                                                                  removeRoomFromHotel(
                                                                    optId,
                                                                    hotelId,
                                                                    seasonId,
                                                                    rowId,
                                                                  )
                                                                }
                                                                title="Remove room"
                                                              >
                                                                Remove
                                                              </Button>
                                                            </td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </Table>
                                                </div>
                                              </div>
                                            </Collapse>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </Collapse>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Collapse>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ================== Room Edit Modal (UX only, no logic changes) ================== */}
      <Modal
        isOpen={roomEditModalOpen}
        toggle={closeRoomEditModal}
        size="lg"
        centered
        backdrop={true}
        backdropClassName="quotation-modal-backdrop"
      >
        <ModalHeader toggle={closeRoomEditModal}>Edit Room Rates</ModalHeader>
        <ModalBody>
          {(() => {
            if (!roomEditModalCtx) {
              return (
                <Alert color="secondary" className="mb-0">
                  No room selected.
                </Alert>
              );
            }

            const opt = (uiOptions || []).find(
              (o) => String(o?.OPTION_ID) === String(roomEditModalCtx.optionId),
            );
            const hotel = (opt?.hotels || []).find(
              (h) => String(h?.HOTEL_ID) === String(roomEditModalCtx.hotelId),
            );
            const season = (hotel?.seasons || []).find(
              (s) => String(s?.SEASON_ID) === String(roomEditModalCtx.seasonId),
            );
            const rm = (season?.rooms || []).find(
              (r) =>
                String(r?.RATE_ID || r?.RATE_FOR_ID || "") ===
                String(roomEditModalCtx.roomId),
            );

            if (!opt || !hotel || !season || !rm) {
              return (
                <Alert color="warning" className="mb-0">
                  Selected room could not be found. It may have been removed.
                </Alert>
              );
            }

            const optId = String(opt.OPTION_ID);
            const hotelId = String(hotel.HOTEL_ID);
            const seasonId = String(season.SEASON_ID);
            const rowId = String(rm?.RATE_ID || rm?.RATE_FOR_ID || "");

            const costs = calcRoomCosts(rm);

            return (
              <div>
                <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-3">
                  <div>
                    <div className="fw-semibold">
                      {rm?.RATE_FOR_NAME || "Room"}
                    </div>
                    <div className="text-muted small">
                      {hotel?.HOTEL_NAME || "-"} •{" "}
                      {season?.SEASON_NAME || "Season"}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Badge color="info" className="py-2 px-3">
                      BB Total: {costs.bbTotal.toFixed(2)}
                    </Badge>
                    <Badge color="info" className="py-2 px-3">
                      HB Add-on Total: {costs.hbAddonTotal.toFixed(2)}
                    </Badge>
                    <Badge color="info" className="py-2 px-3">
                      FB Add-on Total: {costs.fbAddonTotal.toFixed(2)}
                    </Badge>
                    <Badge color="info" className="py-2 px-3">
                      Single Supp Total: {costs.singleSuppTotal.toFixed(2)}
                    </Badge>
                  </div>
                </div>

                <Card className="border mb-3">
                  <CardBody>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <Label className="form-label mb-1">Guests</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={rm?.GUESTS ?? 1}
                          onChange={(e) =>
                            updateRoom(optId, hotelId, seasonId, rowId, {
                              GUESTS: e.target.value,
                            })
                          }
                        />
                        <div className="text-muted small mt-1">
                          Used for totals and “Single in DBL” calculations.
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <Label className="form-label mb-1">Nights</Label>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={rm?.NIGHTS ?? 1}
                          onChange={(e) =>
                            updateRoom(optId, hotelId, seasonId, rowId, {
                              NIGHTS: e.target.value,
                            })
                          }
                        />
                        <div className="text-muted small mt-1">
                          Multiplies all rates and add-ons.
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <Label className="form-label mb-1">BB Rate</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={rm?.RATE_AMOUNT ?? 0}
                          onChange={(e) =>
                            updateRoom(optId, hotelId, seasonId, rowId, {
                              RATE_AMOUNT: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <Label className="form-label mb-1">HB Add-on</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={rm?.RATE_HALF_BOARD_AMOUNT ?? 0}
                          onChange={(e) =>
                            updateRoom(optId, hotelId, seasonId, rowId, {
                              RATE_HALF_BOARD_AMOUNT: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <Label className="form-label mb-1">FB Add-on</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={rm?.RATE_FULL_BOARD_AMOUNT ?? 0}
                          onChange={(e) =>
                            updateRoom(optId, hotelId, seasonId, rowId, {
                              RATE_FULL_BOARD_AMOUNT: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <Label className="form-label mb-1">
                          Single Supplement
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={rm?.RATE_SINGLE_SPPLIMENT_AMOUNT ?? 0}
                          onChange={(e) =>
                            updateRoom(optId, hotelId, seasonId, rowId, {
                              RATE_SINGLE_SPPLIMENT_AMOUNT: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                  <div className="text-muted small">
                    <div>
                      <b>Single in DBL (BB):</b>{" "}
                      {costs.singleInDblBB.toFixed(2)}
                    </div>
                    <div>
                      <b>Single in DBL (HB):</b>{" "}
                      {costs.singleInDblHB.toFixed(2)}
                    </div>
                    <div>
                      <b>Single in DBL (FB):</b>{" "}
                      {costs.singleInDblFB.toFixed(2)}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <Button
                      color="secondary"
                      outline
                      onClick={closeRoomEditModal}
                    >
                      Close
                    </Button>
                    <Button
                      color="danger"
                      onClick={() => {
                        removeRoomFromHotel(optId, hotelId, seasonId, rowId);
                        closeRoomEditModal();
                      }}
                    >
                      Remove Room
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </ModalBody>
      </Modal>

      {/* ================== Option Details Modal (no dimming) ================== */}
      <Modal
        isOpen={optionDetailsModalOpen}
        toggle={closeOptionDetailsModal}
        size="xl"
        scrollable
        backdrop={true}
        style={{ maxWidth: "1200px" }}
        backdropClassName="quotation-modal-backdrop"
      >
        <ModalHeader toggle={closeOptionDetailsModal}>
          {(() => {
            const opt = (uiOptions || []).find(
              (o) => String(o?.OPTION_ID) === String(optionDetailsModalId),
            );
            return opt?.OPTION_NAME
              ? `Option: ${opt.OPTION_NAME}`
              : "Option details";
          })()}
        </ModalHeader>
        <ModalBody>
          {(() => {
            const opt = (uiOptions || []).find(
              (o) => String(o?.OPTION_ID) === String(optionDetailsModalId),
            );
            if (!opt) {
              return (
                <Alert color="secondary" className="mb-0">
                  No option selected.
                </Alert>
              );
            }

            const st = getOptionStats(opt);
            const totals = optionSubtotal(opt);

            return (
              <div>
                <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-3">
                  <div>
                    <div className="fw-semibold">
                      {opt?.OPTION_NAME || "Option"}
                    </div>
                    <div className="text-muted small">
                      Hotels: {st.hotels} • Seasons: {st.seasons} • Rooms:{" "}
                      {st.rooms}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Badge color="primary">BB: {totals.bb.toFixed(2)}</Badge>
                    <Badge color="primary">HB: {totals.hb.toFixed(2)}</Badge>
                    <Badge color="primary">FB: {totals.fb.toFixed(2)}</Badge>
                    <Badge color="primary">
                      Single Supp: {totals.singleSupp.toFixed(2)}
                    </Badge>
                  </div>
                </div>

                {(opt?.hotels || []).length === 0 ? (
                  <Alert color="secondary" className="mb-0">
                    No hotels in this option.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table className="table align-middle table-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Hotel</th>
                          <th>Chain</th>
                          <th className="text-center">Stars</th>
                          <th>Area</th>
                          <th className="text-center">Seasons</th>
                          <th className="text-center">Rooms</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(opt?.hotels || []).map((h) => {
                          const hs = getSelectedHotelStats(h);
                          return (
                            <tr key={String(h?.HOTEL_ID)}>
                              <td>
                                <div className="fw-semibold">
                                  {h?.HOTEL_NAME}
                                </div>
                                <div className="text-muted small">
                                  {h?.HOTEL_ADDRESS || ""}
                                </div>
                              </td>
                              <td>{h?.HOTEL_CHAIN_NAME || "-"}</td>
                              <td className="text-center">
                                <Badge color="secondary">
                                  {h?.HOTEL_STARS || "-"}
                                </Badge>
                              </td>
                              <td>{h?.HOTEL_AREA_NAME || "-"}</td>
                              <td className="text-center">{hs.seasons}</td>
                              <td className="text-center">{hs.rooms}</td>
                              <td className="text-center">
                                <Button
                                  size="sm"
                                  color="primary"
                                  outline
                                  onClick={() =>
                                    openHotelDetailsModal(
                                      opt?.OPTION_ID,
                                      h?.HOTEL_ID,
                                    )
                                  }
                                >
                                  View Hotel
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })()}
        </ModalBody>
      </Modal>

      {/* ================== Hotel Details Modal (no dimming) ================== */}
      <Modal
        isOpen={hotelDetailsModalOpen}
        toggle={closeHotelDetailsModal}
        size="xl"
        scrollable
        backdrop={true}
        backdropClassName="quotation-modal-backdrop"
        style={{ maxWidth: "1200px" }}
      >
        <ModalHeader toggle={closeHotelDetailsModal}>
          {(() => {
            if (!hotelDetailsModalCtx) return "Hotel details";
            const opt = (uiOptions || []).find(
              (o) =>
                String(o?.OPTION_ID) === String(hotelDetailsModalCtx.optionId),
            );
            const h = (opt?.hotels || []).find(
              (x) =>
                String(x?.HOTEL_ID) === String(hotelDetailsModalCtx.hotelId),
            );
            return h?.HOTEL_NAME ? `Hotel: ${h.HOTEL_NAME}` : "Hotel details";
          })()}
        </ModalHeader>
        <ModalBody>
          {(() => {
            if (!hotelDetailsModalCtx) {
              return (
                <Alert color="secondary" className="mb-0">
                  No hotel selected.
                </Alert>
              );
            }

            const optId = String(hotelDetailsModalCtx.optionId);
            const opt = (uiOptions || []).find(
              (o) => String(o?.OPTION_ID) === optId,
            );
            const hotel = (opt?.hotels || []).find(
              (x) =>
                String(x?.HOTEL_ID) === String(hotelDetailsModalCtx.hotelId),
            );

            if (!hotel) {
              return (
                <Alert color="warning" className="mb-0">
                  Hotel not found in selected option.
                </Alert>
              );
            }

            const stats = getSelectedHotelStats(hotel);
            const totals = hotelSubtotal(hotel);

            return (
              <div>
                <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap mb-3">
                  <div>
                    <div className="fw-semibold">{hotel?.HOTEL_NAME}</div>
                    <div className="text-muted small">
                      {hotel?.HOTEL_CHAIN_NAME || "-"} •{" "}
                      {hotel?.HOTEL_STARS ? `${hotel.HOTEL_STARS}★` : "-"} •{" "}
                      {hotel?.HOTEL_AREA_NAME || "-"}
                    </div>
                    <div className="text-muted small">
                      Seasons: {stats.seasons} • Rooms: {stats.rooms} • BB
                      Range:{" "}
                      {stats.bbMin === null ? "-" : stats.bbMin.toFixed(2)} -{" "}
                      {stats.bbMax === null ? "-" : stats.bbMax.toFixed(2)}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Badge color="info">BB: {totals.bb.toFixed(2)}</Badge>
                    <Badge color="info">HB: {totals.hb.toFixed(2)}</Badge>
                    <Badge color="info">FB: {totals.fb.toFixed(2)}</Badge>
                    <Badge color="info">
                      Single Supp: {totals.singleSupp.toFixed(2)}
                    </Badge>
                  </div>
                </div>

                {renderHotelSeasonsTable(optId, hotel)}
              </div>
            );
          })()}
        </ModalBody>
      </Modal>

      <style>{`
        .modal-backdrop.quotation-modal-backdrop {
          background-color: #000;
        }
        .modal-backdrop.quotation-modal-backdrop.show {
          opacity: 0.5;
        }
      `}</style>
    </>
  );
};

export default QuotationStep2Accommodations;
