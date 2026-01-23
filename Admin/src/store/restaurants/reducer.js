import * as types from "./actionTypes";

const INIT_STATE = {
  list: [],
  current: null,

  loadingList: false,
  loadingCurrent: false,

  saving: false,
  deleting: false,

  successMessage: null,
  error: null,
};

const Restaurants = (state = INIT_STATE, action) => {
  switch (action.type) {
    case types.CLEAR_RESTAURANTS_MESSAGES:
      return { ...state, successMessage: null, error: null };

    case types.GET_RESTAURANTS:
      return { ...state, loadingList: true, error: null };
    case types.GET_RESTAURANTS_SUCCESS:
      return { ...state, loadingList: false, list: action.payload || [] };
    case types.GET_RESTAURANTS_FAIL:
      return { ...state, loadingList: false, error: action.payload };

    case types.GET_RESTAURANT:
      return { ...state, loadingCurrent: true, error: null };
    case types.GET_RESTAURANT_SUCCESS:
      return {
        ...state,
        loadingCurrent: false,
        current: action.payload || null,
      };
    case types.GET_RESTAURANT_FAIL:
      return { ...state, loadingCurrent: false, error: action.payload };

    case types.CREATE_RESTAURANT:
    case types.UPDATE_RESTAURANT:
      return { ...state, saving: true, successMessage: null, error: null };

    case types.CREATE_RESTAURANT_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage: action.payload?.message || "Restaurant created",
      };
    case types.UPDATE_RESTAURANT_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage: action.payload?.message || "Restaurant updated",
      };

    case types.CREATE_RESTAURANT_FAIL:
    case types.UPDATE_RESTAURANT_FAIL:
      return { ...state, saving: false, error: action.payload };

    case types.DELETE_RESTAURANT:
      return { ...state, deleting: true, successMessage: null, error: null };
    case types.DELETE_RESTAURANT_SUCCESS:
      return {
        ...state,
        deleting: false,
        successMessage: action.payload?.message || "Restaurant deleted",
      };
    case types.DELETE_RESTAURANT_FAIL:
      return { ...state, deleting: false, error: action.payload };

    default:
      return state;
  }
};

export default Restaurants;
