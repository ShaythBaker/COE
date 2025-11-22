// src/store/hrEmployees/saga.js

import { all, call, fork, put, takeEvery } from "redux-saga/effects";
import {
  GET_HR_EMPLOYEES,
  GET_HR_ROLES,
  CREATE_HR_EMPLOYEE,
} from "./actionTypes";

import {
  getHrEmployeesSuccess,
  getHrEmployeesFail,
  getHrRolesSuccess,
  getHrRolesFail,
  createHrEmployeeSuccess,
  createHrEmployeeFail,
} from "./actions";

import {
  getHrEmployeesApi,
  createHrEmployeeApi,
  getHrRolesApi,
  // getHrEmployeeByIdApi, // for future view/edit – add when needed
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

export function* watchHrEmployees() {
  yield takeEvery(GET_HR_EMPLOYEES, onGetHrEmployees);
  yield takeEvery(GET_HR_ROLES, onGetHrRoles);
  yield takeEvery(CREATE_HR_EMPLOYEE, onCreateHrEmployee);
}

export default function* hrEmployeesSaga() {
  yield all([fork(watchHrEmployees)]);
}
