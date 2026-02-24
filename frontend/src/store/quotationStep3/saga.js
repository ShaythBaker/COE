import { call, put, takeEvery } from "redux-saga/effects";
import {
  GET_EXTRA_SERVICES,
  GET_QUOTATION_EXTRA_SERVICES,
  SAVE_QUOTATION_EXTRA_SERVICE,
  DELETE_QUOTATION_EXTRA_SERVICE,
} from "./actionTypes";

import {
  getExtraServicesSuccess,
  getExtraServicesFail,
  getQuotationExtraServicesSuccess,
  getQuotationExtraServicesFail,
  saveQuotationExtraServiceSuccess,
  saveQuotationExtraServiceFail,
  deleteQuotationExtraServiceSuccess,
  deleteQuotationExtraServiceFail,
} from "./actions";

import {
  getExtraServicesApi,
  getQuotationStep3ExtraServicesApi,
  createQuotationStep3ExtraServiceApi,
  deleteQuotationStep3ExtraServiceApi,
} from "../../helpers/fakebackend_helper";

const normalizeError = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback;

function* onGetExtraServices() {
  try {
    const res = yield call(getExtraServicesApi);
    const data = Array.isArray(res) ? res : res?.data;
    yield put(getExtraServicesSuccess(Array.isArray(data) ? data : []));
  } catch (e) {
    yield put(
      getExtraServicesFail(normalizeError(e, "Failed to load services")),
    );
  }
}

function* onGetQuotationExtraServices({ payload }) {
  try {
    const res = yield call(
      getQuotationStep3ExtraServicesApi,
      payload.qoutationId,
    );
    const data = Array.isArray(res) ? res : res?.data;
    yield put(
      getQuotationExtraServicesSuccess(Array.isArray(data) ? data : []),
    );
  } catch (e) {
    yield put(
      getQuotationExtraServicesFail(
        normalizeError(e, "Failed to load quotation services"),
      ),
    );
  }
}

function* onSaveQuotationExtraService({ payload }) {
  try {
    const res = yield call(
      createQuotationStep3ExtraServiceApi,
      payload.qoutationId,
      payload.payload,
    );
    yield put(saveQuotationExtraServiceSuccess(res));
  } catch (e) {
    yield put(
      saveQuotationExtraServiceFail(
        normalizeError(e, "Failed to save quotation extra service"),
      ),
    );
  }
}

function* onDeleteQuotationExtraService({ payload }) {
  try {
    yield call(
      deleteQuotationStep3ExtraServiceApi,
      payload.qoutationExtraServiceId,
    );
    yield put(
      deleteQuotationExtraServiceSuccess(
        payload.qoutationExtraServiceId,
        payload.extraServiceId,
      ),
    );
  } catch (e) {
    yield put(
      deleteQuotationExtraServiceFail(
        normalizeError(e, "Failed to delete quotation extra service"),
      ),
    );
  }
}

export default function* quotationStep3Saga() {
  yield takeEvery(GET_EXTRA_SERVICES, onGetExtraServices);
  yield takeEvery(GET_QUOTATION_EXTRA_SERVICES, onGetQuotationExtraServices);
  yield takeEvery(SAVE_QUOTATION_EXTRA_SERVICE, onSaveQuotationExtraService);
  yield takeEvery(
    DELETE_QUOTATION_EXTRA_SERVICE,
    onDeleteQuotationExtraService,
  );
}
