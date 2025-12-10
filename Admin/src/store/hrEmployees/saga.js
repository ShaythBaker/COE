// src/store/hrEmployees/saga.js

import { all, call, fork, put, takeEvery } from "redux-saga/effects";
import {
  GET_HR_EMPLOYEES,
  GET_HR_ROLES,
  CREATE_HR_EMPLOYEE,
  GET_HR_EMPLOYEE_DETAIL,
  UPDATE_HR_EMPLOYEE,
} from "./actionTypes";

import {
  getHrEmployeesSuccess,
  getHrEmployeesFail,
  getHrRolesSuccess,
  getHrRolesFail,
  createHrEmployeeSuccess,
  createHrEmployeeFail,
  getHrEmployeeDetailSuccess,
  getHrEmployeeDetailFail,
  updateHrEmployeeSuccess,
  updateHrEmployeeFail,
} from "./actions";

import {
  getHrEmployeesApi,
  getHrEmployeeByIdApi,
  createHrEmployeeApi,
  getHrRolesApi,
  updateHrEmployeeApi,
} from "../../helpers/fakebackend_helper";

// LIST
function* onGetHrEmployees() {
  try {
    const response = yield call(getHrEmployeesApi);
    yield put(getHrEmployeesSuccess(response));
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load employees";
    yield put(getHrEmployeesFail(msg));
  }
}

// ROLES
function* onGetHrRoles() {
  try {
    const response = yield call(getHrRolesApi);
    yield put(getHrRolesSuccess(response));
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load roles";
    yield put(getHrRolesFail(msg));
  }
}

// CREATE
function* onCreateHrEmployee({ payload }) {
  try {
    const response = yield call(createHrEmployeeApi, payload);
    yield put(createHrEmployeeSuccess(response));
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to create employee";
    yield put(createHrEmployeeFail(msg));
  }
}

// DETAIL
function* onGetHrEmployeeDetail({ payload: userId }) {
  try {
    const response = yield call(getHrEmployeeByIdApi, userId);
    // response is { USER, ROLES }
    yield put(getHrEmployeeDetailSuccess(response));
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load employee details";
    yield put(getHrEmployeeDetailFail(msg));
  }
}

// UPDATE

function* onUpdateHrEmployee({ payload: { id, data } }) {
  try {
    const response = yield call(updateHrEmployeeApi, id, data);
    yield put(updateHrEmployeeSuccess(response));
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update employee";
    yield put(updateHrEmployeeFail(msg));
  }
}


export function* watchHrEmployees() {
  yield takeEvery(GET_HR_EMPLOYEES, onGetHrEmployees);
  yield takeEvery(GET_HR_ROLES, onGetHrRoles);
  yield takeEvery(CREATE_HR_EMPLOYEE, onCreateHrEmployee);
  yield takeEvery(GET_HR_EMPLOYEE_DETAIL, onGetHrEmployeeDetail);
  yield takeEvery(UPDATE_HR_EMPLOYEE, onUpdateHrEmployee);
}

export default function* hrEmployeesSaga() {
  yield all([fork(watchHrEmployees)]);
}
