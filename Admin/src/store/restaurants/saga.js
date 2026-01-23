import { call, put, takeLatest } from "redux-saga/effects";
import * as types from "./actionTypes";
import * as actions from "./actions";

import {
  getRestaurantsApi,
  getRestaurantByIdApi,
  createRestaurantApi,
  updateRestaurantApi,
  deleteRestaurantApi,
} from "../../helpers/fakebackend_helper";

const normalizeErr = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Unexpected error";

function* onGetRestaurants({ payload }) {
  try {
    const res = yield call(getRestaurantsApi, payload?.filters || {});
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

    yield put(actions.getRestaurantsSuccess(items));
  } catch (e) {
    yield put(actions.getRestaurantsFail(normalizeErr(e)));
  }
}

function* onGetRestaurant({ payload }) {
  try {
    const res = yield call(getRestaurantByIdApi, payload.restaurantId);
    yield put(actions.getRestaurantSuccess(res));
  } catch (e) {
    yield put(actions.getRestaurantFail(normalizeErr(e)));
  }
}

function* onCreateRestaurant({ payload }) {
  try {
    const res = yield call(createRestaurantApi, payload.data);
    yield put(actions.createRestaurantSuccess(res));
    yield put(actions.getRestaurants({ ACTIVE_STATUS: 1 }));
  } catch (e) {
    yield put(actions.createRestaurantFail(normalizeErr(e)));
  }
}

function* onUpdateRestaurant({ payload }) {
  try {
    const res = yield call(
      updateRestaurantApi,
      payload.restaurantId,
      payload.data
    );
    yield put(actions.updateRestaurantSuccess(res));
    // refresh current + list
    yield put(actions.getRestaurant(payload.restaurantId));
    yield put(actions.getRestaurants({ ACTIVE_STATUS: 1 }));
  } catch (e) {
    yield put(actions.updateRestaurantFail(normalizeErr(e)));
  }
}

function* onDeleteRestaurant({ payload }) {
  try {
    const res = yield call(deleteRestaurantApi, payload.restaurantId);
    yield put(actions.deleteRestaurantSuccess(res));
    yield put(actions.getRestaurants({ ACTIVE_STATUS: 1 }));
  } catch (e) {
    yield put(actions.deleteRestaurantFail(normalizeErr(e)));
  }
}

export default function* restaurantsSaga() {
  yield takeLatest(types.GET_RESTAURANTS, onGetRestaurants);
  yield takeLatest(types.GET_RESTAURANT, onGetRestaurant);
  yield takeLatest(types.CREATE_RESTAURANT, onCreateRestaurant);
  yield takeLatest(types.UPDATE_RESTAURANT, onUpdateRestaurant);
  yield takeLatest(types.DELETE_RESTAURANT, onDeleteRestaurant);
}
