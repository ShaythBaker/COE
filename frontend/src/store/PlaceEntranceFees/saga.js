import { call, put, takeLatest } from "redux-saga/effects";
import * as types from "./actionTypes";
import * as actions from "./actions";

import {
  getPlaceEntranceFeesApi,
  createPlaceEntranceFeesApi,
  updatePlaceEntranceFeeApi,
  deletePlaceEntranceFeeApi,
} from "../../helpers/fakebackend_helper";

const normalizeErr = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Unexpected error";

function* onGetPlaceEntranceFees({ payload }) {
  try {
    const res = yield call(getPlaceEntranceFeesApi, payload.placeId);

    const items = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res?.result)
      ? res.result
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : Array.isArray(res?.data?.items)
      ? res.data.items
      : Array.isArray(res?.data?.result)
      ? res.data.result
      : [];

    yield put(actions.getPlaceEntranceFeesSuccess(items));
  } catch (e) {
    yield put(actions.getPlaceEntranceFeesFail(normalizeErr(e)));
  }
}

function* onCreatePlaceEntranceFees({ payload }) {
  try {
    const res = yield call(
      createPlaceEntranceFeesApi,
      payload.placeId,
      payload.data
    );
    yield put(actions.createPlaceEntranceFeesSuccess(res));
    yield put(actions.getPlaceEntranceFees(payload.placeId)); // refresh
  } catch (e) {
    yield put(actions.createPlaceEntranceFeesFail(normalizeErr(e)));
  }
}

function* onUpdatePlaceEntranceFee({ payload }) {
  try {
    const res = yield call(
      updatePlaceEntranceFeeApi,
      payload.placeId,
      payload.feeId,
      payload.data
    );
    yield put(actions.updatePlaceEntranceFeeSuccess(res));
    yield put(actions.getPlaceEntranceFees(payload.placeId)); // refresh
  } catch (e) {
    yield put(actions.updatePlaceEntranceFeeFail(normalizeErr(e)));
  }
}

function* onDeletePlaceEntranceFee({ payload }) {
  try {
    const res = yield call(
      deletePlaceEntranceFeeApi,
      payload.placeId,
      payload.feeId
    );
    yield put(actions.deletePlaceEntranceFeeSuccess(res));
    yield put(actions.getPlaceEntranceFees(payload.placeId)); // refresh
  } catch (e) {
    yield put(actions.deletePlaceEntranceFeeFail(normalizeErr(e)));
  }
}

export default function* placeEntranceFeesSaga() {
  yield takeLatest(types.GET_PLACE_ENTRANCE_FEES, onGetPlaceEntranceFees);
  yield takeLatest(types.CREATE_PLACE_ENTRANCE_FEES, onCreatePlaceEntranceFees);
  yield takeLatest(types.UPDATE_PLACE_ENTRANCE_FEE, onUpdatePlaceEntranceFee);
  yield takeLatest(types.DELETE_PLACE_ENTRANCE_FEE, onDeletePlaceEntranceFee);
}
