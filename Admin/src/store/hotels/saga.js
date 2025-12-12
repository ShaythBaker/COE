// src/store/hotels/saga.js
import { all, call, fork, put, takeEvery } from "redux-saga/effects";
import { GET_HOTELS } from "./actionTypes";
import { getHotelsSuccess, getHotelsFail } from "./actions";
import { getHotelsApi } from "../../helpers/fakebackend_helper";

const DEFAULT_FILTERS = {
  ACTIVE_STATUS: "",
  HOTEL_AREA: "",
  HOTEL_STARS: "",
};

// LIST
function* onGetHotels({ payload }) {
  try {
    const filters = {
      ...DEFAULT_FILTERS,
      ...(payload || {}),
    };
    const response = yield call(getHotelsApi, filters);
    yield put(getHotelsSuccess(response));
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load hotels";
    yield put(getHotelsFail(msg));
  }
}

export function* watchHotels() {
  yield takeEvery(GET_HOTELS, onGetHotels);
}

export default function* hotelsSaga() {
  yield all([fork(watchHotels)]);
}
