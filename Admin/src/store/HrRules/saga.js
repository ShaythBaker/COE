import { call, put, takeEvery } from "redux-saga/effects";
import {
  GET_HR_RULES,
  CREATE_HR_RULE,
  UPDATE_HR_RULE,
  DELETE_HR_RULE,
} from "./actionTypes";

import {
  getHrRulesSuccess,
  getHrRulesFail,
  createHrRuleSuccess,
  createHrRuleFail,
  updateHrRuleSuccess,
  updateHrRuleFail,
  deleteHrRuleSuccess,
  deleteHrRuleFail,
  getHrRules,
} from "./actions";

import {
  getHrRulesApi,
  createHrRuleApi,
  updateHrRuleApi,
  deleteHrRuleApi,
} from "../../helpers/fakebackend_helper";

function* fetchHrRules() {
  try {
    const response = yield call(getHrRulesApi);
    const data = response?.data || response || [];
    yield put(getHrRulesSuccess(data));
  } catch (error) {
    yield put(getHrRulesFail(error?.response?.data || error.message));
  }
}

function* onCreateHrRule({ payload }) {
  try {
    yield call(createHrRuleApi, payload);
    yield put(createHrRuleSuccess());
    // Refresh list for best UX
    yield put(getHrRules());
  } catch (error) {
    yield put(createHrRuleFail(error?.response?.data || error.message));
  }
}

function* onUpdateHrRule({ payload }) {
  try {
    yield call(updateHrRuleApi, payload);
    yield put(updateHrRuleSuccess());
    yield put(getHrRules());
  } catch (error) {
    yield put(updateHrRuleFail(error?.response?.data || error.message));
  }
}

function* onDeleteHrRule({ payload }) {
  try {
    yield call(deleteHrRuleApi, payload);
    yield put(deleteHrRuleSuccess());
    yield put(getHrRules());
  } catch (error) {
    yield put(deleteHrRuleFail(error?.response?.data || error.message));
  }
}

export default function* HrRulesSaga() {
  yield takeEvery(GET_HR_RULES, fetchHrRules);
  yield takeEvery(CREATE_HR_RULE, onCreateHrRule);
  yield takeEvery(UPDATE_HR_RULE, onUpdateHrRule);
  yield takeEvery(DELETE_HR_RULE, onDeleteHrRule);
}
