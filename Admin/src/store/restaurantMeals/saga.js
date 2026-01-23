import { call, put, takeLatest, select } from "redux-saga/effects";
import * as types from "./actionTypes";
import * as actions from "./actions";

import {
  getRestaurantMealsApi,
  createRestaurantMealApi,
  updateRestaurantMealApi,
  deleteRestaurantMealApi,
} from "../../helpers/fakebackend_helper";

const normalizeErr = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Unexpected error";

function* onGetMeals({ payload }) {
  try {
    const res = yield call(
      getRestaurantMealsApi,
      payload.restaurantId,
      payload.filters || {}
    );
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

    yield put(actions.getRestaurantMealsSuccess(items));
  } catch (e) {
    yield put(actions.getRestaurantMealsFail(normalizeErr(e)));
  }
}

function* refreshLastQuery() {
  const state = yield select(
    (s) => s?.RestaurantMeals || s?.restaurantMeals || null
  );
  const q = state?.lastQuery;
  if (q?.restaurantId) {
    yield put(actions.getRestaurantMeals(q.restaurantId, q.filters || {}));
  }
}

function* onCreateMeal({ payload }) {
  try {
    yield call(createRestaurantMealApi, payload.restaurantId, payload.data);
    yield put(actions.createRestaurantMealSuccess({ message: "Meal created" }));
    yield call(refreshLastQuery);
  } catch (e) {
    yield put(actions.createRestaurantMealFail(normalizeErr(e)));
  }
}

function* onUpdateMeal({ payload }) {
  try {
    yield call(
      updateRestaurantMealApi,
      payload.restaurantId,
      payload.mealId,
      payload.data
    );
    yield put(actions.updateRestaurantMealSuccess({ message: "Meal updated" }));
    yield call(refreshLastQuery);
  } catch (e) {
    yield put(actions.updateRestaurantMealFail(normalizeErr(e)));
  }
}

function* onDeleteMeal({ payload }) {
  try {
    yield call(deleteRestaurantMealApi, payload.restaurantId, payload.mealId);
    yield put(actions.deleteRestaurantMealSuccess({ message: "Meal deleted" }));
    yield call(refreshLastQuery);
  } catch (e) {
    yield put(actions.deleteRestaurantMealFail(normalizeErr(e)));
  }
}

export default function* restaurantMealsSaga() {
  yield takeLatest(types.GET_RESTAURANT_MEALS, onGetMeals);
  yield takeLatest(types.CREATE_RESTAURANT_MEAL, onCreateMeal);
  yield takeLatest(types.UPDATE_RESTAURANT_MEAL, onUpdateMeal);
  yield takeLatest(types.DELETE_RESTAURANT_MEAL, onDeleteMeal);
}
