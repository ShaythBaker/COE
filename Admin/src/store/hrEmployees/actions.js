// src/store/hrEmployees/actions.js

import {
  GET_HR_EMPLOYEES,
  GET_HR_EMPLOYEES_SUCCESS,
  GET_HR_EMPLOYEES_FAIL,
  GET_HR_ROLES,
  GET_HR_ROLES_SUCCESS,
  GET_HR_ROLES_FAIL,
  CREATE_HR_EMPLOYEE,
  CREATE_HR_EMPLOYEE_SUCCESS,
  CREATE_HR_EMPLOYEE_FAIL,
  RESET_HR_EMPLOYEE_FLAGS,
} from "./actionTypes";

// LIST
export const getHrEmployees = () => ({
  type: GET_HR_EMPLOYEES,
});

export const getHrEmployeesSuccess = (employees) => ({
  type: GET_HR_EMPLOYEES_SUCCESS,
  payload: employees,
});

export const getHrEmployeesFail = (error) => ({
  type: GET_HR_EMPLOYEES_FAIL,
  payload: error,
});

// existing roles/create exports...
export const getHrRoles = () => ({
  type: GET_HR_ROLES,
});

export const getHrRolesSuccess = (roles) => ({
  type: GET_HR_ROLES_SUCCESS,
  payload: roles,
});

export const getHrRolesFail = (error) => ({
  type: GET_HR_ROLES_FAIL,
  payload: error,
});

export const createHrEmployee = (payload) => ({
  type: CREATE_HR_EMPLOYEE,
  payload,
});

export const createHrEmployeeSuccess = (response) => ({
  type: CREATE_HR_EMPLOYEE_SUCCESS,
  payload: response,
});

export const createHrEmployeeFail = (error) => ({
  type: CREATE_HR_EMPLOYEE_FAIL,
  payload: error,
});

export const resetHrEmployeeFlags = () => ({
  type: RESET_HR_EMPLOYEE_FLAGS,
});
