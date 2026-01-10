import * as t from "./actionTypes";

export const getGuides = (params) => ({ type: t.GET_GUIDES, payload: params });
export const getGuidesSuccess = (items) => ({
  type: t.GET_GUIDES_SUCCESS,
  payload: items,
});
export const getGuidesFail = (error) => ({
  type: t.GET_GUIDES_FAIL,
  payload: error,
});

export const getGuide = (id) => ({ type: t.GET_GUIDE, payload: id });
export const getGuideSuccess = (item) => ({
  type: t.GET_GUIDE_SUCCESS,
  payload: item,
});
export const getGuideFail = (error) => ({
  type: t.GET_GUIDE_FAIL,
  payload: error,
});

export const createGuide = (data, cb) => ({
  type: t.CREATE_GUIDE,
  payload: { data, cb },
});
export const createGuideSuccess = (res) => ({
  type: t.CREATE_GUIDE_SUCCESS,
  payload: res,
});
export const createGuideFail = (error) => ({
  type: t.CREATE_GUIDE_FAIL,
  payload: error,
});

export const updateGuide = (id, data, cb) => ({
  type: t.UPDATE_GUIDE,
  payload: { id, data, cb },
});
export const updateGuideSuccess = (res) => ({
  type: t.UPDATE_GUIDE_SUCCESS,
  payload: res,
});
export const updateGuideFail = (error) => ({
  type: t.UPDATE_GUIDE_FAIL,
  payload: error,
});

export const deleteGuide = (id, cb) => ({
  type: t.DELETE_GUIDE,
  payload: { id, cb },
});
export const deleteGuideSuccess = (res) => ({
  type: t.DELETE_GUIDE_SUCCESS,
  payload: res,
});
export const deleteGuideFail = (error) => ({
  type: t.DELETE_GUIDE_FAIL,
  payload: error,
});

export const clearGuidesMessages = () => ({ type: t.CLEAR_GUIDES_MESSAGES });
