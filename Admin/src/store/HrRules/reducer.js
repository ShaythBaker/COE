// src/store/HrRules/reducer.js

import {
  GET_HR_RULES,
  GET_HR_RULES_SUCCESS,
  GET_HR_RULES_FAIL,
  CREATE_HR_RULE_SUCCESS,
  CREATE_HR_RULE_FAIL,
  UPDATE_HR_RULE_SUCCESS,
  UPDATE_HR_RULE_FAIL,
  DELETE_HR_RULE_SUCCESS,
  DELETE_HR_RULE_FAIL,
} from "./actionTypes";

const initialState = {
  rules: [],
  loading: false,
  error: null, // always store a STRING here
};

// Helper: always turn any error into a readable string
const toErrorMessage = (err) => {
  if (!err) return null;
  if (typeof err === "string") return err;

  // Axios-style error: try to extract a useful message
  if (err.response && err.response.data) {
    const data = err.response.data;
    if (typeof data === "string") return data;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
  }

  if (err.message) return err.message;

  return "Something went wrong while processing your request.";
};

const HrRules = (state = initialState, action) => {
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
        error: toErrorMessage(action.payload),
      };

    case CREATE_HR_RULE_SUCCESS:
      return {
        ...state,
        rules: [...state.rules, action.payload],
        error: null,
      };

    case CREATE_HR_RULE_FAIL:
      return {
        ...state,
        error: toErrorMessage(action.payload),
      };

    case UPDATE_HR_RULE_SUCCESS:
      return {
        ...state,
        rules: state.rules.map((r) =>
          (r.id ?? r.ROLE_ID) === (action.payload.id ?? action.payload.ROLE_ID)
            ? action.payload
            : r
        ),
        error: null,
      };

    case UPDATE_HR_RULE_FAIL:
      return {
        ...state,
        error: toErrorMessage(action.payload),
      };

    case DELETE_HR_RULE_SUCCESS:
      return {
        ...state,
        rules: state.rules.filter(
          (r) =>
            (r.id ?? r.ROLE_ID) !==
            (action.payload.id ?? action.payload.ROLE_ID)
        ),
        error: null,
      };

    case DELETE_HR_RULE_FAIL:
      return {
        ...state,
        error: toErrorMessage(action.payload),
      };

    default:
      return state;
  }
};

export default HrRules;