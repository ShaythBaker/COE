import { call, put, takeLatest } from "redux-saga/effects";
import * as types from "./actionTypes";
import * as actions from "./actions";

import {
  getClients as getClientsApi,
  getClientById as getClientApi,
  createClient as createClientApi,
  updateClient as updateClientApi,
  deleteClient as deleteClientApi,
  getListByKey as getListByKeyApi,
} from "../../helpers/fakebackend_helper";

const normalizeErr = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Unexpected error";

function* onGetClients({ payload }) {
  try {
    const activeStatus = payload?.activeStatus;
    const res = yield call(getClientsApi, activeStatus ?? null);

    const items =
      Array.isArray(res) ? res :
      Array.isArray(res?.data) ? res.data :
      Array.isArray(res?.items) ? res.items :
      Array.isArray(res?.result) ? res.result :
      Array.isArray(res?.data?.data) ? res.data.data :
      Array.isArray(res?.data?.items) ? res.data.items :
      Array.isArray(res?.data?.result) ? res.data.result :
      [];

    yield put(actions.getClientsSuccess(items));
  } catch (e) {
    yield put(actions.getClientsFail(normalizeErr(e)));
  }
}


function* onGetClient({ payload }) {
  try {
    const res = yield call(getClientApi, payload.clientId);
    yield put(actions.getClientSuccess(res));
  } catch (e) {
    yield put(actions.getClientFail(normalizeErr(e)));
  }
}

function* onCreateClient({ payload }) {
  try {
    const res = yield call(createClientApi, payload.data);
    yield put(actions.createClientSuccess(res));
    yield put(actions.getClients()); // refresh
  } catch (e) {
    yield put(actions.createClientFail(normalizeErr(e)));
  }
}

function* onUpdateClient({ payload }) {
  try {
    const res = yield call(updateClientApi, payload.clientId, payload.data);
    yield put(actions.updateClientSuccess(res));
    yield put(actions.getClients()); // refresh
  } catch (e) {
    yield put(actions.updateClientFail(normalizeErr(e)));
  }
}

function* onDeleteClient({ payload }) {
  try {
    const res = yield call(deleteClientApi, payload.clientId);
    yield put(actions.deleteClientSuccess(res));
    yield put(actions.getClients()); // refresh
  } catch (e) {
    yield put(actions.deleteClientFail(normalizeErr(e)));
  }
}

function* onGetCountries() {
  try {
    // backend key
    const res = yield call(getListByKeyApi, "COUNTRIES");
    // If API returns array of { ID, NAME } or similar, keep as-is and map in UI
    yield put(actions.getCountriesSuccess(res));
  } catch (e) {
    yield put(actions.getCountriesFail(normalizeErr(e)));
  }
}

export default function* clientsSaga() {
  yield takeLatest(types.GET_CLIENTS, onGetClients);
  yield takeLatest(types.GET_CLIENT, onGetClient);
  yield takeLatest(types.CREATE_CLIENT, onCreateClient);
  yield takeLatest(types.UPDATE_CLIENT, onUpdateClient);
  yield takeLatest(types.DELETE_CLIENT, onDeleteClient);
  yield takeLatest(types.GET_COUNTRIES, onGetCountries);
}
