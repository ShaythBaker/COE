import * as types from "./actionTypes";

export const clearPlaceEntranceFeesMessages = () => ({
  type: types.CLEAR_PLACE_ENTRANCE_FEES_MESSAGES,
});

export const getPlaceEntranceFees = (placeId) => ({
  type: types.GET_PLACE_ENTRANCE_FEES,
  payload: { placeId },
});

export const getPlaceEntranceFeesSuccess = (items) => ({
  type: types.GET_PLACE_ENTRANCE_FEES_SUCCESS,
  payload: items,
});

export const getPlaceEntranceFeesFail = (error) => ({
  type: types.GET_PLACE_ENTRANCE_FEES_FAIL,
  payload: error,
});

export const createPlaceEntranceFees = (placeId, data) => ({
  type: types.CREATE_PLACE_ENTRANCE_FEES,
  payload: { placeId, data },
});

export const createPlaceEntranceFeesSuccess = (res) => ({
  type: types.CREATE_PLACE_ENTRANCE_FEES_SUCCESS,
  payload: res,
});

export const createPlaceEntranceFeesFail = (error) => ({
  type: types.CREATE_PLACE_ENTRANCE_FEES_FAIL,
  payload: error,
});

export const updatePlaceEntranceFee = (placeId, feeId, data) => ({
  type: types.UPDATE_PLACE_ENTRANCE_FEE,
  payload: { placeId, feeId, data },
});

export const updatePlaceEntranceFeeSuccess = (res) => ({
  type: types.UPDATE_PLACE_ENTRANCE_FEE_SUCCESS,
  payload: res,
});

export const updatePlaceEntranceFeeFail = (error) => ({
  type: types.UPDATE_PLACE_ENTRANCE_FEE_FAIL,
  payload: error,
});

export const deletePlaceEntranceFee = (placeId, feeId) => ({
  type: types.DELETE_PLACE_ENTRANCE_FEE,
  payload: { placeId, feeId },
});

export const deletePlaceEntranceFeeSuccess = (res) => ({
  type: types.DELETE_PLACE_ENTRANCE_FEE_SUCCESS,
  payload: res,
});

export const deletePlaceEntranceFeeFail = (error) => ({
  type: types.DELETE_PLACE_ENTRANCE_FEE_FAIL,
  payload: error,
});
