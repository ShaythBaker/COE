// src/store/places/actions.js
import * as types from "./actionTypes";

export const getPlaces = (placeAreaId) => ({
  type: types.GET_PLACES,
  payload: { placeAreaId },
});
export const getPlacesSuccess = (items) => ({
  type: types.GET_PLACES_SUCCESS,
  payload: items,
});
export const getPlacesFail = (error) => ({
  type: types.GET_PLACES_FAIL,
  payload: error,
});

export const getPlace = (placeId) => ({
  type: types.GET_PLACE,
  payload: { placeId },
});
export const getPlaceSuccess = (item) => ({
  type: types.GET_PLACE_SUCCESS,
  payload: item,
});
export const getPlaceFail = (error) => ({
  type: types.GET_PLACE_FAIL,
  payload: error,
});

export const createPlace = (data) => ({
  type: types.CREATE_PLACE,
  payload: { data },
});
export const createPlaceSuccess = (res) => ({
  type: types.CREATE_PLACE_SUCCESS,
  payload: res,
});
export const createPlaceFail = (error) => ({
  type: types.CREATE_PLACE_FAIL,
  payload: error,
});

export const updatePlace = (placeId, data) => ({
  type: types.UPDATE_PLACE,
  payload: { placeId, data },
});
export const updatePlaceSuccess = (res) => ({
  type: types.UPDATE_PLACE_SUCCESS,
  payload: res,
});
export const updatePlaceFail = (error) => ({
  type: types.UPDATE_PLACE_FAIL,
  payload: error,
});

export const deletePlace = (placeId) => ({
  type: types.DELETE_PLACE,
  payload: { placeId },
});
export const deletePlaceSuccess = (res) => ({
  type: types.DELETE_PLACE_SUCCESS,
  payload: res,
});
export const deletePlaceFail = (error) => ({
  type: types.DELETE_PLACE_FAIL,
  payload: error,
});

export const clearPlacesMessages = () => ({
  type: types.CLEAR_PLACES_MESSAGES,
});
