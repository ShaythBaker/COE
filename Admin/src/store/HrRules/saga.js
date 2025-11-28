// src/store/HrRules/saga.js
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
} from "./actions";

import {
  getHrRulesApi,
  createHrRuleApi,
  updateHrRuleApi,
  deleteHrRuleApi,
} from "../../helpers/fakebackend_helper";

const mapRoleToRule = (role, index) => ({
  id: role.id ?? role.ROLE_ID ?? role.role_id ?? index,
  MODULE_CODE:
    role.MODULE_CODE ||
    role.module_code ||
    role.ROLE_NAME ||
    role.role_name ||
    role.name ||
    role.code ||
    "",
  CAN_VIEW: role.CAN_VIEW ?? role.canView ?? role.can_view ?? false,
  CAN_CREATE: role.CAN_CREATE ?? role.canCreate ?? role.can_create ?? false,
  CAN_EDIT: role.CAN_EDIT ?? role.canEdit ?? role.can_edit ?? false,
  CAN_DELETE: role.CAN_DELETE ?? role.canDelete ?? role.can_delete ?? false,
});

function* onGetHrRules() {
  try {
    const response = yield call(getHrRulesApi);

    const rawList =
      response?.data ||
      response?.roles ||
      response ||
      [];

    const rules = Array.isArray(rawList)
      ? rawList.map((role, index) => mapRoleToRule(role, index))
      : [];

    yield put(getHrRulesSuccess(rules));
  } catch (error) {
    console.error("GET_HR_RULES failed:", error);
    yield put(getHrRulesFail(error));
  }
}

function* onCreateHrRule({ payload }) {
  try {
    const response = yield call(createHrRuleApi, payload);
    const created =
      (response?.data && mapRoleToRule(response.data)) ||
      mapRoleToRule(response, payload?.id);
    yield put(createHrRuleSuccess(created));
  } catch (error) {
    yield put(createHrRuleFail(error));
  }
}

function* onUpdateHrRule({ payload }) {
  try {
    const response = yield call(updateHrRuleApi, payload);
    const updated =
      (response?.data && mapRoleToRule(response.data)) ||
      mapRoleToRule(response, payload?.id);
    yield put(updateHrRuleSuccess(updated));
  } catch (error) {
    yield put(updateHrRuleFail(error));
  }
}

function* onDeleteHrRule({ payload }) {
  try {
    yield call(deleteHrRuleApi, payload);
    yield put(deleteHrRuleSuccess(payload));
  } catch (error) {
    yield put(deleteHrRuleFail(error));
  }
}

export default function* HrRulesSaga() {
  yield takeEvery(GET_HR_RULES, onGetHrRules);
  yield takeEvery(CREATE_HR_RULE, onCreateHrRule);
  yield takeEvery(UPDATE_HR_RULE, onUpdateHrRule);
  yield takeEvery(DELETE_HR_RULE, onDeleteHrRule);
}