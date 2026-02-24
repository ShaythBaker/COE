import {
  GET_EXTRA_SERVICES,
  GET_EXTRA_SERVICES_SUCCESS,
  GET_EXTRA_SERVICES_FAIL,
  GET_QUOTATION_EXTRA_SERVICES,
  GET_QUOTATION_EXTRA_SERVICES_SUCCESS,
  GET_QUOTATION_EXTRA_SERVICES_FAIL,
  SAVE_QUOTATION_EXTRA_SERVICE,
  SAVE_QUOTATION_EXTRA_SERVICE_SUCCESS,
  SAVE_QUOTATION_EXTRA_SERVICE_FAIL,
  DELETE_QUOTATION_EXTRA_SERVICE,
  DELETE_QUOTATION_EXTRA_SERVICE_SUCCESS,
  DELETE_QUOTATION_EXTRA_SERVICE_FAIL,
  CLEAR_STEP3_MESSAGES,
} from "./actionTypes";

export const getExtraServices = () => ({ type: GET_EXTRA_SERVICES });
export const getExtraServicesSuccess = (data) => ({
  type: GET_EXTRA_SERVICES_SUCCESS,
  payload: data,
});
export const getExtraServicesFail = (error) => ({
  type: GET_EXTRA_SERVICES_FAIL,
  payload: error,
});

export const getQuotationExtraServices = (qoutationId) => ({
  type: GET_QUOTATION_EXTRA_SERVICES,
  payload: { qoutationId },
});
export const getQuotationExtraServicesSuccess = (data) => ({
  type: GET_QUOTATION_EXTRA_SERVICES_SUCCESS,
  payload: data,
});
export const getQuotationExtraServicesFail = (error) => ({
  type: GET_QUOTATION_EXTRA_SERVICES_FAIL,
  payload: error,
});

export const saveQuotationExtraService = (qoutationId, payload) => ({
  type: SAVE_QUOTATION_EXTRA_SERVICE,
  payload: { qoutationId, payload }, // {EXTRA_SERVICE_ID, EXTRA_SERVICE_COST_PP}
});
export const saveQuotationExtraServiceSuccess = (data) => ({
  type: SAVE_QUOTATION_EXTRA_SERVICE_SUCCESS,
  payload: data,
});
export const saveQuotationExtraServiceFail = (error) => ({
  type: SAVE_QUOTATION_EXTRA_SERVICE_FAIL,
  payload: error,
});

export const deleteQuotationExtraService = (
  qoutationExtraServiceId,
  extraServiceId,
) => ({
  type: DELETE_QUOTATION_EXTRA_SERVICE,
  payload: { qoutationExtraServiceId, extraServiceId },
});

export const deleteQuotationExtraServiceSuccess = (
  qoutationExtraServiceId,
  extraServiceId,
) => ({
  type: DELETE_QUOTATION_EXTRA_SERVICE_SUCCESS,
  payload: { qoutationExtraServiceId, extraServiceId },
});
export const deleteQuotationExtraServiceFail = (error) => ({
  type: DELETE_QUOTATION_EXTRA_SERVICE_FAIL,
  payload: error,
});

export const clearStep3Messages = () => ({ type: CLEAR_STEP3_MESSAGES });
