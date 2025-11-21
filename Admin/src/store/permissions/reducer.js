import {
  LOAD_MY_PERMISSIONS,
  LOAD_MY_PERMISSIONS_SUCCESS,
  LOAD_MY_PERMISSIONS_ERROR,
} from "./actionTypes";

const initialState = {
  loading: false,
  error: "",
  userId: null,
  modules: [], // array of MODULE objects from backend
};

const Permissions = (state = initialState, action) => {
  switch (action.type) {
    case LOAD_MY_PERMISSIONS:
      return {
        ...state,
        loading: true,
        error: "",
      };

    case LOAD_MY_PERMISSIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: "",
        userId: action.payload.USER_ID || null,
        modules: action.payload.MODULES || [],
      };

    case LOAD_MY_PERMISSIONS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default Permissions;
