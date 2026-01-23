import { call, put, takeLatest } from "redux-saga/effects";
import * as types from "./actionTypes";
import * as actions from "./actions";

import {
  getQoutationsApi,
  createQoutationApi,
  getQoutationByIdApi,
  getQoutationStep1Api,
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

export default function* quotationsSaga() {
  yield takeLatest(types.GET_QOUTATIONS, onGetQoutations);
  yield takeLatest(types.CREATE_QOUTATION, onCreateQoutation);

  yield takeLatest(types.GET_QOUTATION_BY_ID, onGetQoutationById);
  yield takeLatest(types.GET_QOUTATION_STEP1, onGetQoutationStep1);
}
