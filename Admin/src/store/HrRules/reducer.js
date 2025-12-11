import {
  GET_HR_RULES,
  GET_HR_RULES_SUCCESS,
  GET_HR_RULES_FAIL,
  CREATE_HR_RULE,
  CREATE_HR_RULE_SUCCESS,
  CREATE_HR_RULE_FAIL,
  UPDATE_HR_RULE,
  UPDATE_HR_RULE_SUCCESS,
  UPDATE_HR_RULE_FAIL,
  DELETE_HR_RULE,
  DELETE_HR_RULE_SUCCESS,
  DELETE_HR_RULE_FAIL,
} from "./actionTypes";

const INIT_STATE = {
  rules: [],
  loading: false,
  saving: false,
  deleting: false,
  error: null,
};

const HrRules = (state = INIT_STATE, action) => {
  switch (action.type) {
    case GET_HR_RULES:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case GET_HR_RULES_SUCCESS:
      return {
        ...state,
        loading: false,
        rules: action.payload || [],
        error: null,
      };
    case GET_HR_RULES_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case CREATE_HR_RULE:
    case UPDATE_HR_RULE:
      return {
        ...state,
        saving: true,
        error: null,
      };
    case CREATE_HR_RULE_SUCCESS:
    case UPDATE_HR_RULE_SUCCESS:
      return {
        ...state,
        saving: false,
      };
    case CREATE_HR_RULE_FAIL:
    case UPDATE_HR_RULE_FAIL:
      return {
        ...state,
        saving: false,
        error: action.payload,
      };

    case DELETE_HR_RULE:
      return {
        ...state,
        deleting: true,
        error: null,
      };
    case DELETE_HR_RULE_SUCCESS:
      return {
        ...state,
        deleting: false,
      };
    case DELETE_HR_RULE_FAIL:
      return {
        ...state,
        deleting: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default HrRules;
