import * as types from "./actionTypes";

const INIT_STATE = {
  list: [],
  current: null,
  countries: [],

  loadingList: false,
  loadingCurrent: false,
  loadingCountries: false,

  saving: false,
  deleting: false,

  successMessage: null,
  error: null,
};

const Clients = (state = INIT_STATE, action) => {
  switch (action.type) {
    case types.CLEAR_CLIENTS_MESSAGES:
      return { ...state, successMessage: null, error: null };

    case types.GET_CLIENTS:
      return { ...state, loadingList: true, error: null };
    case types.GET_CLIENTS_SUCCESS:
      return { ...state, loadingList: false, list: action.payload || [] };
    case types.GET_CLIENTS_FAIL:
      return { ...state, loadingList: false, error: action.payload };

    case types.GET_CLIENT:
      return { ...state, loadingCurrent: true, error: null };
    case types.GET_CLIENT_SUCCESS:
      return { ...state, loadingCurrent: false, current: action.payload };
    case types.GET_CLIENT_FAIL:
      return { ...state, loadingCurrent: false, error: action.payload };

    case types.GET_COUNTRIES:
      return { ...state, loadingCountries: true, error: null };
    case types.GET_COUNTRIES_SUCCESS:
      return {
        ...state,
        loadingCountries: false,
        countries: action.payload || [],
      };
    case types.GET_COUNTRIES_FAIL:
      return { ...state, loadingCountries: false, error: action.payload };

    case types.CREATE_CLIENT:
    case types.UPDATE_CLIENT:
      return { ...state, saving: true, successMessage: null, error: null };
    case types.CREATE_CLIENT_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage: action.payload?.message || "Client created",
      };
    case types.UPDATE_CLIENT_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage: action.payload?.message || "Client updated",
      };
    case types.CREATE_CLIENT_FAIL:
    case types.UPDATE_CLIENT_FAIL:
      return { ...state, saving: false, error: action.payload };

    case types.DELETE_CLIENT:
      return { ...state, deleting: true, successMessage: null, error: null };
    case types.DELETE_CLIENT_SUCCESS:
      return {
        ...state,
        deleting: false,
        successMessage: action.payload?.message || "Client deleted",
      };
    case types.DELETE_CLIENT_FAIL:
      return { ...state, deleting: false, error: action.payload };

    default:
      return state;
  }
};

export default Clients;
