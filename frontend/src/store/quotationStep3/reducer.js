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

const INIT_STATE = {
  extraServices: [],
  quotationExtraServices: [],

  loadingExtraServices: false,
  loadingQuotationExtraServices: false,

  saving: false,
  deleting: false,

  error: null,
  successMessage: null,
};

const quotationStep3Reducer = (state = INIT_STATE, action) => {
  switch (action.type) {
    case GET_EXTRA_SERVICES:
      return { ...state, loadingExtraServices: true, error: null };

    case GET_EXTRA_SERVICES_SUCCESS:
      return {
        ...state,
        loadingExtraServices: false,
        extraServices: action.payload || [],
      };

    case GET_EXTRA_SERVICES_FAIL:
      return {
        ...state,
        loadingExtraServices: false,
        error: action.payload || "Failed to load extra services",
      };

    case GET_QUOTATION_EXTRA_SERVICES:
      return { ...state, loadingQuotationExtraServices: true, error: null };

    case GET_QUOTATION_EXTRA_SERVICES_SUCCESS:
      return {
        ...state,
        loadingQuotationExtraServices: false,
        quotationExtraServices: action.payload || [],
      };

    case GET_QUOTATION_EXTRA_SERVICES_FAIL:
      return {
        ...state,
        loadingQuotationExtraServices: false,
        error: action.payload || "Failed to load quotation extra services",
      };

    case SAVE_QUOTATION_EXTRA_SERVICE:
      return { ...state, saving: true, error: null, successMessage: null };

    case SAVE_QUOTATION_EXTRA_SERVICE_SUCCESS: {
      const created = action.payload?.EXTRA_SERVICE;
      // if backend returns only created item, we can append & de-dupe by EXTRA_SERVICE_ID
      const next = [...(state.quotationExtraServices || [])];
      if (created?.EXTRA_SERVICE_ID) {
        const idx = next.findIndex(
          (x) =>
            Number(x.EXTRA_SERVICE_ID) === Number(created.EXTRA_SERVICE_ID),
        );
        if (idx >= 0) next[idx] = { ...next[idx], ...created };
        else next.push(created);
      }
      return {
        ...state,
        saving: false,
        quotationExtraServices: next,
        successMessage: action.payload?.message || "Saved",
      };
    }

    case SAVE_QUOTATION_EXTRA_SERVICE_FAIL:
      return {
        ...state,
        saving: false,
        error: action.payload || "Failed to save extra service",
      };

    case DELETE_QUOTATION_EXTRA_SERVICE:
      return { ...state, deleting: true, error: null, successMessage: null };

    case DELETE_QUOTATION_EXTRA_SERVICE_SUCCESS: {
      const { qoutationExtraServiceId, extraServiceId } = action.payload || {};
      return {
        ...state,
        deleting: false,
        quotationExtraServices: (state.quotationExtraServices || []).filter(
          (x) => {
            // prefer deleting by QOUTATION_EXTRA_SERVICE_ID
            if (qoutationExtraServiceId != null) {
              return (
                Number(x.QOUTATION_EXTRA_SERVICE_ID) !==
                Number(qoutationExtraServiceId)
              );
            }
            // fallback
            return Number(x.EXTRA_SERVICE_ID) !== Number(extraServiceId);
          },
        ),
        successMessage: "Success",
      };
    }

    case DELETE_QUOTATION_EXTRA_SERVICE_FAIL:
      return {
        ...state,
        deleting: false,
        error: action.payload || "Failed to remove extra service",
      };

    case CLEAR_STEP3_MESSAGES:
      return { ...state, error: null, successMessage: null };

    default:
      return state;
  }
};

export default quotationStep3Reducer;
