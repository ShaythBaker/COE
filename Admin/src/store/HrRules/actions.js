// src/store/HrRules/actions.js
import * as types from "./actionTypes";

// LIST
export const getHrRules = () => ({
  type: types.GET_HR_RULES,
});

export const getHrRulesSuccess = (rules) => ({
  type: types.GET_HR_RULES_SUCCESS,
  payload: rules,
});

export const getHrRulesFail = (error) => ({
  type: types.GET_HR_RULES_FAIL,
  payload: error,
});

// CREATE
export const createHrRule = (rule) => ({
  type: types.CREATE_HR_RULE,
  payload: rule,
});

export const createHrRuleSuccess = (rule) => ({
  type: types.CREATE_HR_RULE_SUCCESS,
  payload: rule,
});

export const createHrRuleFail = (error) => ({
  type: types.CREATE_HR_RULE_FAIL,
  payload: error,
});

// UPDATE
export const updateHrRule = (rule) => ({
  type: types.UPDATE_HR_RULE,
  payload: rule,
});

export const updateHrRuleSuccess = (rule) => ({
  type: types.UPDATE_HR_RULE_SUCCESS,
  payload: rule,
});

export const updateHrRuleFail = (error) => ({
  type: types.UPDATE_HR_RULE_FAIL,
  payload: error,
});

// DELETE
export const deleteHrRule = (rule) => ({
  type: types.DELETE_HR_RULE,
  payload: rule,
});

export const deleteHrRuleSuccess = (rule) => ({
  type: types.DELETE_HR_RULE_SUCCESS,
  payload: rule,
});

export const deleteHrRuleFail = (error) => ({
  type: types.DELETE_HR_RULE_FAIL,
  payload: error,
});