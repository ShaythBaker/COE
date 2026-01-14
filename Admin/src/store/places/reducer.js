// src/store/places/reducer.js
import * as types from "./actionTypes";

const INIT_STATE = {
  list: [],
  current: null,

  loadingList: false,
  loadingOne: false,
  saving: false,

  error: null,
  successMessage: null,
};

const Places = (state = INIT_STATE, action) => {
  switch (action.type) {
    case types.GET_PLACES:
      return {
        ...state,
        loadingList: true,
        error: null,
      };

    case types.GET_PLACES_SUCCESS:
      return {
        ...state,
        loadingList: false,
        list: Array.isArray(action.payload) ? action.payload : [],
        error: null,
      };

    case types.GET_PLACES_FAIL:
      return {
        ...state,
        loadingList: false,
        error: action.payload,
      };

    case types.GET_PLACE:
      return {
        ...state,
        loadingOne: true,
        error: null,
      };

    case types.GET_PLACE_SUCCESS:
      return {
        ...state,
        loadingOne: false,
        current: action.payload || null,
        error: null,
      };

    case types.GET_PLACE_FAIL:
      return {
        ...state,
        loadingOne: false,
        error: action.payload,
      };

    case types.CREATE_PLACE:
    case types.UPDATE_PLACE:
    case types.DELETE_PLACE:
      return {
        ...state,
        saving: true,
        error: null,
        successMessage: null,
      };

    case types.CREATE_PLACE_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage:
          action.payload?.message || "Place created successfully.",
      };

    case types.UPDATE_PLACE_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage:
          action.payload?.message || "Place updated successfully.",
      };

    case types.DELETE_PLACE_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage:
          action.payload?.message || "Place deleted successfully.",
      };

    case types.CREATE_PLACE_FAIL:
    case types.UPDATE_PLACE_FAIL:
    case types.DELETE_PLACE_FAIL:
      return {
        ...state,
        saving: false,
        error: action.payload,
      };

    case types.CLEAR_PLACES_MESSAGES:
      return {
        ...state,
        error: null,
        successMessage: null,
      };

    default:
      return state;
  }
};

export default Places;
