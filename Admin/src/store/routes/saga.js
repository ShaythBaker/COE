import { call, put, takeLatest } from "redux-saga/effects";
import * as types from "./actionTypes";
import * as actions from "./actions";

import {
  getRoutes as getRoutesApi,
  getRouteById as getRouteByIdApi,
  createRoute as createRouteApi,
  getPlaces as getPlacesApi,
} from "../../helpers/fakebackend_helper";

const normalizeErr = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Unexpected error";

const normalizeArray = (res) =>
  Array.isArray(res) ? res :
  Array.isArray(res?.data) ? res.data :
  Array.isArray(res?.items) ? res.items :
  Array.isArray(res?.result) ? res.result :
  Array.isArray(res?.data?.data) ? res.data.data :
  Array.isArray(res?.data?.items) ? res.data.items :
  Array.isArray(res?.data?.result) ? res.data.result :
  [];

function* onGetRoutes({ payload }) {
  try {
    const countryId = payload?.countryId ?? null;
    const res = yield call(getRoutesApi, countryId);

    // IMPORTANT: api_helper.get() returns payload directly, so res is usually the array
    const items = normalizeArray(res);

    yield put(actions.getRoutesSuccess(items));
  } catch (e) {
    yield put(actions.getRoutesFail(normalizeErr(e)));
  }
}

function* onGetRoute({ payload }) {
  try {
    const res = yield call(
      getRouteByIdApi,
      payload.routeId,
      payload?.countryId ?? null
    );

    // route detail is a single object (api_helper.get returns payload directly)
    yield put(actions.getRouteSuccess(res));
  } catch (e) {
    yield put(actions.getRouteFail(normalizeErr(e)));
  }
}

function* onCreateRoute({ payload }) {
  try {
    const res = yield call(createRouteApi, payload.data);
    yield put(actions.createRouteSuccess(res));
    // refresh list
    yield put(actions.getRoutes(null));
  } catch (e) {
    yield put(actions.createRouteFail(normalizeErr(e)));
  }
}

function* onGetPlaces() {
  try {
    const res = yield call(getPlacesApi);

    // IMPORTANT: places API returns array payload directly
    const items = normalizeArray(res);

    yield put(actions.getPlacesSuccess(items));
  } catch (e) {
    yield put(actions.getPlacesFail(normalizeErr(e)));
  }
}

export default function* routesSaga() {
  yield takeLatest(types.GET_ROUTES, onGetRoutes);
  yield takeLatest(types.GET_ROUTE, onGetRoute);
  yield takeLatest(types.CREATE_ROUTE, onCreateRoute);
  yield takeLatest(types.GET_PLACES, onGetPlaces);
}
