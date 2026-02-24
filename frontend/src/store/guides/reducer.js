import * as t from "./actionTypes";

const INIT_STATE = {
  items: [],
  current: null,

  loadingList: false,
  loadingOne: false,
  creating: false,
  updating: false,
  deleting: false,

  successMessage: null,
  errorMessage: null,
};

const Guides = (state = INIT_STATE, action) => {
  switch (action.type) {
    case t.CLEAR_GUIDES_MESSAGES:
      return { ...state, successMessage: null, errorMessage: null };

    case t.GET_GUIDES:
      return { ...state, loadingList: true, errorMessage: null };
    case t.GET_GUIDES_SUCCESS:
      return { ...state, loadingList: false, items: action.payload || [] };
    case t.GET_GUIDES_FAIL:
      return { ...state, loadingList: false, errorMessage: action.payload };

    case t.GET_GUIDE:
      return { ...state, loadingOne: true, errorMessage: null, current: null };
    case t.GET_GUIDE_SUCCESS:
      return { ...state, loadingOne: false, current: action.payload };
    case t.GET_GUIDE_FAIL:
      return { ...state, loadingOne: false, errorMessage: action.payload };

    case t.CREATE_GUIDE:
      return {
        ...state,
        creating: true,
        errorMessage: null,
        successMessage: null,
      };
    case t.CREATE_GUIDE_SUCCESS:
      return {
        ...state,
        creating: false,
        successMessage: action.payload?.message || "Guide created.",
      };
    case t.CREATE_GUIDE_FAIL:
      return { ...state, creating: false, errorMessage: action.payload };

    case t.UPDATE_GUIDE:
      return {
        ...state,
        updating: true,
        errorMessage: null,
        successMessage: null,
      };
    case t.UPDATE_GUIDE_SUCCESS:
      return {
        ...state,
        updating: false,
        successMessage: action.payload?.message || "Guide updated.",
        current: action.payload?.GUIDE || state.current,
      };
    case t.UPDATE_GUIDE_FAIL:
      return { ...state, updating: false, errorMessage: action.payload };

    case t.DELETE_GUIDE:
      return {
        ...state,
        deleting: true,
        errorMessage: null,
        successMessage: null,
      };
    case t.DELETE_GUIDE_SUCCESS:
      return {
        ...state,
        deleting: false,
        successMessage: action.payload?.message || "Guide deleted.",
      };
    case t.DELETE_GUIDE_FAIL:
      return { ...state, deleting: false, errorMessage: action.payload };

    default:
      return state;
  }
};

export default Guides;
