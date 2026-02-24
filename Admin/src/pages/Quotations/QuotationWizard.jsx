import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Collapse,
  Container,
  NavItem,
  NavLink,
  Row,
  Spinner,
  TabContent,
  TabPane,
  Table,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  UncontrolledPopover,
  PopoverHeader,
  PopoverBody,
} from "reactstrap";
import classnames from "classnames";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import Breadcrumb from "../../components/Common/Breadcrumb";
import RequireModule from "../../components/auth/RequireModule";
import ThemeSelect from "../../components/Common/ThemeSelect";
import QuotationStep2Accommodations from "./components/QuotationStep2Accommodations";
import QuotationStep3ExtraServices from "./components/QuotationStep3ExtraServices";
import QuotationStep4Summary from "./components/QuotationStep4Summary";

import { get } from "/src/helpers/api_helper";

import {
  getQoutationById,
  getQoutationStep1,
  getQoutationStep1Submitted,
  clearQoutationsMessages,
  saveQoutationStep1,
} from "/src/store/quotations/actions";

const EMPTY_STATE = {};

const quotationDetailsSelector = createSelector(
  (state) => state?.Quotations || state?.quotations || EMPTY_STATE,
  (s) => ({
    details: s?.details || null,

    step1: s?.step1 || null, // options (/step1)
    step1Submitted: s?.step1Submitted || null, // saved (/step1/submitted)

    loadingDetails: s?.loadingDetails || false,
    loadingStep1: s?.loadingStep1 || false,
    loadingStep1Submitted: s?.loadingStep1Submitted || false,

    savingStep1: s?.savingStep1 || false,
    successMessage: s?.successMessage || null,

    error: s?.error || null,
  }),
);

const toYmd = (dateObj) => {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDays = (ymd, daysToAdd) => {
  const [y, m, d] = (ymd || "").split("-").map((x) => Number(x));
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + daysToAdd);
  return toYmd(dt);
};

const ymdToDmyDash = (ymd) => {
  // "YYYY-MM-DD" -> "DD-MM-YYYY"
  const [y, m, d] = (ymd || "").split("-");
  if (!y || !m || !d) return "";
  return `${d}-${m}-${y}`;
};

const numOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const numOrZero = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const QuotationWizardInner = () => {
  document.title = "Quotation | Travco - COE";

  const { id } = useParams();
  const dispatch = useDispatch();

  const {
    details,
    step1,
    step1Submitted,
    loadingDetails,
    loadingStep1,
    loadingStep1Submitted,
    savingStep1,
    successMessage,
    error,
  } = useSelector(quotationDetailsSelector);

  const step3State = useSelector((state) => state?.quotationStep3 || {});
  const step3QuotationExtraServices =
    step3State?.quotationExtraServices || step3State?.quotationExtraServicesRaw;

  const hasSubmittedStep1 = !!step1Submitted?.QOUTATION_ID;

  const [activeTab, setactiveTab] = useState(1);
  const [passedSteps, setPassedSteps] = useState([1]);

  const [isEditingStep1, setIsEditingStep1] = useState(false);
  const [expandedDays, setExpandedDays] = useState({}); // { [dayNo]: boolean }
  const [daysRows, setDaysRows] = useState([]);

  // ===== Step 1 UX: hover preview + modal details (no API changes) =====
  const [dayDetailsModalOpen, setDayDetailsModalOpen] = useState(false);
  const [dayDetailsModalDayNo, setDayDetailsModalDayNo] = useState(null);

  // ===== Step 2 (Accommodations) =====
  const [step2Hotels, setStep2Hotels] = useState([]);

  // ===== Guide types =====
  const [guideTypes, setGuideTypes] = useState([]);
  const [loadingGuideTypes, setLoadingGuideTypes] = useState(false);

  // ===== Places master list =====
  const [allPlaces, setAllPlaces] = useState([]);
  const [loadingAllPlaces, setLoadingAllPlaces] = useState(false);
  const [allPlacesLoaded, setAllPlacesLoaded] = useState(false);

  // ===== Meals lookup (NEW) =====
  const [mealsLookup, setMealsLookup] = useState(null); // { restaurants: [] }
  const [loadingMealsLookup, setLoadingMealsLookup] = useState(false);
  const [mealsLookupLoaded, setMealsLookupLoaded] = useState(false);

  // ===== Extra Services lookup (NEW) =====
  const [extraServicesLookup, setExtraServicesLookup] = useState([]);
  const [loadingExtraServicesLookup, setLoadingExtraServicesLookup] =
    useState(false);
  const [extraServicesLookupLoaded, setExtraServicesLookupLoaded] =
    useState(false);

  const clientCountryId =
    details?.CLIENT_COUNTRY_ID ??
    details?.CLIENT_COUNTRY_ID ??
    details?.CLIENT_COUNTRY_ID ??
    null;

  const step1Options = step1;

  const q = step1Options?.QOUTATION || null;
  const routes = step1Options?.ROUTS || [];
  const transportation = step1Options?.TRANSPORTATION || [];
  const numberOfDays =
    step1Options?.STAY_INFO?.STAY_BASIC_INFO?.NUMBER_OF_DAYS || 0;

  const arrivingDate =
    q?.QOUTATION_ARRIVING_DATE || details?.QOUTATION_ARRIVING_DATE || "";

  // Step 2 requires both ARRIVING_DATE and DEPARTURE_DATE.
  // Prefer the saved quotation header dates; fallback to arrivingDate + numberOfDays.
  const departingDate =
    q?.QOUTATION_DEPARTURING_DATE ||
    details?.QOUTATION_DEPARTURING_DATE ||
    (arrivingDate && numberOfDays
      ? addDays(arrivingDate, Number(numberOfDays) || 0)
      : "");

  function toggleTab(tab) {
    if (activeTab !== tab) {
      const modifiedSteps = [...passedSteps, tab];
      if (tab >= 1 && tab <= 4) {
        setactiveTab(tab);
        setPassedSteps(modifiedSteps);
      }
    }
  }

  useEffect(() => {
    dispatch(clearQoutationsMessages());
    if (id) {
      dispatch(getQoutationById(id));
      dispatch(getQoutationStep1(id)); // always fetch options
      dispatch(getQoutationStep1Submitted(id)); // fetch submitted
    }
  }, [dispatch, id]);

  // guide types (direct API)
  useEffect(() => {
    const fetchGuideTypes = async () => {
      try {
        setLoadingGuideTypes(true);
        const res = await get("/api/lists/by-key/GUIDE_TYPE");
        const data = res?.data || res;
        setGuideTypes(data?.ITEMS || []);
      } catch (e) {
        setGuideTypes([]);
      } finally {
        setLoadingGuideTypes(false);
      }
    };

    fetchGuideTypes();
  }, []);

  useEffect(() => {
    setIsEditingStep1(!hasSubmittedStep1);
  }, [hasSubmittedStep1]);

  useEffect(() => {
    if (successMessage && hasSubmittedStep1) {
      setIsEditingStep1(false);
    }
  }, [successMessage, hasSubmittedStep1]);

  const renderStatusBadge = (status) => {
    const isActive = status === 1 || status === "1";
    return (
      <Badge color={isActive ? "success" : "secondary"} className="ms-2">
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const feeTypeMap = useMemo(() => {
    const map = new Map();
    (transportation || []).forEach((t) =>
      map.set(String(t.TRANSPORTATION_FEE_TYPE), t),
    );
    return map;
  }, [transportation]);

  const findAmount = (feeTypeId, vehicleTypeId) => {
    const t = feeTypeMap.get(String(feeTypeId));
    const opts = t?.OPTIONS || [];
    const found = opts.find(
      (o) => String(o.TRANSPORTATION_FEE_VECHLE_TYPE) === String(vehicleTypeId),
    );
    return found?.TRANSPORTATION_FEE_AMOUNT ?? "";
  };

  const guideTypeOptions = useMemo(
    () =>
      (guideTypes || []).map((x) => ({
        value: x.LIST_ITEM_ID,
        label: x.ITEM_NAME,
      })),
    [guideTypes],
  );

  const routeOptions = useMemo(
    () =>
      (routes || []).map((r) => ({
        value: r.ROUTE_ID,
        label: r.ROUTE_NAME,
      })),
    [routes],
  );

  const transportFeeTypeOptions = useMemo(
    () =>
      (transportation || []).map((t) => ({
        value: t.TRANSPORTATION_FEE_TYPE,
        label: t.TRANSPORTATION_FEE_TYPE_NAME,
      })),
    [transportation],
  );

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

  const submittedByDate = useMemo(() => {
    const map = new Map();
    const list = step1Submitted?.ROUTS || [];
    list.forEach((r) => {
      const dt = r?.ROUTE_DATE;
      if (!dt) return;
      if (!map.has(String(dt))) map.set(String(dt), r);
    });
    return map;
  }, [step1Submitted]);

  const ensureAllPlacesLoaded = async () => {
    if (allPlacesLoaded || loadingAllPlaces) return;

    try {
      setLoadingAllPlaces(true);
      const res = await get("/api/places/");
      const data = res?.data || res || [];
      setAllPlaces(Array.isArray(data) ? data : []);
      setAllPlacesLoaded(true);
    } catch (e) {
      setAllPlaces([]);
      setAllPlacesLoaded(true);
    } finally {
      setLoadingAllPlaces(false);
    }
  };

  const placesDropdownOptions = useMemo(() => {
    return (allPlaces || []).map((p) => ({
      value: p.PLACE_ID,
      label: p.PLACE_NAME,
    }));
  }, [allPlaces]);

  const buildDefaultPlacesFromRoute = (routeId) => {
    const rt = routeById.get(String(routeId));
    const places = rt?.PLACES || [];
    return places.map((p) => {
      const fee = p?.ENTRANCE_FEES?.[0]?.PLACE_ENTRANCE_FEE_AMOUNT ?? 0;

      return {
        ORIGINAL_PLACE_ID: p?.PLACE_ID ?? "",
        PLACE_NAME: p?.PLACE_NAME ?? "",
        ENTRANCE_FEES_PP: fee ?? 0,
        GUIDE_TYPE: "",
        GUIDE_COST: "",
      };
    });
  };

  const fetchEntranceFeeForPlace = async (placeId) => {
    const cid = clientCountryId;
    if (!placeId) return 0;

    try {
      const url = `/api/places/entrance-fees?PLACE_ENTRANCE_FEE_COUNTRY_ID=${cid}&PLACE_ENTRANCE_FEE_PLACE_ID=${placeId}`;
      const res = await get(url);
      const data = res?.data || res || [];
      if (Array.isArray(data) && data.length > 0) {
        const amt = data[0]?.PLACE_ENTRANCE_FEE_AMOUNT;
        const n = Number(amt);
        return Number.isNaN(n) ? 0 : n;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  // ===== Meals Lookup (NEW) =====
  const ensureMealsLookupLoaded = async () => {
    if (mealsLookupLoaded || loadingMealsLookup) return;
    try {
      setLoadingMealsLookup(true);
      const res = await get("/api/restaurants/meals/lookup");
      const data = res?.data || res || null;
      setMealsLookup(data);
      setMealsLookupLoaded(true);
    } catch (e) {
      setMealsLookup({ restaurants: [] });
      setMealsLookupLoaded(true);
    } finally {
      setLoadingMealsLookup(false);
    }
  };

  const restaurantsOptions = useMemo(() => {
    const restaurants = mealsLookup?.restaurants || [];
    return restaurants.map((r) => ({
      value: r.RESTAURANT_ID,
      label: r.RESTUARANT_NAME,
    }));
  }, [mealsLookup]);

  const restaurantById = useMemo(() => {
    const map = new Map();
    (mealsLookup?.restaurants || []).forEach((r) =>
      map.set(String(r.RESTAURANT_ID), r),
    );
    return map;
  }, [mealsLookup]);

  const mealTypeOptionsForRestaurant = (restaurantId) => {
    const r = restaurantById.get(String(restaurantId));
    const types = r?.RESTAURANT_MEAL_TYPES || [];
    return types.map((t) => ({
      value: t.RESTAURANT_MEAL_TYPE_ID,
      label: t.RESTAURANT_MEAL_TYPE_NAME,
      _meals: t.MEALS || [],
    }));
  };

  const mealOptionsForRestaurantType = (restaurantId, mealTypeId) => {
    const r = restaurantById.get(String(restaurantId));
    const types = r?.RESTAURANT_MEAL_TYPES || [];
    const t = types.find(
      (x) => String(x.RESTAURANT_MEAL_TYPE_ID) === String(mealTypeId),
    );
    const meals = t?.MEALS || [];
    return meals.map((m) => ({
      value: m.RESTAURANT_MEAL_ID,
      label: m.RESTAURANT_MEAL_DESCRIPTION,
      rate: m.RESTAURANT_MEAL_RATE_PP,
      active: m.ACTIVE_STATUS,
    }));
  };

  // ===== Extra Services Lookup (NEW) =====
  const ensureExtraServicesLoaded = async () => {
    if (extraServicesLookupLoaded || loadingExtraServicesLookup) return;

    try {
      setLoadingExtraServicesLookup(true);
      const res = await get("/api/extra-services");
      const data = res?.data || res || [];
      setExtraServicesLookup(Array.isArray(data) ? data : []);
      setExtraServicesLookupLoaded(true);
    } catch (e) {
      setExtraServicesLookup([]);
      setExtraServicesLookupLoaded(true);
    } finally {
      setLoadingExtraServicesLookup(false);
    }
  };

  const extraServicesOptions = useMemo(() => {
    return (extraServicesLookup || []).map((s) => ({
      value: s.EXTRA_SERVICE_ID,
      label: s.EXTRA_SERVICE_NAME,
      cost: s.EXTRA_SERVICE_COST_PP,
    }));
  }, [extraServicesLookup]);

  // Build initial days always from calculations then overlay submitted
  useEffect(() => {
    if (!step1Options || !numberOfDays || !arrivingDate) {
      setDaysRows([]);
      return;
    }

    const rows = Array.from({ length: Number(numberOfDays) }, (_, idx) => {
      const date = addDays(arrivingDate, idx);

      // Overlay submitted (saved) values if they exist for the same date
      const sub = submittedByDate.get(String(date));

      const base = {
        dayNo: idx + 1,
        date,
        routeId: "",
        feeTypeId: "",
        vehicleTypeId: sub
          ? (sub.TRANSPORTATION_FEE_VECHLE_TYPE ??
            sub.VEHICLE_TYPE_ID ??
            sub.VEHICLE_TYPE ??
            sub.TRANSPORTATION_VECHLE_TYPE ??
            sub.TRANSPORTATION_VEHICLE_TYPE_ID ??
            "")
          : "",
        amount: "",

        places: [],
        meals: [],
        extraServices: [],

        isAdjusted: false,
      };

      if (!sub) return base;

      const subPlaces = (sub.PLACES || []).map((p) => ({
        ORIGINAL_PLACE_ID: p.ORIGINAL_PLACE_ID ?? "",
        PLACE_NAME: p.PLACE_NAME ?? "",
        ENTRANCE_FEES_PP: p.ENTRANCE_FEES_PP ?? "",
        GUIDE_TYPE: p.GUIDE_TYPE ?? "",
        GUIDE_COST: p.GUIDE_COST ?? "",
        GUIDE_TYPE_NAME: p.GUIDE_TYPE_NAME ?? "",
      }));

      const subMeals = (sub.MEALS || []).map((m) => ({
        ORIGINAL_MEAL_ID: m.ORIGINAL_MEAL_ID ?? "",
        RESAURANT_ID: m.RESAURANT_ID ?? "",
        // NEW UI-only fields (keep safe even if backend doesn't send them)
        RESTAURANT_MEAL_TYPE_ID: m.RESTAURANT_MEAL_TYPE_ID ?? "",
        RESTAURANT_MEAL_TYPE_NAME: m.RESTAURANT_MEAL_TYPE_NAME ?? "",
        RESTAURANT_MEAL_DESCRIPTION: m.RESTAURANT_MEAL_DESCRIPTION ?? "",
        RESTAURANT_MEAL_RATE_PP: m.RESTAURANT_MEAL_RATE_PP ?? "",
        RESTUARANT_NAME: m.RESTUARANT_NAME ?? "",
        TOTAL_AMOUNT_PP: m.TOTAL_AMOUNT_PP ?? "",
      }));

      const subExtras = (sub.EXTRA_SERVICES || []).map((e) => ({
        EXTRA_SERVICE_ID: e.EXTRA_SERVICE_ID ?? "",
        EXTRA_SERVICE_COST_PP: e.EXTRA_SERVICE_COST_PP ?? "",
        EXTRA_SERVICE_NAME: e.EXTRA_SERVICE_NAME ?? "",
      }));

      return {
        ...base,
        routeId: sub.ROUTE_ID ?? "",
        feeTypeId: sub.TRANSPORTATION_TYPE_ID ?? "",
        vehicleTypeId:
          sub.TRANSPORTATION_FEE_VECHLE_TYPE ??
          sub.VEHICLE_TYPE_ID ??
          sub.VEHICLE_TYPE ??
          sub.TRANSPORTATION_VECHLE_TYPE ??
          sub.TRANSPORTATION_VEHICLE_TYPE_ID ??
          "",
        amount: sub.TRANSPORTATION_AMOUNT ?? "",
        places: subPlaces,
        meals: subMeals,
        extraServices: subExtras,
        isAdjusted: true,
      };
    });

    setDaysRows(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step1Options, numberOfDays, arrivingDate, step1Submitted]);

  const toggleDayExpand = (dayNo) => {
    setExpandedDays((prev) => ({ ...prev, [dayNo]: !prev[dayNo] }));
  };

  const openDayDetailsModal = (dayNo) => {
    setDayDetailsModalDayNo(dayNo);
    setDayDetailsModalOpen(true);
  };

  const closeDayDetailsModal = () => {
    setDayDetailsModalOpen(false);
  };

  const getDaySummary = (row) => {
    const placesCount = Array.isArray(row?.places) ? row.places.length : 0;
    const mealsCount = Array.isArray(row?.meals) ? row.meals.length : 0;
    const extrasCount = Array.isArray(row?.extraServices)
      ? row.extraServices.length
      : 0;

    const entranceTotal = (row?.places || []).reduce(
      (acc, p) => acc + (Number(p?.ENTRANCE_FEES_PP) || 0),
      0,
    );
    const guidesTotal = (row?.places || []).reduce(
      (acc, p) => acc + (Number(p?.GUIDE_COST) || 0),
      0,
    );
    const mealsTotal = (row?.meals || []).reduce(
      (acc, m) => acc + (Number(m?.TOTAL_AMOUNT_PP) || 0),
      0,
    );
    const extrasTotal = (row?.extraServices || []).reduce(
      (acc, e) => acc + (Number(e?.EXTRA_SERVICE_COST_PP) || 0),
      0,
    );

    return {
      placesCount,
      mealsCount,
      extrasCount,
      entranceTotal,
      guidesTotal,
      mealsTotal,
      extrasTotal,
    };
  };

  const onChangeRow = (rowIndex, field, value) => {
    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };

      if (field === "routeId") {
        r.routeId = value;

        if (value) {
          r.places = buildDefaultPlacesFromRoute(value);
        } else {
          r.places = [];
        }
        r.meals = [];
        r.extraServices = [];
      }

      if (field === "feeTypeId") {
        r.feeTypeId = value;
        r.vehicleTypeId = "";
        r.amount = "";
        r.isAdjusted = false;
      }

      if (field === "vehicleTypeId") {
        r.vehicleTypeId = value;
        const amt = findAmount(r.feeTypeId, value);
        r.amount = amt ?? "";
        r.isAdjusted = false;
      }

      if (field === "amount") {
        r.amount = value;
        r.isAdjusted = true;
      }

      next[rowIndex] = r;
      return next;
    });
  };

  // ---- Places handlers ----
  const addPlaceRow = async (rowIndex) => {
    await ensureAllPlacesLoaded();

    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const places = [...(r.places || [])];

      places.push({
        ORIGINAL_PLACE_ID: "",
        PLACE_NAME: "",
        ENTRANCE_FEES_PP: "",
        GUIDE_TYPE: "",
        GUIDE_COST: "",
      });

      r.places = places;
      next[rowIndex] = r;
      return next;
    });
  };

  const removePlaceRow = (rowIndex, placeIndex) => {
    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const places = [...(r.places || [])];
      places.splice(placeIndex, 1);
      r.places = places;
      next[rowIndex] = r;
      return next;
    });
  };

  const onSelectPlace = async (rowIndex, placeIndex, selectedOption) => {
    const placeId = selectedOption?.value || "";
    const placeName = selectedOption?.label || "";

    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const places = [...(r.places || [])];
      const p = { ...(places[placeIndex] || {}) };

      p.ORIGINAL_PLACE_ID = placeId;
      p.PLACE_NAME = placeName;
      p.ENTRANCE_FEES_PP = "";

      places[placeIndex] = p;
      r.places = places;
      next[rowIndex] = r;
      return next;
    });

    const fee = await fetchEntranceFeeForPlace(placeId);

    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const places = [...(r.places || [])];
      const p = { ...(places[placeIndex] || {}) };

      p.ENTRANCE_FEES_PP = fee;

      places[placeIndex] = p;
      r.places = places;
      next[rowIndex] = r;
      return next;
    });
  };

  const onChangePlaceField = (rowIndex, placeIndex, field, value) => {
    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const places = [...(r.places || [])];
      const p = { ...(places[placeIndex] || {}) };

      p[field] = value;

      places[placeIndex] = p;
      r.places = places;
      next[rowIndex] = r;
      return next;
    });
  };

  // ---- Meals handlers (UPDATED) ----
  const addMealRow = async (rowIndex) => {
    await ensureMealsLookupLoaded();

    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const meals = [...(r.meals || [])];

      meals.push({
        // payload fields (must remain)
        ORIGINAL_MEAL_ID: "",
        RESAURANT_ID: "",
        TOTAL_AMOUNT_PP: "",

        // UI helper fields
        RESTAURANT_MEAL_TYPE_ID: "",
        RESTAURANT_MEAL_TYPE_NAME: "",
        RESTAURANT_MEAL_DESCRIPTION: "",
        RESTAURANT_MEAL_RATE_PP: "",
        RESTUARANT_NAME: "",
      });

      r.meals = meals;
      next[rowIndex] = r;
      return next;
    });
  };

  const removeMealRow = (rowIndex, mealIndex) => {
    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const meals = [...(r.meals || [])];
      meals.splice(mealIndex, 1);
      r.meals = meals;
      next[rowIndex] = r;
      return next;
    });
  };

  const onChangeMeal = (rowIndex, mealIndex, field, value) => {
    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const meals = [...(r.meals || [])];
      const m = { ...(meals[mealIndex] || {}) };

      // Restaurant changed -> reset type+meal+amount
      if (field === "RESAURANT_ID") {
        m.RESAURANT_ID = value;
        const restLabel =
          restaurantsOptions.find((o) => String(o.value) === String(value))
            ?.label || "";
        m.RESTUARANT_NAME = restLabel;

        m.RESTAURANT_MEAL_TYPE_ID = "";
        m.RESTAURANT_MEAL_TYPE_NAME = "";
        m.ORIGINAL_MEAL_ID = "";
        m.RESTAURANT_MEAL_DESCRIPTION = "";
        m.RESTAURANT_MEAL_RATE_PP = "";
        m.TOTAL_AMOUNT_PP = "";
      }

      // Meal type changed -> reset meal+amount
      if (field === "RESTAURANT_MEAL_TYPE_ID") {
        m.RESTAURANT_MEAL_TYPE_ID = value;

        const typeLabel =
          mealTypeOptionsForRestaurant(m.RESAURANT_ID).find(
            (o) => String(o.value) === String(value),
          )?.label || "";
        m.RESTAURANT_MEAL_TYPE_NAME = typeLabel;

        m.ORIGINAL_MEAL_ID = "";
        m.RESTAURANT_MEAL_DESCRIPTION = "";
        m.RESTAURANT_MEAL_RATE_PP = "";
        m.TOTAL_AMOUNT_PP = "";
      }

      // Meal changed -> set ORIGINAL_MEAL_ID and auto rate as TOTAL_AMOUNT_PP
      if (field === "ORIGINAL_MEAL_ID") {
        m.ORIGINAL_MEAL_ID = value;

        const mealOpt = mealOptionsForRestaurantType(
          m.RESAURANT_ID,
          m.RESTAURANT_MEAL_TYPE_ID,
        ).find((o) => String(o.value) === String(value));

        m.RESTAURANT_MEAL_DESCRIPTION = mealOpt?.label || "";
        m.RESTAURANT_MEAL_RATE_PP = mealOpt?.rate || "";
        m.TOTAL_AMOUNT_PP = mealOpt?.rate || "";
      }

      // Amount edited manually
      if (field === "TOTAL_AMOUNT_PP") {
        m.TOTAL_AMOUNT_PP = value;
      }

      meals[mealIndex] = m;
      r.meals = meals;
      next[rowIndex] = r;
      return next;
    });
  };

  // ---- Extra Services handlers (UPDATED ONLY HERE) ----
  const addExtraServiceRow = async (rowIndex) => {
    await ensureExtraServicesLoaded();

    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const extras = [...(r.extraServices || [])];
      extras.push({
        EXTRA_SERVICE_ID: "",
        EXTRA_SERVICE_COST_PP: "",
        EXTRA_SERVICE_NAME: "",
      });
      r.extraServices = extras;
      next[rowIndex] = r;
      return next;
    });
  };

  const removeExtraServiceRow = (rowIndex, exIndex) => {
    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const extras = [...(r.extraServices || [])];
      extras.splice(exIndex, 1);
      r.extraServices = extras;
      next[rowIndex] = r;
      return next;
    });
  };

  const onChangeExtraService = (rowIndex, exIndex, field, value) => {
    setDaysRows((prev) => {
      const next = [...prev];
      const r = { ...next[rowIndex] };
      const extras = [...(r.extraServices || [])];
      const e = { ...(extras[exIndex] || {}) };

      if (field === "EXTRA_SERVICE_ID") {
        e.EXTRA_SERVICE_ID = value;

        const selected = (extraServicesOptions || []).find(
          (o) => String(o.value) === String(value),
        );

        e.EXTRA_SERVICE_NAME = selected?.label || "";
        // Auto fill cost from API (still editable)
        e.EXTRA_SERVICE_COST_PP = selected?.cost ?? "";
      } else if (field === "EXTRA_SERVICE_COST_PP") {
        e.EXTRA_SERVICE_COST_PP = value;
      } else {
        e[field] = value;
      }

      extras[exIndex] = e;
      r.extraServices = extras;
      next[rowIndex] = r;
      return next;
    });
  };

  const handleSaveStep1 = () => {
    const payload = {
      QOUTATION_ID: Number(id),
      ROUTS: daysRows
        .filter((r) => !!r.routeId) // route optional per day
        .map((r) => ({
          ROUTE_DATE: ymdToDmyDash(r.date),
          ROUTE_ID: Number(r.routeId),
          TRANSPORTATION_TYPE_ID: numOrNull(r.feeTypeId),
          TRANSPORTATION_AMOUNT: numOrZero(r.amount),

          PLACES: (r.places || [])
            .filter((p) => !!p.ORIGINAL_PLACE_ID)
            .map((p) => ({
              ORIGINAL_PLACE_ID: Number(p.ORIGINAL_PLACE_ID),
              ENTRANCE_FEES_PP: numOrZero(p.ENTRANCE_FEES_PP),
              GUIDE_TYPE: numOrNull(p.GUIDE_TYPE),
              GUIDE_COST: numOrZero(p.GUIDE_COST),
            })),

          // PAYLOAD STAYS AS-IS (just values are set from dropdowns now)
          MEALS: (r.meals || [])
            .filter((m) => !!m.ORIGINAL_MEAL_ID && !!m.RESAURANT_ID)
            .map((m) => ({
              ORIGINAL_MEAL_ID: Number(m.ORIGINAL_MEAL_ID),
              RESAURANT_ID: Number(m.RESAURANT_ID),
              TOTAL_AMOUNT_PP: numOrZero(m.TOTAL_AMOUNT_PP),
            })),

          EXTRA_SERVICES: (r.extraServices || [])
            .filter((e) => !!e.EXTRA_SERVICE_ID)
            .map((e) => ({
              EXTRA_SERVICE_ID: Number(e.EXTRA_SERVICE_ID),
              EXTRA_SERVICE_COST_PP: numOrZero(e.EXTRA_SERVICE_COST_PP),
            })),
        })),
    };

    dispatch(saveQoutationStep1(id, payload));
  };

  const step1Loading = loadingStep1 || loadingStep1Submitted;

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumb title="Contracting" breadcrumbItem="Quotation" />

        {error && (
          <Alert color="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {successMessage ? (
          <Alert color="success" className="mb-3">
            {successMessage}
          </Alert>
        ) : null}

        {/* Basic Quotation Info */}
        <Card className="mb-3">
          <CardBody>
            {loadingDetails ? (
              <div className="text-center my-3">
                <Spinner size="sm" className="me-2" />
                Loading quotation info...
              </div>
            ) : details ? (
              <Row className="gy-2">
                <Col md={4}>
                  <div>
                    <strong>ID:</strong> {details.QOUTATION_ID}
                    {renderStatusBadge(details.ACTIVE_STATUS)}
                  </div>
                  <div className="text-muted">
                    <small>
                      Created: {details.CREATED_ON || "-"} | Updated:{" "}
                      {details.UPDATED_ON || "-"}
                    </small>
                  </div>
                </Col>

                <Col md={4}>
                  <div>
                    <strong>Client:</strong> {details.CLIENT_NAME || "-"}
                  </div>
                  <div>
                    <strong>Group:</strong>{" "}
                    {details.QOUTATION_GROUP_NAME || "-"}
                  </div>
                  <div>
                    <strong>Total Pax:</strong>{" "}
                    {details.QOUTATION_TOTAL_PAX ?? "-"}
                  </div>
                </Col>

                <Col md={4}>
                  <div>
                    <strong>Transportation:</strong>{" "}
                    {details.TRANSPORTATION_COMPANY_NAME || "-"}
                  </div>
                  <div>
                    <strong>Arriving:</strong>{" "}
                    {details.QOUTATION_ARRIVING_DATE || "-"}
                  </div>
                  <div>
                    <strong>Departuring:</strong>{" "}
                    {details.QOUTATION_DEPARTURING_DATE || "-"}
                  </div>
                </Col>
              </Row>
            ) : (
              <Alert color="warning" className="mb-0">
                Quotation not found.
              </Alert>
            )}
          </CardBody>
        </Card>

        {/* Wizard */}
        <Card>
          <CardBody>
            <h4 className="card-title mb-4">Quotation Wizard</h4>

            <div className="wizard clearfix">
              <div className="steps clearfix">
                <ul>
                  <NavItem className={classnames({ current: activeTab === 1 })}>
                    <NavLink
                      className={classnames({ current: activeTab === 1 })}
                      onClick={() => setactiveTab(1)}
                      disabled={!(passedSteps || []).includes(1)}
                    >
                      <span className="number">1.</span> Step 1
                    </NavLink>
                  </NavItem>

                  <NavItem className={classnames({ current: activeTab === 2 })}>
                    <NavLink
                      className={classnames({ active: activeTab === 2 })}
                      onClick={() => setactiveTab(2)}
                      disabled={!(passedSteps || []).includes(2)}
                    >
                      <span className="number">2.</span> Step 2
                    </NavLink>
                  </NavItem>

                  <NavItem className={classnames({ current: activeTab === 3 })}>
                    <NavLink
                      className={classnames({ active: activeTab === 3 })}
                      onClick={() => setactiveTab(3)}
                      disabled={!(passedSteps || []).includes(3)}
                    >
                      <span className="number">3.</span> Step 3
                    </NavLink>
                  </NavItem>

                  <NavItem className={classnames({ current: activeTab === 4 })}>
                    <NavLink
                      className={classnames({ active: activeTab === 4 })}
                      onClick={() => setactiveTab(4)}
                      disabled={!(passedSteps || []).includes(4)}
                    >
                      <span className="number">4.</span> Review
                    </NavLink>
                  </NavItem>
                </ul>
              </div>

              <div className="content clearfix">
                <TabContent activeTab={activeTab} className="body">
                  <TabPane tabId={1}>
                    {step1Loading ? (
                      <div className="text-center my-3">
                        <Spinner size="sm" className="me-2" />
                        Loading step 1...
                      </div>
                    ) : !step1Options ? (
                      <Alert color="warning" className="mb-0">
                        Step 1 options not found.
                      </Alert>
                    ) : (
                      <>
                        <Row className="mb-3 align-items-center">
                          <Col md={4}>
                            <div>
                              <strong>Number of Days:</strong>{" "}
                              {numberOfDays || 0}
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <strong>Arriving Date:</strong>{" "}
                              {arrivingDate || "-"}
                            </div>
                          </Col>
                          <Col md={4} className="text-md-end mt-2 mt-md-0">
                            <Badge
                              color={
                                hasSubmittedStep1 ? "success" : "secondary"
                              }
                            >
                              {hasSubmittedStep1
                                ? "Step 1 saved"
                                : "Step 1 not saved yet"}
                            </Badge>
                          </Col>
                        </Row>

                        <Row className="mb-2">
                          <Col className="d-flex justify-content-end gap-2">
                            {hasSubmittedStep1 && !isEditingStep1 ? (
                              <Button
                                color="primary"
                                size="sm"
                                onClick={() => setIsEditingStep1(true)}
                              >
                                Edit Step 1
                              </Button>
                            ) : null}

                            {isEditingStep1 ? (
                              <Button
                                color="primary"
                                onClick={handleSaveStep1}
                                disabled={savingStep1}
                              >
                                {savingStep1 ? (
                                  <>
                                    <Spinner size="sm" className="me-2" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save Step 1"
                                )}
                              </Button>
                            ) : null}
                          </Col>
                        </Row>
                        <div className="table-responsive">
                          <Table className="table table-bordered align-middle">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: 80 }}>Day</th>
                                <th style={{ width: 140 }}>Date</th>
                                <th style={{ minWidth: 320 }}>Route</th>
                                <th style={{ width: 220 }}>
                                  Transportation Fee Type
                                </th>
                                <th style={{ width: 180 }}>Vehicle Type</th>
                                <th style={{ width: 160 }}>Amount</th>
                                <th style={{ width: 160 }}>Details</th>
                              </tr>
                            </thead>

                            <tbody>
                              {daysRows.map((r, idx) => {
                                const vehicleOptions = vehicleOptionsForFeeType(
                                  r.feeTypeId,
                                );

                                const selectedRoute =
                                  routeOptions.find(
                                    (o) =>
                                      String(o.value) === String(r.routeId),
                                  ) || null;

                                const selectedFeeType =
                                  transportFeeTypeOptions.find(
                                    (o) =>
                                      String(o.value) === String(r.feeTypeId),
                                  ) || null;

                                const selectedVehicle =
                                  vehicleOptions.find(
                                    (o) =>
                                      String(o.value) ===
                                      String(r.vehicleTypeId),
                                  ) || null;

                                const isOpen = !!expandedDays[r.dayNo];
                                const viewOnly =
                                  hasSubmittedStep1 && !isEditingStep1;

                                return (
                                  <React.Fragment key={`${r.dayNo}-${r.date}`}>
                                    <tr>
                                      <td>
                                        <div className="d-flex align-items-center gap-2">
                                          <span
                                            id={`dayHover-${r.dayNo}`}
                                            className="fw-semibold"
                                          >
                                            {r.dayNo}
                                          </span>
                                          <i
                                            className="bx bx-info-circle text-muted"
                                            id={`dayHoverIcon-${r.dayNo}`}
                                            style={{ cursor: "help" }}
                                          />
                                          <UncontrolledPopover
                                            trigger="hover"
                                            placement="right"
                                            target={`dayHoverIcon-${r.dayNo}`}
                                            fade={false}
                                          >
                                            <PopoverHeader>
                                              Day {r.dayNo} • {r.date || "-"}
                                            </PopoverHeader>
                                            <PopoverBody>
                                              {(() => {
                                                const s = getDaySummary(r);
                                                return (
                                                  <div className="small">
                                                    <div className="mb-1">
                                                      <strong>Route:</strong>{" "}
                                                      {selectedRoute?.label ||
                                                        "-"}
                                                    </div>
                                                    <div className="mb-1">
                                                      <strong>
                                                        Transportation:
                                                      </strong>{" "}
                                                      {selectedFeeType?.label ||
                                                        "-"}
                                                    </div>
                                                    <div className="mb-1">
                                                      <strong>Vehicle:</strong>{" "}
                                                      {selectedVehicle?.label ||
                                                        "-"}
                                                    </div>
                                                    <div className="mb-2">
                                                      <strong>Amount:</strong>{" "}
                                                      {r.amount ?? "-"}
                                                    </div>

                                                    <div className="d-flex flex-wrap gap-2">
                                                      <Badge color="secondary">
                                                        Places: {s.placesCount}
                                                      </Badge>
                                                      <Badge color="secondary">
                                                        Meals: {s.mealsCount}
                                                      </Badge>
                                                      <Badge color="secondary">
                                                        Extras: {s.extrasCount}
                                                      </Badge>
                                                    </div>

                                                    <hr className="my-2" />

                                                    <div className="d-flex flex-column gap-1">
                                                      <div>
                                                        <strong>
                                                          Entrance total:
                                                        </strong>{" "}
                                                        {Number(
                                                          s.entranceTotal || 0,
                                                        ).toFixed(2)}
                                                      </div>
                                                      <div>
                                                        <strong>
                                                          Guides total:
                                                        </strong>{" "}
                                                        {Number(
                                                          s.guidesTotal || 0,
                                                        ).toFixed(2)}
                                                      </div>
                                                      <div>
                                                        <strong>
                                                          Meals total:
                                                        </strong>{" "}
                                                        {Number(
                                                          s.mealsTotal || 0,
                                                        ).toFixed(2)}
                                                      </div>
                                                      <div>
                                                        <strong>
                                                          Extras total:
                                                        </strong>{" "}
                                                        {Number(
                                                          s.extrasTotal || 0,
                                                        ).toFixed(2)}
                                                      </div>
                                                    </div>

                                                    <div className="mt-2">
                                                      <Button
                                                        size="sm"
                                                        color="link"
                                                        className="p-0"
                                                        onClick={() =>
                                                          openDayDetailsModal(
                                                            r.dayNo,
                                                          )
                                                        }
                                                      >
                                                        View full details
                                                      </Button>
                                                    </div>
                                                  </div>
                                                );
                                              })()}
                                            </PopoverBody>
                                          </UncontrolledPopover>
                                        </div>
                                      </td>
                                      <td>{r.date || "-"}</td>

                                      <td>
                                        {viewOnly ? (
                                          <span>
                                            {selectedRoute?.label || "-"}
                                          </span>
                                        ) : (
                                          <ThemeSelect
                                            value={selectedRoute}
                                            onChange={(opt) =>
                                              onChangeRow(
                                                idx,
                                                "routeId",
                                                opt ? opt.value : "",
                                              )
                                            }
                                            options={routeOptions}
                                            isClearable
                                            isSearchable
                                            placeholder="Search route..."
                                          />
                                        )}
                                      </td>

                                      <td>
                                        {viewOnly ? (
                                          <span>
                                            {selectedFeeType?.label || "-"}
                                          </span>
                                        ) : (
                                          <ThemeSelect
                                            value={selectedFeeType}
                                            onChange={(opt) =>
                                              onChangeRow(
                                                idx,
                                                "feeTypeId",
                                                opt ? opt.value : "",
                                              )
                                            }
                                            options={transportFeeTypeOptions}
                                            isClearable
                                            isSearchable
                                            placeholder="Select fee type..."
                                          />
                                        )}
                                      </td>

                                      <td>
                                        {viewOnly ? (
                                          <span>
                                            {selectedVehicle?.label || "-"}
                                          </span>
                                        ) : (
                                          <ThemeSelect
                                            value={selectedVehicle}
                                            onChange={(opt) =>
                                              onChangeRow(
                                                idx,
                                                "vehicleTypeId",
                                                opt ? opt.value : "",
                                              )
                                            }
                                            options={vehicleOptions}
                                            isClearable
                                            isSearchable
                                            placeholder="Select vehicle..."
                                            isDisabled={!r.feeTypeId}
                                          />
                                        )}
                                      </td>

                                      <td>
                                        {viewOnly ? (
                                          <span>{r.amount ?? "-"}</span>
                                        ) : (
                                          <Input
                                            type="number"
                                            value={r.amount ?? ""}
                                            onChange={(e) =>
                                              onChangeRow(
                                                idx,
                                                "amount",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="0.00"
                                            disabled={!r.feeTypeId}
                                          />
                                        )}
                                      </td>

                                      <td>
                                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                                          <Button
                                            size="sm"
                                            color="secondary"
                                            onClick={() =>
                                              toggleDayExpand(r.dayNo)
                                            }
                                          >
                                            {isOpen ? "Hide" : "Show"}
                                          </Button>

                                          <Button
                                            size="sm"
                                            color="info"
                                            outline
                                            onClick={() =>
                                              openDayDetailsModal(r.dayNo)
                                            }
                                          >
                                            View
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>

                                    <tr>
                                      <td colSpan="7" className="p-0">
                                        <Collapse isOpen={isOpen}>
                                          <div className="p-3">
                                            {/* ===== Places ===== */}
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                              <h5 className="mb-0">
                                                Places, Guides and Entrance Fees
                                              </h5>

                                              {!viewOnly ? (
                                                <Button
                                                  size="sm"
                                                  color="primary"
                                                  onClick={() =>
                                                    addPlaceRow(idx)
                                                  }
                                                  disabled={!r.routeId}
                                                >
                                                  {loadingAllPlaces
                                                    ? "Loading..."
                                                    : "+ Add Place"}
                                                </Button>
                                              ) : null}
                                            </div>

                                            {!r.routeId ? (
                                              <Alert
                                                color="info"
                                                className="mb-3"
                                              >
                                                Select a route first to load its
                                                places.
                                              </Alert>
                                            ) : (
                                              <div className="table-responsive mb-4">
                                                <Table className="table table-sm table-bordered align-middle mb-0">
                                                  <thead className="table-light">
                                                    <tr>
                                                      <th
                                                        style={{
                                                          minWidth: 260,
                                                        }}
                                                      >
                                                        Place
                                                      </th>
                                                      <th
                                                        style={{ width: 180 }}
                                                      >
                                                        Entrance Fees PP
                                                      </th>
                                                      <th
                                                        style={{ width: 200 }}
                                                      >
                                                        Guide Type
                                                      </th>
                                                      <th
                                                        style={{ width: 160 }}
                                                      >
                                                        Guide Cost
                                                      </th>
                                                      {!viewOnly ? (
                                                        <th
                                                          style={{ width: 90 }}
                                                        >
                                                          Action
                                                        </th>
                                                      ) : null}
                                                    </tr>
                                                  </thead>

                                                  <tbody>
                                                    {(r.places || []).length ? (
                                                      (r.places || []).map(
                                                        (p, pIdx) => {
                                                          const selectedPlaceOption =
                                                            p.ORIGINAL_PLACE_ID
                                                              ? {
                                                                  value: Number(
                                                                    p.ORIGINAL_PLACE_ID,
                                                                  ),
                                                                  label:
                                                                    p.PLACE_NAME ||
                                                                    String(
                                                                      p.ORIGINAL_PLACE_ID,
                                                                    ),
                                                                }
                                                              : null;

                                                          return (
                                                            <tr
                                                              key={`${r.dayNo}-place-${pIdx}`}
                                                            >
                                                              <td>
                                                                {viewOnly ? (
                                                                  <span>
                                                                    {p.PLACE_NAME ||
                                                                      "-"}
                                                                  </span>
                                                                ) : (
                                                                  <ThemeSelect
                                                                    value={
                                                                      selectedPlaceOption
                                                                    }
                                                                    options={
                                                                      placesDropdownOptions
                                                                    }
                                                                    isClearable
                                                                    isSearchable
                                                                    placeholder="Search place..."
                                                                    onMenuOpen={
                                                                      ensureAllPlacesLoaded
                                                                    }
                                                                    onChange={(
                                                                      opt,
                                                                    ) =>
                                                                      onSelectPlace(
                                                                        idx,
                                                                        pIdx,
                                                                        opt,
                                                                      )
                                                                    }
                                                                  />
                                                                )}
                                                              </td>

                                                              <td>
                                                                {viewOnly ? (
                                                                  <span>
                                                                    {p.ENTRANCE_FEES_PP ??
                                                                      "-"}
                                                                  </span>
                                                                ) : (
                                                                  <Input
                                                                    type="number"
                                                                    value={
                                                                      p.ENTRANCE_FEES_PP ??
                                                                      ""
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) =>
                                                                      onChangePlaceField(
                                                                        idx,
                                                                        pIdx,
                                                                        "ENTRANCE_FEES_PP",
                                                                        e.target
                                                                          .value,
                                                                      )
                                                                    }
                                                                    placeholder="0.00"
                                                                  />
                                                                )}
                                                              </td>

                                                              <td>
                                                                {viewOnly ? (
                                                                  <span>
                                                                    {p.GUIDE_TYPE_NAME ||
                                                                      guideTypeOptions.find(
                                                                        (o) =>
                                                                          String(
                                                                            o.value,
                                                                          ) ===
                                                                          String(
                                                                            p.GUIDE_TYPE,
                                                                          ),
                                                                      )
                                                                        ?.label ||
                                                                      "-"}
                                                                  </span>
                                                                ) : (
                                                                  <ThemeSelect
                                                                    value={
                                                                      p.GUIDE_TYPE
                                                                        ? guideTypeOptions.find(
                                                                            (
                                                                              o,
                                                                            ) =>
                                                                              String(
                                                                                o.value,
                                                                              ) ===
                                                                              String(
                                                                                p.GUIDE_TYPE,
                                                                              ),
                                                                          ) ||
                                                                          null
                                                                        : null
                                                                    }
                                                                    options={
                                                                      guideTypeOptions
                                                                    }
                                                                    isClearable
                                                                    isSearchable
                                                                    placeholder={
                                                                      loadingGuideTypes
                                                                        ? "Loading..."
                                                                        : "Select guide type..."
                                                                    }
                                                                    onChange={(
                                                                      opt,
                                                                    ) =>
                                                                      onChangePlaceField(
                                                                        idx,
                                                                        pIdx,
                                                                        "GUIDE_TYPE",
                                                                        opt
                                                                          ? opt.value
                                                                          : "",
                                                                      )
                                                                    }
                                                                    isDisabled={
                                                                      loadingGuideTypes
                                                                    }
                                                                  />
                                                                )}
                                                              </td>

                                                              <td>
                                                                {viewOnly ? (
                                                                  <span>
                                                                    {p.GUIDE_COST ??
                                                                      "-"}
                                                                  </span>
                                                                ) : (
                                                                  <Input
                                                                    type="number"
                                                                    value={
                                                                      p.GUIDE_COST ??
                                                                      ""
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) =>
                                                                      onChangePlaceField(
                                                                        idx,
                                                                        pIdx,
                                                                        "GUIDE_COST",
                                                                        e.target
                                                                          .value,
                                                                      )
                                                                    }
                                                                    placeholder="0.00"
                                                                  />
                                                                )}
                                                              </td>

                                                              {!viewOnly ? (
                                                                <td>
                                                                  <Button
                                                                    size="sm"
                                                                    color="danger"
                                                                    onClick={() =>
                                                                      removePlaceRow(
                                                                        idx,
                                                                        pIdx,
                                                                      )
                                                                    }
                                                                  >
                                                                    X
                                                                  </Button>
                                                                </td>
                                                              ) : null}
                                                            </tr>
                                                          );
                                                        },
                                                      )
                                                    ) : (
                                                      <tr>
                                                        <td
                                                          colSpan={
                                                            viewOnly ? 4 : 5
                                                          }
                                                        >
                                                          <Alert
                                                            color="info"
                                                            className="mb-0"
                                                          >
                                                            No places selected
                                                            for this day.
                                                          </Alert>
                                                        </td>
                                                      </tr>
                                                    )}
                                                  </tbody>
                                                </Table>
                                              </div>
                                            )}

                                            {/* ===== Meals (UPDATED) ===== */}
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                              <h5 className="mb-0">Meals</h5>
                                              {!viewOnly ? (
                                                <Button
                                                  size="sm"
                                                  color="primary"
                                                  onClick={() =>
                                                    addMealRow(idx)
                                                  }
                                                  disabled={!r.routeId}
                                                >
                                                  {loadingMealsLookup
                                                    ? "Loading..."
                                                    : "+ Add Meal"}
                                                </Button>
                                              ) : null}
                                            </div>

                                            <div className="table-responsive mb-4">
                                              <Table className="table table-sm table-bordered align-middle mb-0">
                                                <thead className="table-light">
                                                  <tr>
                                                    <th
                                                      style={{ minWidth: 240 }}
                                                    >
                                                      Restaurant
                                                    </th>
                                                    <th
                                                      style={{ minWidth: 200 }}
                                                    >
                                                      Meal Type
                                                    </th>
                                                    <th
                                                      style={{ minWidth: 260 }}
                                                    >
                                                      Meal
                                                    </th>
                                                    <th style={{ width: 180 }}>
                                                      Amount PP
                                                    </th>
                                                    {!viewOnly ? (
                                                      <th style={{ width: 90 }}>
                                                        Action
                                                      </th>
                                                    ) : null}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {(r.meals || []).length ? (
                                                    (r.meals || []).map(
                                                      (m, mIdx) => {
                                                        const selectedRestaurant =
                                                          m.RESAURANT_ID
                                                            ? restaurantsOptions.find(
                                                                (o) =>
                                                                  String(
                                                                    o.value,
                                                                  ) ===
                                                                  String(
                                                                    m.RESAURANT_ID,
                                                                  ),
                                                              ) || null
                                                            : null;

                                                        const mealTypeOptions =
                                                          m.RESAURANT_ID
                                                            ? mealTypeOptionsForRestaurant(
                                                                m.RESAURANT_ID,
                                                              )
                                                            : [];

                                                        const selectedMealType =
                                                          m.RESTAURANT_MEAL_TYPE_ID
                                                            ? mealTypeOptions.find(
                                                                (o) =>
                                                                  String(
                                                                    o.value,
                                                                  ) ===
                                                                  String(
                                                                    m.RESTAURANT_MEAL_TYPE_ID,
                                                                  ),
                                                              ) || null
                                                            : null;

                                                        const mealOptions =
                                                          m.RESAURANT_ID &&
                                                          m.RESTAURANT_MEAL_TYPE_ID
                                                            ? mealOptionsForRestaurantType(
                                                                m.RESAURANT_ID,
                                                                m.RESTAURANT_MEAL_TYPE_ID,
                                                              )
                                                            : [];

                                                        const selectedMeal =
                                                          m.ORIGINAL_MEAL_ID
                                                            ? mealOptions.find(
                                                                (o) =>
                                                                  String(
                                                                    o.value,
                                                                  ) ===
                                                                  String(
                                                                    m.ORIGINAL_MEAL_ID,
                                                                  ),
                                                              ) || null
                                                            : null;

                                                        return (
                                                          <tr
                                                            key={`${r.dayNo}-meal-${mIdx}`}
                                                          >
                                                            <td>
                                                              {viewOnly ? (
                                                                <span>
                                                                  {m.RESTUARANT_NAME ||
                                                                    selectedRestaurant?.label ||
                                                                    "-"}
                                                                </span>
                                                              ) : (
                                                                <ThemeSelect
                                                                  value={
                                                                    selectedRestaurant
                                                                  }
                                                                  options={
                                                                    restaurantsOptions
                                                                  }
                                                                  isClearable
                                                                  isSearchable
                                                                  placeholder={
                                                                    loadingMealsLookup
                                                                      ? "Loading..."
                                                                      : "Select restaurant..."
                                                                  }
                                                                  onMenuOpen={
                                                                    ensureMealsLookupLoaded
                                                                  }
                                                                  onChange={(
                                                                    opt,
                                                                  ) =>
                                                                    onChangeMeal(
                                                                      idx,
                                                                      mIdx,
                                                                      "RESAURANT_ID",
                                                                      opt
                                                                        ? opt.value
                                                                        : "",
                                                                    )
                                                                  }
                                                                />
                                                              )}
                                                            </td>

                                                            <td>
                                                              {viewOnly ? (
                                                                <span>
                                                                  {m.RESTAURANT_MEAL_TYPE_NAME ||
                                                                    selectedMealType?.label ||
                                                                    "-"}
                                                                </span>
                                                              ) : (
                                                                <ThemeSelect
                                                                  value={
                                                                    selectedMealType
                                                                  }
                                                                  options={
                                                                    mealTypeOptions
                                                                  }
                                                                  isClearable
                                                                  isSearchable
                                                                  placeholder="Select type..."
                                                                  onMenuOpen={
                                                                    ensureMealsLookupLoaded
                                                                  }
                                                                  isDisabled={
                                                                    !m.RESAURANT_ID
                                                                  }
                                                                  onChange={(
                                                                    opt,
                                                                  ) =>
                                                                    onChangeMeal(
                                                                      idx,
                                                                      mIdx,
                                                                      "RESTAURANT_MEAL_TYPE_ID",
                                                                      opt
                                                                        ? opt.value
                                                                        : "",
                                                                    )
                                                                  }
                                                                />
                                                              )}
                                                            </td>

                                                            <td>
                                                              {viewOnly ? (
                                                                <span>
                                                                  {m.RESTAURANT_MEAL_DESCRIPTION ||
                                                                    selectedMeal?.label ||
                                                                    "-"}
                                                                </span>
                                                              ) : (
                                                                <ThemeSelect
                                                                  value={
                                                                    selectedMeal
                                                                  }
                                                                  options={
                                                                    mealOptions
                                                                  }
                                                                  isClearable
                                                                  isSearchable
                                                                  placeholder="Select meal..."
                                                                  onMenuOpen={
                                                                    ensureMealsLookupLoaded
                                                                  }
                                                                  isDisabled={
                                                                    !m.RESAURANT_ID ||
                                                                    !m.RESTAURANT_MEAL_TYPE_ID
                                                                  }
                                                                  onChange={(
                                                                    opt,
                                                                  ) =>
                                                                    onChangeMeal(
                                                                      idx,
                                                                      mIdx,
                                                                      "ORIGINAL_MEAL_ID",
                                                                      opt
                                                                        ? opt.value
                                                                        : "",
                                                                    )
                                                                  }
                                                                />
                                                              )}
                                                            </td>

                                                            <td>
                                                              {viewOnly ? (
                                                                <span>
                                                                  {m.TOTAL_AMOUNT_PP ??
                                                                    "-"}
                                                                </span>
                                                              ) : (
                                                                <Input
                                                                  type="number"
                                                                  value={
                                                                    m.TOTAL_AMOUNT_PP ??
                                                                    ""
                                                                  }
                                                                  onChange={(
                                                                    e,
                                                                  ) =>
                                                                    onChangeMeal(
                                                                      idx,
                                                                      mIdx,
                                                                      "TOTAL_AMOUNT_PP",
                                                                      e.target
                                                                        .value,
                                                                    )
                                                                  }
                                                                  placeholder="0.00"
                                                                />
                                                              )}
                                                            </td>

                                                            {!viewOnly ? (
                                                              <td>
                                                                <Button
                                                                  size="sm"
                                                                  color="danger"
                                                                  onClick={() =>
                                                                    removeMealRow(
                                                                      idx,
                                                                      mIdx,
                                                                    )
                                                                  }
                                                                >
                                                                  X
                                                                </Button>
                                                              </td>
                                                            ) : null}
                                                          </tr>
                                                        );
                                                      },
                                                    )
                                                  ) : (
                                                    <tr>
                                                      <td
                                                        colSpan={
                                                          viewOnly ? 4 : 5
                                                        }
                                                      >
                                                        <Alert
                                                          color="info"
                                                          className="mb-0"
                                                        >
                                                          No meals for this day.
                                                        </Alert>
                                                      </td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                              </Table>
                                            </div>

                                            {/* Extra Services UPDATED */}
                                            {/* <div className="d-flex justify-content-between align-items-center mb-2">
                                              <h5 className="mb-0">
                                                Extra Services
                                              </h5>
                                              {!viewOnly ? (
                                                <Button
                                                  size="sm"
                                                  color="primary"
                                                  onClick={() =>
                                                    addExtraServiceRow(idx)
                                                  }
                                                  disabled={!r.routeId}
                                                >
                                                  + Add Service
                                                </Button>
                                              ) : null}
                                            </div> */}

                                            {/* <div className="table-responsive">
                                              <Table className="table table-sm table-bordered align-middle mb-0">
                                                <thead className="table-light">
                                                  <tr>
                                                    <th style={{ width: 360 }}>
                                                      Extra Service
                                                    </th>
                                                    <th style={{ width: 220 }}>
                                                      Cost PP
                                                    </th>
                                                    {!viewOnly ? (
                                                      <th style={{ width: 90 }}>
                                                        Action
                                                      </th>
                                                    ) : null}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {(r.extraServices || [])
                                                    .length ? (
                                                    (r.extraServices || []).map(
                                                      (e, eIdx) => {
                                                        const selectedService =
                                                          e.EXTRA_SERVICE_ID
                                                            ? extraServicesOptions.find(
                                                                (o) =>
                                                                  String(
                                                                    o.value,
                                                                  ) ===
                                                                  String(
                                                                    e.EXTRA_SERVICE_ID,
                                                                  ),
                                                              ) || null
                                                            : null;

                                                        return (
                                                          <tr
                                                            key={`${r.dayNo}-extra-${eIdx}`}
                                                          >
                                                            <td>
                                                              {viewOnly ? (
                                                                <span>
                                                                  {e.EXTRA_SERVICE_NAME ||
                                                                    selectedService?.label ||
                                                                    e.EXTRA_SERVICE_ID ||
                                                                    "-"}
                                                                </span>
                                                              ) : (
                                                                <ThemeSelect
                                                                  value={
                                                                    selectedService
                                                                  }
                                                                  options={
                                                                    extraServicesOptions
                                                                  }
                                                                  isClearable
                                                                  isSearchable
                                                                  placeholder={
                                                                    loadingExtraServicesLookup
                                                                      ? "Loading..."
                                                                      : "Select service..."
                                                                  }
                                                                  onMenuOpen={
                                                                    ensureExtraServicesLoaded
                                                                  }
                                                                  onChange={(
                                                                    opt,
                                                                  ) =>
                                                                    onChangeExtraService(
                                                                      idx,
                                                                      eIdx,
                                                                      "EXTRA_SERVICE_ID",
                                                                      opt
                                                                        ? opt.value
                                                                        : "",
                                                                    )
                                                                  }
                                                                />
                                                              )}
                                                            </td>

                                                            <td>
                                                              {viewOnly ? (
                                                                <span>
                                                                  {e.EXTRA_SERVICE_COST_PP ??
                                                                    "-"}
                                                                </span>
                                                              ) : (
                                                                <Input
                                                                  type="number"
                                                                  value={
                                                                    e.EXTRA_SERVICE_COST_PP ??
                                                                    ""
                                                                  }
                                                                  onChange={(
                                                                    ev,
                                                                  ) =>
                                                                    onChangeExtraService(
                                                                      idx,
                                                                      eIdx,
                                                                      "EXTRA_SERVICE_COST_PP",
                                                                      ev.target
                                                                        .value,
                                                                    )
                                                                  }
                                                                  placeholder="0.00"
                                                                />
                                                              )}
                                                            </td>

                                                            {!viewOnly ? (
                                                              <td>
                                                                <Button
                                                                  size="sm"
                                                                  color="danger"
                                                                  onClick={() =>
                                                                    removeExtraServiceRow(
                                                                      idx,
                                                                      eIdx,
                                                                    )
                                                                  }
                                                                >
                                                                  X
                                                                </Button>
                                                              </td>
                                                            ) : null}
                                                          </tr>
                                                        );
                                                      },
                                                    )
                                                  ) : (
                                                    <tr>
                                                      <td
                                                        colSpan={
                                                          viewOnly ? 2 : 3
                                                        }
                                                      >
                                                        <Alert
                                                          color="info"
                                                          className="mb-0"
                                                        >
                                                          No extra services for
                                                          this day.
                                                        </Alert>
                                                      </td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                              </Table>
                                            </div> */}
                                          </div>
                                        </Collapse>
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                );
                              })}

                              {!daysRows.length ? (
                                <tr>
                                  <td colSpan="7">
                                    <Alert color="info" className="mb-0">
                                      No days generated (missing NUMBER_OF_DAYS
                                      or ARRIVING_DATE).
                                    </Alert>
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </Table>
                        </div>
                        {/* Step 1 - Day Details Modal (read-friendly, no dimming) */}
                        <Modal
                          isOpen={dayDetailsModalOpen}
                          toggle={closeDayDetailsModal}
                          size="xl"
                          centered
                          fade={false}
                        >
                          <ModalHeader toggle={closeDayDetailsModal}>
                            {(() => {
                              const row = (daysRows || []).find(
                                (d) =>
                                  Number(d?.dayNo) ===
                                  Number(dayDetailsModalDayNo),
                              );
                              return row
                                ? `Day ${row.dayNo} • ${row.date || "-"}`
                                : "Day details";
                            })()}
                          </ModalHeader>

                          <ModalBody>
                            {(() => {
                              const row = (daysRows || []).find(
                                (d) =>
                                  Number(d?.dayNo) ===
                                  Number(dayDetailsModalDayNo),
                              );
                              if (!row) {
                                return (
                                  <Alert color="warning" className="mb-0">
                                    Day record not found.
                                  </Alert>
                                );
                              }

                              const selectedRoute =
                                routeOptions.find(
                                  (o) =>
                                    String(o.value) === String(row.routeId),
                                ) || null;

                              const selectedFeeType =
                                transportFeeTypeOptions.find(
                                  (o) =>
                                    String(o.value) === String(row.feeTypeId),
                                ) || null;

                              const vehicleOptions = vehicleOptionsForFeeType(
                                row.feeTypeId,
                              );
                              const selectedVehicle =
                                vehicleOptions.find(
                                  (o) =>
                                    String(o.value) ===
                                    String(row.vehicleTypeId),
                                ) || null;

                              const s = getDaySummary(row);

                              return (
                                <>
                                  <Row className="g-3 mb-3">
                                    <Col md={6}>
                                      <Card className="mb-0">
                                        <CardBody>
                                          <div className="d-flex flex-column gap-2">
                                            <div>
                                              <strong>Route:</strong>{" "}
                                              {selectedRoute?.label || "-"}
                                            </div>
                                            <div>
                                              <strong>
                                                Transportation Fee Type:
                                              </strong>{" "}
                                              {selectedFeeType?.label || "-"}
                                            </div>
                                            <div>
                                              <strong>Vehicle Type:</strong>{" "}
                                              {selectedVehicle?.label || "-"}
                                            </div>
                                            <div>
                                              <strong>Amount:</strong>{" "}
                                              {row.amount ?? "-"}
                                            </div>
                                          </div>
                                        </CardBody>
                                      </Card>
                                    </Col>

                                    <Col md={6}>
                                      <Card className="mb-0">
                                        <CardBody>
                                          <div className="d-flex flex-wrap gap-2 mb-2">
                                            <Badge color="secondary">
                                              Places: {s.placesCount}
                                            </Badge>
                                            <Badge color="secondary">
                                              Meals: {s.mealsCount}
                                            </Badge>
                                            <Badge color="secondary">
                                              Extras: {s.extrasCount}
                                            </Badge>
                                          </div>

                                          <div className="small text-muted">
                                            Totals (per person):
                                          </div>

                                          <div className="d-flex flex-column gap-1">
                                            <div>
                                              <strong>Entrance:</strong>{" "}
                                              {Number(
                                                s.entranceTotal || 0,
                                              ).toFixed(2)}
                                            </div>
                                            <div>
                                              <strong>Guides:</strong>{" "}
                                              {Number(
                                                s.guidesTotal || 0,
                                              ).toFixed(2)}
                                            </div>
                                            <div>
                                              <strong>Meals:</strong>{" "}
                                              {Number(
                                                s.mealsTotal || 0,
                                              ).toFixed(2)}
                                            </div>
                                            <div>
                                              <strong>Extras:</strong>{" "}
                                              {Number(
                                                s.extrasTotal || 0,
                                              ).toFixed(2)}
                                            </div>
                                          </div>
                                        </CardBody>
                                      </Card>
                                    </Col>
                                  </Row>

                                  <Row className="g-3">
                                    <Col lg={12}>
                                      <Card className="mb-0">
                                        <CardBody>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="mb-0">
                                              Places, Guides and Entrance Fees
                                            </h5>
                                            <small className="text-muted">
                                              {Array.isArray(row.places)
                                                ? row.places.length
                                                : 0}{" "}
                                              items
                                            </small>
                                          </div>

                                          {(row.places || []).length === 0 ? (
                                            <Alert
                                              color="secondary"
                                              className="mb-0"
                                            >
                                              No places added.
                                            </Alert>
                                          ) : (
                                            <div className="table-responsive">
                                              <Table className="table table-sm table-bordered align-middle mb-0">
                                                <thead className="table-light">
                                                  <tr>
                                                    <th
                                                      style={{ minWidth: 220 }}
                                                    >
                                                      Place
                                                    </th>
                                                    <th style={{ width: 160 }}>
                                                      Entrance (PP)
                                                    </th>
                                                    <th
                                                      style={{ minWidth: 200 }}
                                                    >
                                                      Guide Type
                                                    </th>
                                                    <th style={{ width: 160 }}>
                                                      Guide Cost
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {(row.places || []).map(
                                                    (p, i) => (
                                                      <tr
                                                        key={`p-${row.dayNo}-${i}`}
                                                      >
                                                        <td className="fw-semibold">
                                                          {p?.PLACE_NAME || "-"}
                                                        </td>
                                                        <td>
                                                          {p?.ENTRANCE_FEES_PP ??
                                                            "-"}
                                                        </td>
                                                        <td>
                                                          {p?.GUIDE_TYPE_NAME ||
                                                            p?.GUIDE_TYPE ||
                                                            "-"}
                                                        </td>
                                                        <td>
                                                          {p?.GUIDE_COST ?? "-"}
                                                        </td>
                                                      </tr>
                                                    ),
                                                  )}
                                                </tbody>
                                              </Table>
                                            </div>
                                          )}
                                        </CardBody>
                                      </Card>
                                    </Col>

                                    <Col lg={12}>
                                      <Card className="mb-0">
                                        <CardBody>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="mb-0">Meals</h5>
                                            <small className="text-muted">
                                              {Array.isArray(row.meals)
                                                ? row.meals.length
                                                : 0}{" "}
                                              items
                                            </small>
                                          </div>

                                          {(row.meals || []).length === 0 ? (
                                            <Alert
                                              color="secondary"
                                              className="mb-0"
                                            >
                                              No meals added.
                                            </Alert>
                                          ) : (
                                            <div className="table-responsive">
                                              <Table className="table table-sm table-bordered align-middle mb-0">
                                                <thead className="table-light">
                                                  <tr>
                                                    <th
                                                      style={{ minWidth: 220 }}
                                                    >
                                                      Restaurant
                                                    </th>
                                                    <th
                                                      style={{ minWidth: 180 }}
                                                    >
                                                      Meal Type
                                                    </th>
                                                    <th
                                                      style={{ minWidth: 260 }}
                                                    >
                                                      Description
                                                    </th>
                                                    <th style={{ width: 160 }}>
                                                      Rate (PP)
                                                    </th>
                                                    <th style={{ width: 160 }}>
                                                      Total (PP)
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {(row.meals || []).map(
                                                    (m, i) => (
                                                      <tr
                                                        key={`m-${row.dayNo}-${i}`}
                                                      >
                                                        <td className="fw-semibold">
                                                          {m?.RESTUARANT_NAME ||
                                                            "-"}
                                                        </td>
                                                        <td>
                                                          {m?.RESTAURANT_MEAL_TYPE_NAME ||
                                                            "-"}
                                                        </td>
                                                        <td
                                                          style={{
                                                            whiteSpace:
                                                              "pre-wrap",
                                                          }}
                                                        >
                                                          {m?.RESTAURANT_MEAL_DESCRIPTION ||
                                                            "-"}
                                                        </td>
                                                        <td>
                                                          {m?.RESTAURANT_MEAL_RATE_PP ??
                                                            "-"}
                                                        </td>
                                                        <td>
                                                          {m?.TOTAL_AMOUNT_PP ??
                                                            "-"}
                                                        </td>
                                                      </tr>
                                                    ),
                                                  )}
                                                </tbody>
                                              </Table>
                                            </div>
                                          )}
                                        </CardBody>
                                      </Card>
                                    </Col>

                                    <Col lg={12}>
                                      <Card className="mb-0">
                                        {/* <CardBody>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="mb-0">
                                              Extra Services
                                            </h5>
                                            <small className="text-muted">
                                              {Array.isArray(row.extraServices)
                                                ? row.extraServices.length
                                                : 0}{" "}
                                              items
                                            </small>
                                          </div>

                                          {(row.extraServices || []).length ===
                                          0 ? (
                                            <Alert
                                              color="secondary"
                                              className="mb-0"
                                            >
                                              No extra services added.
                                            </Alert>
                                          ) : (
                                            <div className="table-responsive">
                                              <Table className="table table-sm table-bordered align-middle mb-0">
                                                <thead className="table-light">
                                                  <tr>
                                                    <th
                                                      style={{ minWidth: 260 }}
                                                    >
                                                      Service
                                                    </th>
                                                    <th style={{ width: 180 }}>
                                                      Cost (PP)
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {(
                                                    row.extraServices || []
                                                  ).map((e, i) => (
                                                    <tr
                                                      key={`e-${row.dayNo}-${i}`}
                                                    >
                                                      <td className="fw-semibold">
                                                        {e?.EXTRA_SERVICE_NAME ||
                                                          "-"}
                                                      </td>
                                                      <td>
                                                        {e?.EXTRA_SERVICE_COST_PP ??
                                                          "-"}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </Table>
                                            </div>
                                          )}
                                        </CardBody> */}
                                      </Card>
                                    </Col>
                                  </Row>
                                </>
                              );
                            })()}
                          </ModalBody>
                        </Modal>

                        {hasSubmittedStep1 && !isEditingStep1 ? (
                          <div className="text-muted mt-2">
                            <small>
                              Step 1 is submitted. Click <b>Edit Step 1</b> to
                              modify.
                            </small>
                          </div>
                        ) : null}
                      </>
                    )}
                  </TabPane>

                  <TabPane tabId={2}>
                    <QuotationStep2Accommodations
                      qoutationId={id}
                      value={step2Hotels}
                      onChange={setStep2Hotels}
                      numberOfDays={numberOfDays}
                      arrivingDate={arrivingDate}
                      departingDate={departingDate}
                    />
                  </TabPane>

                  <TabPane tabId={3}>
                    <QuotationStep3ExtraServices
                      qoutationId={id} // ✅ same as Step 2
                      onChange={() => {
                        // optional
                      }}
                    />
                  </TabPane>

                  <TabPane tabId={4}>
                    <QuotationStep4Summary
                      qoutationId={id}
                      details={details}
                      step1Options={step1Options}
                      step1Submitted={step1Submitted}
                      step2Value={step2Hotels}
                      step3QuotationExtraServices={step3QuotationExtraServices}
                    />
                  </TabPane>
                </TabContent>
              </div>

              <div className="actions clearfix">
                <ul>
                  <li
                    className={
                      activeTab === 1 ? "previous disabled" : "previous"
                    }
                  >
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleTab(activeTab - 1);
                      }}
                    >
                      Previous
                    </Link>
                  </li>

                  <li className={activeTab === 4 ? "next disabled" : "next"}>
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleTab(activeTab + 1);
                      }}
                    >
                      Next
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

const QuotationWizard = () => (
  <RequireModule moduleCode="CONTRACTING_USER">
    <QuotationWizardInner />
  </RequireModule>
);

export default QuotationWizard;
