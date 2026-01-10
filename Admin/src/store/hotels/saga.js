// src/store/hotels/saga.js
import { all, call, fork, put, takeEvery } from "redux-saga/effects";
import { toast } from "react-toastify";

import {
  GET_HOTELS,
  GET_HOTEL_CONTRACTS,
  CREATE_HOTEL_CONTRACT,
  UPDATE_HOTEL_CONTRACT,
  DELETE_HOTEL_CONTRACT,

  // Contract rates (deprecated)
  GET_HOTEL_CONTRACT_RATES,
  CREATE_HOTEL_CONTRACT_RATE,
  UPDATE_HOTEL_CONTRACT_RATE,
  DELETE_HOTEL_CONTRACT_RATE,

  // Seasons
  GET_HOTEL_SEASONS,
  CREATE_HOTEL_SEASON,
  UPDATE_HOTEL_SEASON,
  DELETE_HOTEL_SEASON,

  // Pricing
  GET_HOTEL_SEASONS_WITH_RATES,

  // NEW season rates
  CREATE_HOTEL_SEASON_RATE,
  UPDATE_HOTEL_SEASON_RATE,
  DELETE_HOTEL_SEASON_RATE,
  CREATE_HOTEL_CONTRACT_FAIL,
  UPDATE_HOTEL_CONTRACT_FAIL,
  DELETE_HOTEL_CONTRACT_FAIL,
  CREATE_HOTEL_CONTRACT_RATE_FAIL,
  UPDATE_HOTEL_CONTRACT_RATE_FAIL,
  DELETE_HOTEL_CONTRACT_RATE_FAIL,
  CREATE_HOTEL_SEASON_FAIL,
  UPDATE_HOTEL_SEASON_FAIL,
  DELETE_HOTEL_SEASON_FAIL,
  CREATE_HOTEL_SEASON_RATE_FAIL,
  UPDATE_HOTEL_SEASON_RATE_FAIL,
  DELETE_HOTEL_SEASON_RATE_FAIL,
   GET_HOTEL_ADDITIONAL_SERVICES,
  CREATE_HOTEL_ADDITIONAL_SERVICE,
  UPDATE_HOTEL_ADDITIONAL_SERVICE,
  DELETE_HOTEL_ADDITIONAL_SERVICE,
} from "./actionTypes";

import {
  getHotelsSuccess,
  getHotelsFail,
  getHotelContractsSuccess,
  getHotelContractsFail,
  createHotelContractSuccess,
  createHotelContractFail,
  updateHotelContractSuccess,
  updateHotelContractFail,
  deleteHotelContractSuccess,
  deleteHotelContractFail,

  // Contract rates (deprecated)
  getHotelContractRatesSuccess,
  getHotelContractRatesFail,
  createHotelContractRateSuccess,
  createHotelContractRateFail,
  updateHotelContractRateSuccess,
  updateHotelContractRateFail,
  deleteHotelContractRateSuccess,
  deleteHotelContractRateFail,

  // Seasons
  getHotelSeasonsSuccess,
  getHotelSeasonsFail,
  createHotelSeasonSuccess,
  createHotelSeasonFail,
  updateHotelSeasonSuccess,
  updateHotelSeasonFail,
  deleteHotelSeasonSuccess,
  deleteHotelSeasonFail,

  // Pricing
  getHotelSeasonsWithRatesSuccess,
  getHotelSeasonsWithRatesFail,

  // NEW season rates
  createHotelSeasonRateSuccess,
  createHotelSeasonRateFail,
  updateHotelSeasonRateSuccess,
  updateHotelSeasonRateFail,
  deleteHotelSeasonRateSuccess,
  deleteHotelSeasonRateFail,

  // Additional Services
   getHotelAdditionalServicesSuccess,
  getHotelAdditionalServicesFail,
  createHotelAdditionalServiceSuccess,
  createHotelAdditionalServiceFail,
  updateHotelAdditionalServiceSuccess,
  updateHotelAdditionalServiceFail,
  deleteHotelAdditionalServiceSuccess,
  deleteHotelAdditionalServiceFail,
} from "./actions";

import {
  getHotelsApi,

  // Contracts
  getHotelContracts,
  createHotelContract,
  updateHotelContract,
  deleteHotelContract,

  // Contract rates (deprecated)
  getHotelContractRatesApi,
  createHotelContractRateApi,
  updateHotelContractRateApi,
  deleteHotelContractRateApi,

  // Seasons
  getHotelSeasons as getHotelSeasonsApi,
  createHotelSeason as createHotelSeasonApi,
  updateHotelSeason as updateHotelSeasonApi,
  deleteHotelSeason as deleteHotelSeasonApi,

  // Pricing
  getHotelSeasonsWithRates as getHotelSeasonsWithRatesApi,

  // NEW: season rates endpoints (must be implemented in fakebackend_helper.jsx)
  createHotelSeasonRateApi,
  updateHotelSeasonRateApi,
  deleteHotelSeasonRateApi,

  // Additional Services
  getHotelAdditionalServicesApi,
  createHotelAdditionalServiceApi,
  updateHotelAdditionalServiceApi,
  deleteHotelAdditionalServiceApi,
} from "../../helpers/fakebackend_helper";

