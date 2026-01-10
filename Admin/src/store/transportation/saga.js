// src/store/transportation/saga.js
import { call, put, takeEvery, takeLatest } from "redux-saga/effects";
import * as t from "./actionTypes";
import * as a from "./actions";

import {
  getTransportationCompaniesApi,
  createTransportationCompanyApi,
  getTransportationCompanyByIdApi,
  updateTransportationCompanyApi,
  deleteTransportationCompanyApi,
  getTransportationCompanyContractsApi,
  createTransportationCompanyContractApi,
  updateTransportationContractApi,
  deleteTransportationContractApi,
  getTransportationCompanyVehiclesApi,
  createTransportationCompanyVehicleApi,
  updateTransportationVehicleApi,
  deleteTransportationVehicleApi,
} from "../../helpers/fakebackend_helper";

const errMsg = (e) =>
  e?.response?.data?.message || e?.message || "Something went wrong";

function* onGetCompanies({ payload }) {
  try {
    const res = yield call(getTransportationCompaniesApi, payload || {});
    yield put(a.getTransportationCompaniesSuccess(res));
  } catch (e) {
    yield put(a.getTransportationCompaniesFail(errMsg(e)));
  }
}

function* onCreateCompany({ payload }) {
  try {
    const res = yield call(createTransportationCompanyApi, payload);
    yield put(a.createTransportationCompanySuccess(res));
    // refresh list
    yield put(a.getTransportationCompanies({ ACTIVE_STATUS: "" }));
  } catch (e) {
    yield put(a.createTransportationCompanyFail(errMsg(e)));
  }
}

function* onGetCompany({ payload }) {
  try {
    const res = yield call(getTransportationCompanyByIdApi, payload);
    yield put(a.getTransportationCompanySuccess(res));
  } catch (e) {
    yield put(a.getTransportationCompanyFail(errMsg(e)));
  }
}

function* onUpdateCompany({ payload }) {
  try {
    const res = yield call(
      updateTransportationCompanyApi,
      payload.companyId,
      payload.data
    );
    yield put(a.updateTransportationCompanySuccess(res));
    // refresh detail
    yield put(a.getTransportationCompany(payload.companyId));
    // refresh list
    yield put(a.getTransportationCompanies({ ACTIVE_STATUS: "" }));
  } catch (e) {
    yield put(a.updateTransportationCompanyFail(errMsg(e)));
  }
}

function* onDeleteCompany({ payload }) {
  try {
    const res = yield call(deleteTransportationCompanyApi, payload);
    yield put(a.deleteTransportationCompanySuccess(res));
    // refresh list
    yield put(a.getTransportationCompanies({ ACTIVE_STATUS: "" }));
  } catch (e) {
    yield put(a.deleteTransportationCompanyFail(errMsg(e)));
  }
}

// Contracts
function* onGetContracts({ payload }) {
  try {
    const res = yield call(getTransportationCompanyContractsApi, payload);
    yield put(a.getTransportationContractsSuccess(res));
  } catch (e) {
    yield put(a.getTransportationContractsFail(errMsg(e)));
  }
}

function* onCreateContract({ payload }) {
  try {
    const res = yield call(
      createTransportationCompanyContractApi,
      payload.companyId,
      payload.data
    );
    yield put(a.createTransportationContractSuccess(res));
    yield put(a.getTransportationContracts(payload.companyId));
  } catch (e) {
    yield put(a.createTransportationContractFail(errMsg(e)));
  }
}

function* onUpdateContract({ payload }) {
  try {
    const res = yield call(
      updateTransportationContractApi,
      payload.contractId,
      payload.data
    );
    yield put(a.updateTransportationContractSuccess(res));
    if (payload.companyId)
      yield put(a.getTransportationContracts(payload.companyId));
  } catch (e) {
    yield put(a.updateTransportationContractFail(errMsg(e)));
  }
}

function* onDeleteContract({ payload }) {
  try {
    const res = yield call(deleteTransportationContractApi, payload.contractId);
    yield put(a.deleteTransportationContractSuccess(res));
    if (payload.companyId)
      yield put(a.getTransportationContracts(payload.companyId));
  } catch (e) {
    yield put(a.deleteTransportationContractFail(errMsg(e)));
  }
}

// Vehicles
function* onGetVehicles({ payload }) {
  try {
    const res = yield call(
      getTransportationCompanyVehiclesApi,
      payload.companyId,
      payload.params || {}
    );
    yield put(a.getTransportationVehiclesSuccess(res));
  } catch (e) {
    yield put(a.getTransportationVehiclesFail(errMsg(e)));
  }
}

function* onCreateVehicle({ payload }) {
  try {
    const res = yield call(
      createTransportationCompanyVehicleApi,
      payload.companyId,
      payload.data
    );
    yield put(a.createTransportationVehicleSuccess(res));
    yield put(
      a.getTransportationVehicles(payload.companyId, { ACTIVE_STATUS: "" })
    );
  } catch (e) {
    yield put(a.createTransportationVehicleFail(errMsg(e)));
  }
}

function* onUpdateVehicle({ payload }) {
  try {
    const res = yield call(
      updateTransportationVehicleApi,
      payload.vehicleId,
      payload.data
    );
    yield put(a.updateTransportationVehicleSuccess(res));
    if (payload.companyId)
      yield put(
        a.getTransportationVehicles(payload.companyId, { ACTIVE_STATUS: "" })
      );
  } catch (e) {
    yield put(a.updateTransportationVehicleFail(errMsg(e)));
  }
}

function* onDeleteVehicle({ payload }) {
  try {
    const res = yield call(deleteTransportationVehicleApi, payload.vehicleId);
    yield put(a.deleteTransportationVehicleSuccess(res));
    if (payload.companyId)
      yield put(
        a.getTransportationVehicles(payload.companyId, { ACTIVE_STATUS: "" })
      );
  } catch (e) {
    yield put(a.deleteTransportationVehicleFail(errMsg(e)));
  }
}

export default function* TransportationSaga() {
  yield takeEvery(t.GET_TRANSPORTATION_COMPANIES, onGetCompanies);
  yield takeLatest(t.CREATE_TRANSPORTATION_COMPANY, onCreateCompany);
  yield takeLatest(t.GET_TRANSPORTATION_COMPANY, onGetCompany);
  yield takeLatest(t.UPDATE_TRANSPORTATION_COMPANY, onUpdateCompany);
  yield takeLatest(t.DELETE_TRANSPORTATION_COMPANY, onDeleteCompany);

  yield takeEvery(t.GET_TRANSPORTATION_CONTRACTS, onGetContracts);
  yield takeLatest(t.CREATE_TRANSPORTATION_CONTRACT, onCreateContract);
  yield takeLatest(t.UPDATE_TRANSPORTATION_CONTRACT, onUpdateContract);
  yield takeLatest(t.DELETE_TRANSPORTATION_CONTRACT, onDeleteContract);

  yield takeEvery(t.GET_TRANSPORTATION_VEHICLES, onGetVehicles);
  yield takeLatest(t.CREATE_TRANSPORTATION_VEHICLE, onCreateVehicle);
  yield takeLatest(t.UPDATE_TRANSPORTATION_VEHICLE, onUpdateVehicle);
  yield takeLatest(t.DELETE_TRANSPORTATION_VEHICLE, onDeleteVehicle);
}
