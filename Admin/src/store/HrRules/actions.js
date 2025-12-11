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

export const getHrRules = () => ({
  type: GET_HR_RULES,
});

export const getHrRulesSuccess = (rules) => ({
  type: GET_HR_RULES_SUCCESS,
  payload: rules,
});

export const getHrRulesFail = (error) => ({
  type: GET_HR_RULES_FAIL,
  payload: error,
});

export const createHrRule = (rule) => ({
  type: CREATE_HR_RULE,
  payload: rule,
});

export const createHrRuleSuccess = () => ({
  type: CREATE_HR_RULE_SUCCESS,
});

export const createHrRuleFail = (error) => ({
  type: CREATE_HR_RULE_FAIL,
  payload: error,
});

export const updateHrRule = (rule) => ({
  type: UPDATE_HR_RULE,
  payload: rule,
});

export const updateHrRuleSuccess = () => ({
  type: UPDATE_HR_RULE_SUCCESS,
});

export const updateHrRuleFail = (error) => ({
  type: UPDATE_HR_RULE_FAIL,
  payload: error,
});

export const deleteHrRule = (rule) => ({
  type: DELETE_HR_RULE,
  payload: rule,
});

export const deleteHrRuleSuccess = () => ({
  type: DELETE_HR_RULE_SUCCESS,
});

export const deleteHrRuleFail = (error) => ({
  type: DELETE_HR_RULE_FAIL,
  payload: error,
});
