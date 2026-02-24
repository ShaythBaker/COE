import { call, put, takeEvery } from "redux-saga/effects";
import * as t from "./actionTypes";
import {
  getGuidesSuccess,
  getGuidesFail,
  getGuideSuccess,
  getGuideFail,
  createGuideSuccess,
  createGuideFail,
  updateGuideSuccess,
  updateGuideFail,
  deleteGuideSuccess,
  deleteGuideFail,
  getGuides, // ✅ 
} from "./actions";

import {
  getGuides as getGuidesApi,
  getGuideById as getGuideByIdApi,
  createGuide as createGuideApi,
  updateGuide as updateGuideApi,
  deleteGuide as deleteGuideApi,
} from "../../helpers/fakebackend_helper";

const normalizeErr = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong. Please try again.";

function* onGetGuides({ payload }) {
  try {
    const res = yield call(getGuidesApi, payload);
    yield put(getGuidesSuccess(res));
  } catch (e) {
    yield put(getGuidesFail(normalizeErr(e)));
  }
}

function* onGetGuide({ payload }) {
  try {
    const res = yield call(getGuideByIdApi, payload);
    yield put(getGuideSuccess(res));
  } catch (e) {
    yield put(getGuideFail(normalizeErr(e)));
  }
}

function* onCreateGuide({ payload }) {
  try {
    const res = yield call(createGuideApi, payload.data);
    yield put(createGuideSuccess(res));
    yield put(getGuides({ GUIDE_ACTIVE_STATUS: "1" }));
    payload.cb?.(null, res);
  } catch (e) {
    const msg = normalizeErr(e);
    yield put(createGuideFail(msg));
    payload.cb?.(msg);
  }
}

function* onUpdateGuide({ payload }) {
  try {
    const res = yield call(updateGuideApi, payload.id, payload.data);
    yield put(updateGuideSuccess(res));
      yield put(getGuides({ GUIDE_ACTIVE_STATUS: "1" }));
    payload.cb?.(null, res);
  } catch (e) {
    const msg = normalizeErr(e);
    yield put(updateGuideFail(msg));
    payload.cb?.(msg);
  }
}

function* onDeleteGuide({ payload }) {
  try {
    const res = yield call(deleteGuideApi, payload.id);
    yield put(deleteGuideSuccess(res));
      yield put(getGuides({ GUIDE_ACTIVE_STATUS: "1" }));
    payload.cb?.(null, res);
  } catch (e) {
    const msg = normalizeErr(e);
    yield put(deleteGuideFail(msg));
    payload.cb?.(msg);
  }
}

export default function* GuidesSaga() {
  yield takeEvery(t.GET_GUIDES, onGetGuides);
  yield takeEvery(t.GET_GUIDE, onGetGuide);
  yield takeEvery(t.CREATE_GUIDE, onCreateGuide);
  yield takeEvery(t.UPDATE_GUIDE, onUpdateGuide);
  yield takeEvery(t.DELETE_GUIDE, onDeleteGuide);
}
