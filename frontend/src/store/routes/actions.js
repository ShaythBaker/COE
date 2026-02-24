import * as types from "./actionTypes";

export const clearRoutesMessages = () => ({
  type: types.CLEAR_ROUTES_MESSAGES,
});

export const getRoutes = (countryId) => ({
  type: types.GET_ROUTES,
  payload: { countryId },
});
export const getRoutesSuccess = (items) => ({
  type: types.GET_ROUTES_SUCCESS,
  payload: items,
});
export const getRoutesFail = (error) => ({
  type: types.GET_ROUTES_FAIL,
  payload: error,
});

export const getRoute = (routeId, countryId) => ({
  type: types.GET_ROUTE,
  payload: { routeId, countryId },
});
export const getRouteSuccess = (item) => ({
  type: types.GET_ROUTE_SUCCESS,
  payload: item,
});
export const getRouteFail = (error) => ({
  type: types.GET_ROUTE_FAIL,
  payload: error,
});

export const createRoute = (data) => ({
  type: types.CREATE_ROUTE,
  payload: { data },
});
export const createRouteSuccess = (res) => ({
  type: types.CREATE_ROUTE_SUCCESS,
  payload: res,
});
export const createRouteFail = (error) => ({
  type: types.CREATE_ROUTE_FAIL,
  payload: error,
});

export const getPlaces = () => ({ type: types.GET_PLACES });
export const getPlacesSuccess = (items) => ({
  type: types.GET_PLACES_SUCCESS,
  payload: items,
});
export const getPlacesFail = (error) => ({
  type: types.GET_PLACES_FAIL,
  payload: error,
});
