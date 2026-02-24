// src/store/places/saga.js
import { call, put, takeLatest } from "redux-saga/effects";
import * as types from "./actionTypes";
import * as actions from "./actions";

import {
  getPlaces as getPlacesApi,
  getPlaceById as getPlaceApi,
  createPlace as createPlaceApi,
  updatePlace as updatePlaceApi,
  deletePlace as deletePlaceApi,
} from "../../helpers/fakebackend_helper";

const normalizeErr = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Unexpected error";

function* onGetPlaces({ payload }) {
  try {
    const placeAreaId = payload?.placeAreaId;

    // API supports optional query param PLACE_AREA_ID
    const res = yield call(getPlacesApi, {
      PLACE_AREA_ID:
        placeAreaId !== undefined && placeAreaId !== null && placeAreaId !== ""
          ? Number(placeAreaId)
          : undefined,
    });

    const items =
      Array.isArray(res) ? res :
      Array.isArray(res?.data) ? res.data :
      Array.isArray(res?.items) ? res.items :
      Array.isArray(res?.result) ? res.result :
      Array.isArray(res?.data?.data) ? res.data.data :
      Array.isArray(res?.data?.items) ? res.data.items :
      Array.isArray(res?.data?.result) ? res.data.result :
      [];

    yield put(actions.getPlacesSuccess(items));
  } catch (e) {
    yield put(actions.getPlacesFail(normalizeErr(e)));
  }
}

function* onGetPlace({ payload }) {
  try {
    const res = yield call(getPlaceApi, payload.placeId);
    yield put(actions.getPlaceSuccess(res));
  } catch (e) {
    yield put(actions.getPlaceFail(normalizeErr(e)));
  }
}

function* onCreatePlace({ payload }) {
  try {
    const res = yield call(createPlaceApi, payload.data);
    yield put(actions.createPlaceSuccess(res));
    yield put(actions.getPlaces()); // refresh
  } catch (e) {
    yield put(actions.createPlaceFail(normalizeErr(e)));
  }
}

function* onUpdatePlace({ payload }) {
  try {
    const res = yield call(updatePlaceApi, payload.placeId, payload.data);
    yield put(actions.updatePlaceSuccess(res));
    yield put(actions.getPlaces()); // refresh
  } catch (e) {
    yield put(actions.updatePlaceFail(normalizeErr(e)));
  }
}

function* onDeletePlace({ payload }) {
  try {
    const res = yield call(deletePlaceApi, payload.placeId);
    yield put(actions.deletePlaceSuccess(res));
    yield put(actions.getPlaces()); // refresh
  } catch (e) {
    yield put(actions.deletePlaceFail(normalizeErr(e)));
  }
}

export default function* placesSaga() {
  yield takeLatest(types.GET_PLACES, onGetPlaces);
  yield takeLatest(types.GET_PLACE, onGetPlace);
  yield takeLatest(types.CREATE_PLACE, onCreatePlace);
  yield takeLatest(types.UPDATE_PLACE, onUpdatePlace);
  yield takeLatest(types.DELETE_PLACE, onDeletePlace);
}
