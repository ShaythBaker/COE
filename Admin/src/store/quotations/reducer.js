import * as types from "./actionTypes";

const INIT_STATE = {
  list: [],
  loadingList: false,
  saving: false,
  successMessage: null,
  error: null,
  details: null,
  step1: null,
  loadingDetails: false,
  loadingStep1: false,
  step1Submitted: null,
  hasSubmittedStep1: false,
  loadingStep1Submitted: false,

  savingStep1: false,
};

const Quotations = (state = INIT_STATE, action) => {
  switch (action.type) {
    case types.CLEAR_QOUTATIONS_MESSAGES:
      return { ...state, successMessage: null, error: null };

    case types.GET_QOUTATIONS:
      return { ...state, loadingList: true, error: null };
    case types.GET_QOUTATIONS_SUCCESS:
      return { ...state, loadingList: false, list: action.payload || [] };
    case types.GET_QOUTATIONS_FAIL:
      return { ...state, loadingList: false, error: action.payload };

    case types.CREATE_QOUTATION:
      return { ...state, saving: true, successMessage: null, error: null };
    case types.CREATE_QOUTATION_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage: action.payload?.message || "Quotation created",
      };
    case types.CREATE_QOUTATION_FAIL:
      return { ...state, saving: false, error: action.payload };

    case types.GET_QOUTATION_BY_ID:
      return { ...state, loadingDetails: true, error: null };

    case types.GET_QOUTATION_BY_ID_SUCCESS:
      return {
        ...state,
        loadingDetails: false,
        details: action.payload || null,
      };

    case types.GET_QOUTATION_BY_ID_FAIL:
      return { ...state, loadingDetails: false, error: action.payload };

    case types.GET_QOUTATION_STEP1:
      return { ...state, loadingStep1: true, error: null };

    case types.GET_QOUTATION_STEP1_SUCCESS:
      return { ...state, loadingStep1: false, step1: action.payload || null };

    case types.GET_QOUTATION_STEP1_FAIL:
      return { ...state, loadingStep1: false, error: action.payload };

      case types.GET_QOUTATION_STEP1_SUBMITTED:
  return { ...state, loadingStep1Submitted: true, error: null };

case types.GET_QOUTATION_STEP1_SUBMITTED_SUCCESS:
  return {
    ...state,
    loadingStep1Submitted: false,
    step1Submitted: action.payload || null,
    hasSubmittedStep1: !!action.payload,
  };

case types.GET_QOUTATION_STEP1_SUBMITTED_FAIL:
  return { ...state, loadingStep1Submitted: false, error: action.payload };

case types.SAVE_QOUTATION_STEP1:
  return { ...state, savingStep1: true, error: null, successMessage: null };

case types.SAVE_QOUTATION_STEP1_SUCCESS:
  return {
    ...state,
    savingStep1: false,
    successMessage: action.payload?.message || "Step 1 saved successfully",
  };

case types.SAVE_QOUTATION_STEP1_FAIL:
  return { ...state, savingStep1: false, error: action.payload };


    default:
      return state;
  }
};

export default Quotations;
