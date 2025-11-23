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
  GET_HR_EMPLOYEE_DETAIL,
  GET_HR_EMPLOYEE_DETAIL_SUCCESS,
  GET_HR_EMPLOYEE_DETAIL_FAIL,
  UPDATE_HR_EMPLOYEE,
  UPDATE_HR_EMPLOYEE_SUCCESS,
  UPDATE_HR_EMPLOYEE_FAIL,
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

// ROLES
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

// CREATE
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

// DETAIL (for edit)
export const getHrEmployeeDetail = (userId) => ({
  type: GET_HR_EMPLOYEE_DETAIL,
  payload: userId,
});

export const getHrEmployeeDetailSuccess = (employee) => ({
  type: GET_HR_EMPLOYEE_DETAIL_SUCCESS,
  payload: employee,
});

export const getHrEmployeeDetailFail = (error) => ({
  type: GET_HR_EMPLOYEE_DETAIL_FAIL,
  payload: error,
});

// UPDATE
export const updateHrEmployee = (userId, data) => ({
  type: UPDATE_HR_EMPLOYEE,
  payload: { userId, data },
});

export const updateHrEmployeeSuccess = (response) => ({
  type: UPDATE_HR_EMPLOYEE_SUCCESS,
  payload: response,
});

export const updateHrEmployeeFail = (error) => ({
  type: UPDATE_HR_EMPLOYEE_FAIL,
  payload: error,
});

export const resetHrEmployeeFlags = () => ({
  type: RESET_HR_EMPLOYEE_FLAGS,
});
