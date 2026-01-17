import * as types from "./actionTypes";

const INIT_STATE = {
  list: [],
  current: null,

  places: [],

  loadingList: false,
  loadingCurrent: false,
  loadingPlaces: false,

  creating: false,

  lastCreatedRouteId: null,
  successMessage: null,
  error: null,
};

const Routes = (state = INIT_STATE, action) => {
  switch (action.type) {
    case types.CLEAR_ROUTES_MESSAGES:
      return {
        ...state,
        successMessage: null,
        error: null,
        lastCreatedRouteId: null,
      };

    case types.GET_ROUTES:
      return { ...state, loadingList: true, error: null };
    case types.GET_ROUTES_SUCCESS:
      return { ...state, loadingList: false, list: action.payload || [] };
    case types.GET_ROUTES_FAIL:
      return { ...state, loadingList: false, error: action.payload };

    case types.GET_ROUTE:
      return { ...state, loadingCurrent: true, error: null };
    case types.GET_ROUTE_SUCCESS:
      return { ...state, loadingCurrent: false, current: action.payload };
    case types.GET_ROUTE_FAIL:
      return { ...state, loadingCurrent: false, error: action.payload };

    case types.GET_PLACES:
      return { ...state, loadingPlaces: true, error: null };
    case types.GET_PLACES_SUCCESS:
      return { ...state, loadingPlaces: false, places: action.payload || [] };
    case types.GET_PLACES_FAIL:
      return { ...state, loadingPlaces: false, error: action.payload };

    case types.CREATE_ROUTE:
      return {
        ...state,
        creating: true,
        successMessage: null,
        error: null,
        lastCreatedRouteId: null,
      };
    case types.CREATE_ROUTE_SUCCESS:
      return {
        ...state,
        creating: false,
        successMessage: action.payload?.message || "Route created",
        lastCreatedRouteId: action.payload?.ROUTE_ID ?? null,
      };
    case types.CREATE_ROUTE_FAIL:
      return { ...state, creating: false, error: action.payload };

    default:
      return state;
  }
};

export default Routes;
