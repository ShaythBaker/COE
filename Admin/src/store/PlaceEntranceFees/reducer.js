import * as types from "./actionTypes";

const INIT_STATE = {
  list: [],
  loadingList: false,

  saving: false,
  deleting: false,

  successMessage: null,
  error: null,
};

const PlaceEntranceFees = (state = INIT_STATE, action) => {
  switch (action.type) {
    case types.CLEAR_PLACE_ENTRANCE_FEES_MESSAGES:
      return { ...state, successMessage: null, error: null };

    case types.GET_PLACE_ENTRANCE_FEES:
      return { ...state, loadingList: true, error: null };
    case types.GET_PLACE_ENTRANCE_FEES_SUCCESS:
      return { ...state, loadingList: false, list: action.payload || [] };
    case types.GET_PLACE_ENTRANCE_FEES_FAIL:
      return { ...state, loadingList: false, error: action.payload };

    case types.CREATE_PLACE_ENTRANCE_FEES:
    case types.UPDATE_PLACE_ENTRANCE_FEE:
      return { ...state, saving: true, successMessage: null, error: null };

    case types.CREATE_PLACE_ENTRANCE_FEES_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage: action.payload?.message || "Entrance fees created",
      };
    case types.UPDATE_PLACE_ENTRANCE_FEE_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage: action.payload?.message || "Entrance fee updated",
      };

    case types.CREATE_PLACE_ENTRANCE_FEES_FAIL:
    case types.UPDATE_PLACE_ENTRANCE_FEE_FAIL:
      return { ...state, saving: false, error: action.payload };

    case types.DELETE_PLACE_ENTRANCE_FEE:
      return { ...state, deleting: true, successMessage: null, error: null };
    case types.DELETE_PLACE_ENTRANCE_FEE_SUCCESS:
      return {
        ...state,
        deleting: false,
        successMessage: action.payload?.message || "Entrance fee deleted",
      };
    case types.DELETE_PLACE_ENTRANCE_FEE_FAIL:
      return { ...state, deleting: false, error: action.payload };

    default:
      return state;
  }
};

export default PlaceEntranceFees;
