import { takeLatest, call, put, all, fork } from "redux-saga/effects";
import { LOAD_MY_PERMISSIONS } from "./actionTypes";
import { loadMyPermissionsSuccess, loadMyPermissionsError } from "./actions";

import { getMyPermissions } from "../../helpers/fakebackend_helper";

function* fetchMyPermissions() {
  try {
    const response = yield call(getMyPermissions);
    // response is:
    // { USER_ID: 2, MODULES: [ { MODULE_CODE, CAN_VIEW, ... } ] }
    yield put(loadMyPermissionsSuccess(response));
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to load permissions";
    yield put(loadMyPermissionsError(message));
  }
}

function* watchPermissions() {
  yield takeLatest(LOAD_MY_PERMISSIONS, fetchMyPermissions);
}

export default function* PermissionsSaga() {
  yield all([fork(watchPermissions)]);
}
