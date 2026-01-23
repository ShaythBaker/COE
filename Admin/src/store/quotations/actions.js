import * as types from "./actionTypes";

export const getQoutations = () => ({ type: types.GET_QOUTATIONS });
export const getQoutationsSuccess = (items) => ({
  type: types.GET_QOUTATIONS_SUCCESS,
  payload: items,
});
export const getQoutationsFail = (error) => ({
  type: types.GET_QOUTATIONS_FAIL,
  payload: error,
});

export const createQoutation = (data) => ({
  type: types.CREATE_QOUTATION,
  payload: { data },
});
export const createQoutationSuccess = (res) => ({
  type: types.CREATE_QOUTATION_SUCCESS,
  payload: res,
});
export const createQoutationFail = (error) => ({
  type: types.CREATE_QOUTATION_FAIL,
  payload: error,
});

export const clearQoutationsMessages = () => ({
  type: types.CLEAR_QOUTATIONS_MESSAGES,
});

export const getQoutationById = (id) => ({
  type: types.GET_QOUTATION_BY_ID,
  payload: { id },
});
export const getQoutationByIdSuccess = (data) => ({
  type: types.GET_QOUTATION_BY_ID_SUCCESS,
  payload: data,
});
export const getQoutationByIdFail = (error) => ({
  type: types.GET_QOUTATION_BY_ID_FAIL,
  payload: error,
});

export const getQoutationStep1 = (id) => ({
  type: types.GET_QOUTATION_STEP1,
  payload: { id },
});
export const getQoutationStep1Success = (data) => ({
  type: types.GET_QOUTATION_STEP1_SUCCESS,
  payload: data,
});
export const getQoutationStep1Fail = (error) => ({
  type: types.GET_QOUTATION_STEP1_FAIL,
  payload: error,
});