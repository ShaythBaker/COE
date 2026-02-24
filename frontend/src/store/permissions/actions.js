import {
  LOAD_MY_PERMISSIONS,
  LOAD_MY_PERMISSIONS_SUCCESS,
  LOAD_MY_PERMISSIONS_ERROR,
} from "./actionTypes";

export const loadMyPermissions = () => ({
  type: LOAD_MY_PERMISSIONS,
});

export const loadMyPermissionsSuccess = (data) => ({
  type: LOAD_MY_PERMISSIONS_SUCCESS,
  payload: data,
});

export const loadMyPermissionsError = (error) => ({
  type: LOAD_MY_PERMISSIONS_ERROR,
  payload: error,
});
