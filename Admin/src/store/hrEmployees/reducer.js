// src/store/hrEmployees/reducer.js

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

const initialState = {
  // list
  employees: [],
  loadingEmployees: false,
  employeesError: null,

  // roles
  roles: [],
  loadingRoles: false,
  rolesError: null,

  // create
  creating: false,
  createSuccess: null,
  createError: null,
};

const hrEmployees = (state = initialState, action) => {
  switch (action.type) {
    // LIST
    case GET_HR_EMPLOYEES:
      return {
        ...state,
        loadingEmployees: true,
        employeesError: null,
      };
    case GET_HR_EMPLOYEES_SUCCESS:
      return {
        ...state,
        loadingEmployees: false,
        employees: action.payload || [],
        employeesError: null,
      };
    case GET_HR_EMPLOYEES_FAIL:
      return {
        ...state,
        loadingEmployees: false,
        employeesError: action.payload,
      };

    // ROLES
    case GET_HR_ROLES:
      return {
        ...state,
        loadingRoles: true,
        rolesError: null,
      };
    case GET_HR_ROLES_SUCCESS:
      return {
        ...state,
        loadingRoles: false,
        roles: action.payload || [],
        rolesError: null,
      };
    case GET_HR_ROLES_FAIL:
      return {
        ...state,
        loadingRoles: false,
        rolesError: action.payload,
      };

    // CREATE
    case CREATE_HR_EMPLOYEE:
      return {
        ...state,
        creating: true,
        createSuccess: null,
        createError: null,
      };
    case CREATE_HR_EMPLOYEE_SUCCESS:
      return {
        ...state,
        creating: false,
        createSuccess: action.payload,
        createError: null,
      };
    case CREATE_HR_EMPLOYEE_FAIL:
      return {
        ...state,
        creating: false,
        createError: action.payload,
      };

    case RESET_HR_EMPLOYEE_FLAGS:
      return {
        ...state,
        createSuccess: null,
        createError: null,
      };

    default:
      return state;
  }
};

export default hrEmployees;
