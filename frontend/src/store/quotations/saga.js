import { call, put, takeLatest } from "redux-saga/effects";
import * as types from "./actionTypes";
import * as actions from "./actions";

import {
  getQoutationsApi,
  createQoutationApi,
  getQoutationByIdApi,
  getQoutationStep1Api,
  getQoutationStep1SubmittedApi,
  saveQoutationStep1Api,
  getQoutationDetailsApi,
} from "../../helpers/fakebackend_helper";

const normalizeErr = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.message ||
  "Unexpected error";

function* onGetQoutations() {
  try {
    const res = yield call(getQoutationsApi);

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

    yield put(actions.getQoutationsSuccess(items));
  } catch (e) {
    yield put(actions.getQoutationsFail(normalizeErr(e)));
  }
}

function* onCreateQoutation({ payload }) {
  try {
    const res = yield call(createQoutationApi, payload?.data);
    yield put(actions.createQoutationSuccess(res));
    yield put(actions.getQoutations()); // refresh list
  } catch (e) {
    yield put(actions.createQoutationFail(normalizeErr(e)));
  }
}
function* onGetQoutationById({ payload }) {
  try {
    const res = yield call(getQoutationByIdApi, payload?.id);
    yield put(actions.getQoutationByIdSuccess(res?.data || res));
  } catch (e) {
    yield put(actions.getQoutationByIdFail(normalizeErr(e)));
  }
}

function* onGetQoutationStep1({ payload }) {
  try {
    const res = yield call(getQoutationStep1Api, payload?.id);
    yield put(actions.getQoutationStep1Success(res?.data || res));
  } catch (e) {
    yield put(actions.getQoutationStep1Fail(normalizeErr(e)));
  }
}
function* onGetQoutationStep1Submitted({ payload }) {
  const id = payload?.id;
  if (!id) return;

  try {
    const res = yield call(getQoutationStep1SubmittedApi, id);
    const data = res?.data || res;

    // Submitted response is saved rows shape: { QOUTATION_ID, ROUTS: [...] }
    // If empty / not submitted, store null
    if (!data || !data.QOUTATION_ID) {
      yield put(actions.getQoutationStep1SubmittedSuccess(null));
      return;
    }

    yield put(actions.getQoutationStep1SubmittedSuccess(data));
  } catch (e) {
    // 404/204 => not submitted
    const status = e?.response?.status;
    if (status === 404 || status === 204) {
      yield put(actions.getQoutationStep1SubmittedSuccess(null));
      return;
    }

    yield put(actions.getQoutationStep1SubmittedFail(normalizeErr(e)));
  }
}
function* onSaveQoutationStep1({ payload }) {
  try {
    const data = payload?.data;

    const res = yield call(saveQoutationStep1Api, data);

    yield put(actions.saveQoutationStep1Success(res?.data || res));

    // refresh submitted state after save
    yield put(actions.getQoutationStep1Submitted(payload?.id));
  } catch (e) {
    yield put(actions.saveQoutationStep1Fail(normalizeErr(e)));
  }
}

function* onGetQoutationDetails({ payload }) {
  try {
    const id = payload?.id;
    if (!id) throw new Error("Missing quotation id");

    const res = yield call(getQoutationDetailsApi, id);
    yield put(actions.getQoutationDetailsSuccess(res));
  } catch (e) {
    yield put(actions.getQoutationDetailsFail(normalizeErr(e)));
  }
}


export default function* quotationsSaga() {
  yield takeLatest(types.GET_QOUTATIONS, onGetQoutations);
  yield takeLatest(types.CREATE_QOUTATION, onCreateQoutation);

  yield takeLatest(types.GET_QOUTATION_BY_ID, onGetQoutationById);
  yield takeLatest(types.GET_QOUTATION_STEP1, onGetQoutationStep1);
  yield takeLatest(types.GET_QOUTATION_DETAILS, onGetQoutationDetails);

  yield takeLatest(
    types.GET_QOUTATION_STEP1_SUBMITTED,
    onGetQoutationStep1Submitted
  );
  yield takeLatest(types.SAVE_QOUTATION_STEP1, onSaveQoutationStep1);
}