const DEFAULT_FILTERS = {
  ACTIVE_STATUS: "",
  HOTEL_AREA: "",
  HOTEL_STARS: "",
};

const normalizeError = (error, fallback = "Request failed") =>
  error?.response?.data?.message || error?.message || fallback;

// --------------------
// HOTELS
// --------------------
function* onGetHotels({ payload }) {
  try {
    const filters = { ...DEFAULT_FILTERS, ...(payload || {}) };
    const response = yield call(getHotelsApi, filters);
    yield put(getHotelsSuccess(response));
  } catch (error) {
    const msg = normalizeError(error, "Failed to load hotels");
    yield put(getHotelsFail(msg));
    toast.error(msg);
  }
}

// --------------------
// CONTRACTS
// --------------------
function* onGetHotelContracts({ payload }) {
  try {
    const res = yield call(getHotelContracts, payload.hotelId);
    yield put(getHotelContractsSuccess(res));
  } catch (error) {
    const msg = normalizeError(error, "Failed to load contracts");
    yield put(getHotelContractsFail(msg));
    toast.error(msg);
  }
}

function* onCreateHotelContract({ payload }) {
  try {
    const res = yield call(createHotelContract, payload.hotelId, payload.data);
    yield put(createHotelContractSuccess(res));
    toast.success("Contract created successfully.");

    yield put({
      type: GET_HOTEL_CONTRACTS,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to create contract");
    toast.error(msg);
    yield put(createHotelContractFail(msg));
    yield put({ type: CREATE_HOTEL_CONTRACT_FAIL, payload: msg });
  }
}

function* onUpdateHotelContract({ payload }) {
  try {
    const res = yield call(
      updateHotelContract,
      payload.hotelId,
      payload.contractId,
      payload.data
    );
    yield put(updateHotelContractSuccess(res));
    toast.success("Contract updated successfully.");

    yield put({
      type: GET_HOTEL_CONTRACTS,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to update contract");
    toast.error(msg);
    yield put(updateHotelContractFail(msg));
    yield put({ type: UPDATE_HOTEL_CONTRACT_FAIL, payload: msg });
  }
}

function* onDeleteHotelContract({ payload }) {
  try {
    const res = yield call(
      deleteHotelContract,
      payload.hotelId,
      payload.contractId
    );
    yield put(deleteHotelContractSuccess(res));
    toast.success("Contract deleted successfully.");

    yield put({
      type: GET_HOTEL_CONTRACTS,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to delete contract");
    toast.error(msg);
    yield put(deleteHotelContractFail(msg));
    yield put({ type: DELETE_HOTEL_CONTRACT_FAIL, payload: msg });
  }
}

// --------------------
// CONTRACT RATES (deprecated)
// --------------------
function* onGetHotelContractRates({ payload }) {
  try {
    const res = yield call(
      getHotelContractRatesApi,
      payload.hotelId,
      payload.contractId
    );
    yield put(getHotelContractRatesSuccess(res));
  } catch (error) {
    const msg = normalizeError(error, "Failed to load contract rates");
    yield put(getHotelContractRatesFail(msg));
    toast.error(msg);
  }
}

function* onCreateHotelContractRate({ payload }) {
  try {
    const res = yield call(
      createHotelContractRateApi,
      payload.hotelId,
      payload.contractId,
      payload.data
    );
    yield put(createHotelContractRateSuccess(res));
    toast.success("Rate created successfully.");

    yield put({
      type: GET_HOTEL_CONTRACT_RATES,
      payload: { hotelId: payload.hotelId, contractId: payload.contractId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to create rate");
    toast.error(msg);
    yield put(createHotelContractRateFail(msg));
    yield put({ type: CREATE_HOTEL_CONTRACT_RATE_FAIL, payload: msg });
  }
}

function* onUpdateHotelContractRate({ payload }) {
  try {
    const res = yield call(
      updateHotelContractRateApi,
      payload.hotelId,
      payload.contractId,
      payload.rateId,
      payload.data
    );
    yield put(updateHotelContractRateSuccess(res));
    toast.success("Rate updated successfully.");

    yield put({
      type: GET_HOTEL_CONTRACT_RATES,
      payload: { hotelId: payload.hotelId, contractId: payload.contractId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to update rate");
    toast.error(msg);
    yield put(updateHotelContractRateFail(msg));
    yield put({ type: UPDATE_HOTEL_CONTRACT_RATE_FAIL, payload: msg });
  }
}

function* onDeleteHotelContractRate({ payload }) {
  try {
    const res = yield call(
      deleteHotelContractRateApi,
      payload.hotelId,
      payload.contractId,
      payload.rateId
    );
    yield put(deleteHotelContractRateSuccess(res));
    toast.success("Rate deleted successfully.");

    yield put({
      type: GET_HOTEL_CONTRACT_RATES,
      payload: { hotelId: payload.hotelId, contractId: payload.contractId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to delete rate");
    toast.error(msg);
    yield put(deleteHotelContractRateFail(msg));
    yield put({ type: DELETE_HOTEL_CONTRACT_RATE_FAIL, payload: msg });
  }
}

// --------------------
// SEASONS
// --------------------
function* onGetHotelSeasons({ payload }) {
  try {
    const res = yield call(getHotelSeasonsApi, payload.hotelId);
    yield put(getHotelSeasonsSuccess(res));
  } catch (error) {
    const msg = normalizeError(error, "Failed to load seasons");
    yield put(getHotelSeasonsFail(msg));
    toast.error(msg);
  }
}

function* onCreateSeason({ payload }) {
  try {
    const res = yield call(createHotelSeasonApi, payload.hotelId, payload.data);
    yield put(createHotelSeasonSuccess(res));
    toast.success("Season created successfully.");

    yield put({
      type: GET_HOTEL_SEASONS,
      payload: { hotelId: payload.hotelId },
    });
    yield put({
      type: GET_HOTEL_SEASONS_WITH_RATES,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to create season");
    toast.error(msg);
    yield put(createHotelSeasonFail(msg));
    yield put({ type: CREATE_HOTEL_SEASON_FAIL, payload: msg });
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
    toast.success("Season updated successfully.");

    yield put({
      type: GET_HOTEL_SEASONS,
      payload: { hotelId: payload.hotelId },
    });
    yield put({
      type: GET_HOTEL_SEASONS_WITH_RATES,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to update season");
    toast.error(msg);
    yield put(updateHotelSeasonFail(msg));
    yield put({ type: UPDATE_HOTEL_SEASON_FAIL, payload: msg });
  }
}

function* onDeleteSeason({ payload }) {
  try {
    const res = yield call(
      deleteHotelSeasonApi,
      payload.hotelId,
      payload.seasonId
    );
    yield put(deleteHotelSeasonSuccess(res));
    toast.success("Season deleted successfully.");

    yield put({
      type: GET_HOTEL_SEASONS,
      payload: { hotelId: payload.hotelId },
    });
    yield put({
      type: GET_HOTEL_SEASONS_WITH_RATES,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to delete season");
    toast.error(msg);
    yield put(deleteHotelSeasonFail(msg));
    yield put({ type: DELETE_HOTEL_SEASON_FAIL, payload: msg });
  }
}

// --------------------
// PRICING (seasons with nested rates)
// --------------------
function* fetchSeasonsWithRates({ payload }) {
  try {
    const res = yield call(getHotelSeasonsWithRatesApi, payload.hotelId);
    yield put(getHotelSeasonsWithRatesSuccess(res));
  } catch (error) {
    const msg = normalizeError(error, "Failed to load seasons with rates");
    yield put(getHotelSeasonsWithRatesFail(msg));
    toast.error(msg);
  }
}

// --------------------
// NEW: SEASON RATES
// --------------------
function* onCreateHotelSeasonRate({ payload }) {
  try {
    const res = yield call(
      createHotelSeasonRateApi,
      payload.hotelId,
      payload.seasonId,
      payload.data
    );
    yield put(createHotelSeasonRateSuccess(res));
    toast.success("Rate created successfully.");

    yield put({
      type: GET_HOTEL_SEASONS_WITH_RATES,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to create season rate");
    toast.error(msg);
    yield put(createHotelSeasonRateFail(msg));
    yield put({ type: CREATE_HOTEL_SEASON_RATE_FAIL, payload: msg });
  }
}

function* onUpdateHotelSeasonRate({ payload }) {
  try {
    const res = yield call(
      updateHotelSeasonRateApi,
      payload.hotelId,
      payload.seasonId,
      payload.rateId,
      payload.data
    );
    yield put(updateHotelSeasonRateSuccess(res));
    toast.success("Rate updated successfully.");

    yield put({
      type: GET_HOTEL_SEASONS_WITH_RATES,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to update season rate");
    toast.error(msg);
    yield put(updateHotelSeasonRateFail(msg));
    yield put({ type: UPDATE_HOTEL_SEASON_RATE_FAIL, payload: msg });
  }
}

function* onDeleteHotelSeasonRate({ payload }) {
  try {
    const res = yield call(
      deleteHotelSeasonRateApi,
      payload.hotelId,
      payload.seasonId,
      payload.rateId
    );
    yield put(deleteHotelSeasonRateSuccess(res));
    toast.success("Rate deleted successfully.");

    yield put({
      type: GET_HOTEL_SEASONS_WITH_RATES,
      payload: { hotelId: payload.hotelId },
    });
  } catch (error) {
    const msg = normalizeError(error, "Failed to delete season rate");
    toast.error(msg);
    yield put(deleteHotelSeasonRateFail(msg));
    yield put({ type: DELETE_HOTEL_SEASON_RATE_FAIL, payload: msg });
  }
}

// --------------------
// ADDITIONAL SERVICES
// --------------------
function* onGetHotelAdditionalServices({ payload }) {
  try {
    const res = yield call(getHotelAdditionalServicesApi, payload.hotelId);
    yield put(getHotelAdditionalServicesSuccess(res));
  } catch (error) {
    const msg = normalizeError(error, "Failed to load additional services");
    yield put(getHotelAdditionalServicesFail(msg));
    toast.error(msg);
  }
}

function* onCreateHotelAdditionalService({ payload }) {
  try {
    const res = yield call(createHotelAdditionalServiceApi, payload.hotelId, payload.data);
    yield put(createHotelAdditionalServiceSuccess(res));
    toast.success("Additional service created successfully.");

    yield put({ type: GET_HOTEL_ADDITIONAL_SERVICES, payload: { hotelId: payload.hotelId } });
  } catch (error) {
    const msg = normalizeError(error, "Failed to create additional service");
    toast.error(msg);
    yield put(createHotelAdditionalServiceFail(msg));
  }
}

function* onUpdateHotelAdditionalService({ payload }) {
  try {
    const res = yield call(
      updateHotelAdditionalServiceApi,
      payload.hotelId,
      payload.additionalServiceId,
      payload.data
    );
    yield put(updateHotelAdditionalServiceSuccess(res));
    toast.success("Additional service updated successfully.");

    yield put({ type: GET_HOTEL_ADDITIONAL_SERVICES, payload: { hotelId: payload.hotelId } });
  } catch (error) {
    const msg = normalizeError(error, "Failed to update additional service");
    toast.error(msg);
    yield put(updateHotelAdditionalServiceFail(msg));
  }
}

function* onDeleteHotelAdditionalService({ payload }) {
  try {
    const res = yield call(
      deleteHotelAdditionalServiceApi,
      payload.hotelId,
      payload.additionalServiceId
    );
    yield put(deleteHotelAdditionalServiceSuccess(res));
    toast.success("Additional service deleted successfully.");

    yield put({ type: GET_HOTEL_ADDITIONAL_SERVICES, payload: { hotelId: payload.hotelId } });
  } catch (error) {
    const msg = normalizeError(error, "Failed to delete additional service");
    toast.error(msg);
    yield put(deleteHotelAdditionalServiceFail(msg));
  }
}


// --------------------
// WATCHERS
// --------------------
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

export function* watchHotelSeasons() {
  yield takeEvery(GET_HOTEL_SEASONS, onGetHotelSeasons);
  yield takeEvery(CREATE_HOTEL_SEASON, onCreateSeason);
  yield takeEvery(UPDATE_HOTEL_SEASON, onUpdateSeason);
  yield takeEvery(DELETE_HOTEL_SEASON, onDeleteSeason);

  yield takeEvery(GET_HOTEL_SEASONS_WITH_RATES, fetchSeasonsWithRates);

  yield takeEvery(CREATE_HOTEL_SEASON_RATE, onCreateHotelSeasonRate);
  yield takeEvery(UPDATE_HOTEL_SEASON_RATE, onUpdateHotelSeasonRate);
  yield takeEvery(DELETE_HOTEL_SEASON_RATE, onDeleteHotelSeasonRate);
}

export function* watchHotelAdditionalServices() {
  yield takeEvery(GET_HOTEL_ADDITIONAL_SERVICES, onGetHotelAdditionalServices);
  yield takeEvery(CREATE_HOTEL_ADDITIONAL_SERVICE, onCreateHotelAdditionalService);
  yield takeEvery(UPDATE_HOTEL_ADDITIONAL_SERVICE, onUpdateHotelAdditionalService);
  yield takeEvery(DELETE_HOTEL_ADDITIONAL_SERVICE, onDeleteHotelAdditionalService);
}




export default function* hotelsSaga() {
  yield all([
    fork(watchHotels),
    fork(watchHotelContracts),
    fork(watchHotelContractRates),
    fork(watchHotelSeasons),
    fork(watchHotelAdditionalServices),
  ]);
}
