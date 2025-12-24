// src/store/hotels/sag js
import { all, call, fork, put, takeEvery } from "redux-saga/effects";
import { toast } from "react-toastify";

import {
  GET_HOTELS,
  GET_HOTEL_CONTRACTS,
  CREATE_HOTEL_CONTRACT,
  CREATE_HOTEL_CONTRACT_FAIL,
  UPDATE_HOTEL_CONTRACT,
  UPDATE_HOTEL_CONTRACT_FAIL,
  DELETE_HOTEL_CONTRACT,
  DELETE_HOTEL_CONTRACT_FAIL,
  GET_HOTEL_CONTRACT_RATES,
  CREATE_HOTEL_CONTRACT_RATE,
  CREATE_HOTEL_CONTRACT_RATE_FAIL,
  UPDATE_HOTEL_CONTRACT_RATE,
  UPDATE_HOTEL_CONTRACT_RATE_FAIL,
  DELETE_HOTEL_CONTRACT_RATE,
  DELETE_HOTEL_CONTRACT_RATE_FAIL,
  // Seasons
  GET_HOTEL_SEASONS,
  CREATE_HOTEL_SEASON,
  UPDATE_HOTEL_SEASON,
  DELETE_HOTEL_SEASON,
  GET_HOTEL_SEASONS_WITH_RATES,
} from "./actionTypes";

import {
  getHotelContractsSuccess,
  getHotelContractsFail,
  getHotelsSuccess,
  getHotelsFail,
  getHotelContractRatesSuccess,
  getHotelContractRatesFail,
  // Seasons
  getHotelSeasonsSuccess,
  getHotelSeasonsFail,
  createHotelSeasonSuccess,
  createHotelSeasonFail,
  updateHotelSeasonSuccess,
  updateHotelSeasonFail,
  deleteHotelSeasonSuccess,
  deleteHotelSeasonFail,
  getHotelSeasonsWithRatesSuccess,
  getHotelSeasonsWithRatesFail,
} from "./actions";

import {
  getHotelContracts,
  createHotelContract,
  updateHotelContract,
  deleteHotelContract,
  getHotelsApi,
  getHotelContractRatesApi,
  createHotelContractRateApi,
  updateHotelContractRateApi,
  deleteHotelContractRateApi,
  getHotelSeasons as getHotelSeasonsApi,
  createHotelSeason as createHotelSeasonApi,
  updateHotelSeason as updateHotelSeasonApi,
  deleteHotelSeason as deleteHotelSeasonApi,
  getHotelSeasonsWithRates as getHotelSeasonsWithRatesApi,
} from "../../helpers/fakebackend_helper";

const DEFAULT_FILTERS = {
  ACTIVE_STATUS: "",
  HOTEL_AREA: "",
  HOTEL_STARS: "",
};

// LIST HOTELS
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
    toast.error(msg);
  }
}

// LIST CONTRACTS
function* onGetHotelContracts({ payload }) {
  try {
    const res = yield call(getHotelContracts, payload.hotelId);
    yield put(getHotelContractsSuccess(res));
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load hotel contracts";
    yield put(getHotelContractsFail(msg));
    toast.error(msg);
  }
}

// CREATE CONTRACT
function* onCreateHotelContract({ payload }) {
  try {
    yield call(createHotelContract, payload.hotelId, payload.data);

    toast.success("Contract created successfully.");

    // Refresh list
    yield put({
      type: GET_HOTEL_CONTRACTS,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to create hotel contract";

    // Backend overlap is usually 409; still show backend message
    toast.error(msg);

    yield put({
      type: CREATE_HOTEL_CONTRACT_FAIL,
      payload: msg,
    });
  }
}

// UPDATE CONTRACT
function* onUpdateHotelContract({ payload }) {
  try {
    yield call(
      updateHotelContract,
      payload.hotelId,
      payload.contractId,
      payload.data
    );

    toast.success("Contract updated successfully.");

    // Refresh list
    yield put({
      type: GET_HOTEL_CONTRACTS,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update hotel contract";

    toast.error(msg);

    yield put({
      type: UPDATE_HOTEL_CONTRACT_FAIL,
      payload: msg,
    });
  }
}

// DELETE CONTRACT
function* onDeleteHotelContract({ payload }) {
  try {
    yield call(deleteHotelContract, payload.hotelId, payload.contractId);

    toast.success("Contract deleted successfully.");

    // Refresh list
    yield put({
      type: GET_HOTEL_CONTRACTS,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete hotel contract";

    toast.error(msg);

    yield put({
      type: DELETE_HOTEL_CONTRACT_FAIL,
      payload: msg,
    });
  }
}

function* onGetHotelContractRates({ payload }) {
  try {
    const res = yield call(
      getHotelContractRatesApi,
      payload.hotelId,
      payload.contractId
    );
    yield put(getHotelContractRatesSuccess(res));
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load contract rates";
    yield put(getHotelContractRatesFail(msg));
    toast.error(msg);
  }
}

function* onCreateHotelContractRate({ payload }) {
  try {
    yield call(
      createHotelContractRateApi,
      payload.hotelId,
      payload.contractId,
      payload.data
    );
    toast.success("Rate created successfully.");

    // Refresh list
    yield put({
      type: GET_HOTEL_CONTRACT_RATES,
      payload: { hotelId: payload.hotelId, contractId: payload.contractId },
    });
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to create rate";
    toast.error(msg);
    yield put({ type: CREATE_HOTEL_CONTRACT_RATE_FAIL, payload: msg });
  }
}

function* onUpdateHotelContractRate({ payload }) {
  try {
    yield call(
      updateHotelContractRateApi,
      payload.hotelId,
      payload.contractId,
      payload.rateId,
      payload.data
    );
    toast.success("Rate updated successfully.");

    // Refresh list
    yield put({
      type: GET_HOTEL_CONTRACT_RATES,
      payload: { hotelId: payload.hotelId, contractId: payload.contractId },
    });
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update rate";
    toast.error(msg);
    yield put({ type: UPDATE_HOTEL_CONTRACT_RATE_FAIL, payload: msg });
  }
}

function* onDeleteHotelContractRate({ payload }) {
  try {
    yield call(
      deleteHotelContractRateApi,
      payload.hotelId,
      payload.contractId,
      payload.rateId
    );
    toast.success("Rate deleted successfully.");

    // Refresh list
    yield put({
      type: GET_HOTEL_CONTRACT_RATES,
      payload: { hotelId: payload.hotelId, contractId: payload.contractId },
    });
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete rate";
    toast.error(msg);
    yield put({ type: DELETE_HOTEL_CONTRACT_RATE_FAIL, payload: msg });
  }
}

export function* watchHotels() {
  yield takeEvery(GET_HOTELS, onGetHotels);
}

export function* watchHotelContracts() {
  yield takeEvery(GET_HOTEL_CONTRACTS, onGetHotelContracts);
  yield takeEvery(CREATE_HOTEL_CONTRACT, onCreateHotelContract);
  yield takeEvery(UPDATE_HOTEL_CONTRACT, onUpdateHotelContract);
  yield takeEvery(DELETE_HOTEL_CONTRACT, onDeleteHotelContract);
}

export function* watchHotelContractRates() {
  yield takeEvery(GET_HOTEL_CONTRACT_RATES, onGetHotelContractRates);
  yield takeEvery(CREATE_HOTEL_CONTRACT_RATE, onCreateHotelContractRate);
  yield takeEvery(UPDATE_HOTEL_CONTRACT_RATE, onUpdateHotelContractRate);
  yield takeEvery(DELETE_HOTEL_CONTRACT_RATE, onDeleteHotelContractRate);
}

const normalizeError = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong";

function* fetchHotelSeasons({ payload }) {
  try {
    const res = yield call(getHotelSeasonsApi, payload.hotelId);
    yield put(getHotelSeasonsSuccess(res));
  } catch (e) {
    yield put(getHotelSeasonsFail(normalizeError(e)));
  }
}

function* onCreateSeason({ payload }) {
  try {
    const res = yield call(createHotelSeasonApi, payload.hotelId, payload.data);
    yield put(createHotelSeasonSuccess(res));
    yield put({
      type: GET_HOTEL_SEASONS,
      payload: { hotelId: payload.hotelId },
    });
  } catch (e) {
    yield put(createHotelSeasonFail(normalizeError(e)));
  }
}

function* onUpdateSeason({ payload }) {
  try {
    const res = yield call(
      updateHotelSeasonApi,
      payload.hotelId,
      payload.seasonId,
      payload.data
    );
    yield put(updateHotelSeasonSuccess(res));
    yield put({
      type: GET_HOTEL_SEASONS,
      payload: { hotelId: payload.hotelId },
    });
  } catch (e) {
    yield put(updateHotelSeasonFail(normalizeError(e)));
  }
}

function* onDeleteSeason({ payload }) {
  try {
    yield call(deleteHotelSeasonApi, payload.hotelId, payload.seasonId);
    yield put({
      type: GET_HOTEL_SEASONS,
      payload: { hotelId: payload.hotelId },
    });
  } catch (e) {
    yield put(deleteHotelSeasonFail(normalizeError(e)));
  }
}

function* fetchSeasonsWithRates({ payload }) {
  try {
    const res = yield call(getHotelSeasonsWithRatesApi, payload.hotelId);
    yield put(getHotelSeasonsWithRatesSuccess(res));
  } catch (e) {
    yield put(getHotelSeasonsWithRatesFail(normalizeError(e)));
  }
}

function* watchHotelSeasons() {
  yield takeEvery(GET_HOTEL_SEASONS, fetchHotelSeasons);
  yield takeEvery(CREATE_HOTEL_SEASON, onCreateSeason);
  yield takeEvery(UPDATE_HOTEL_SEASON, onUpdateSeason);
  yield takeEvery(DELETE_HOTEL_SEASON, onDeleteSeason);
  yield takeEvery(GET_HOTEL_SEASONS_WITH_RATES, fetchSeasonsWithRates);
}

export default function* hotelsSaga() {
  yield all([
    fork(watchHotels),
    fork(watchHotelContracts),
    fork(watchHotelContractRates),
    fork(watchHotelSeasons),
  ]);
}
