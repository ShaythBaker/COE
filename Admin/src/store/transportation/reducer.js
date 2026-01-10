// src/store/transportation/reducer.js
import * as t from "./actionTypes";

const INIT_STATE = {
  // Companies
  companies: [],
  loadingCompanies: false,
  companiesError: null,

  company: null,
  loadingCompany: false,
  companyError: null,

  creatingCompany: false,
  updatingCompany: false,
  deletingCompany: false,

  // Contracts
  contracts: [],
  loadingContracts: false,
  contractsError: null,

  // Vehicles
  vehicles: [],
  loadingVehicles: false,
  vehiclesError: null,

  // generic message
  successMessage: null,
  errorMessage: null,
};

const Transportation = (state = INIT_STATE, action) => {
  switch (action.type) {
    // Companies list
    case t.GET_TRANSPORTATION_COMPANIES:
      return { ...state, loadingCompanies: true, companiesError: null };
    case t.GET_TRANSPORTATION_COMPANIES_SUCCESS:
      return {
        ...state,
        loadingCompanies: false,
        companies: action.payload?.COMPANIES || action.payload || [],
      };
    case t.GET_TRANSPORTATION_COMPANIES_FAIL:
      return {
        ...state,
        loadingCompanies: false,
        companiesError: action.payload,
      };

    // Company details
    case t.GET_TRANSPORTATION_COMPANY:
      return { ...state, loadingCompany: true, companyError: null };
    case t.GET_TRANSPORTATION_COMPANY_SUCCESS:
      return { ...state, loadingCompany: false, company: action.payload };
    case t.GET_TRANSPORTATION_COMPANY_FAIL:
      return { ...state, loadingCompany: false, companyError: action.payload };

    // Create company
    case t.CREATE_TRANSPORTATION_COMPANY:
      return {
        ...state,
        creatingCompany: true,
        errorMessage: null,
        successMessage: null,
      };
    case t.CREATE_TRANSPORTATION_COMPANY_SUCCESS:
      return {
        ...state,
        creatingCompany: false,
        successMessage: "Company created successfully.",
      };
    case t.CREATE_TRANSPORTATION_COMPANY_FAIL:
      return { ...state, creatingCompany: false, errorMessage: action.payload };

    // Update company
    case t.UPDATE_TRANSPORTATION_COMPANY:
      return {
        ...state,
        updatingCompany: true,
        errorMessage: null,
        successMessage: null,
      };
    case t.UPDATE_TRANSPORTATION_COMPANY_SUCCESS:
      return {
        ...state,
        updatingCompany: false,
        successMessage: "Company updated successfully.",
      };
    case t.UPDATE_TRANSPORTATION_COMPANY_FAIL:
      return { ...state, updatingCompany: false, errorMessage: action.payload };

    // Delete company (soft)
    case t.DELETE_TRANSPORTATION_COMPANY:
      return {
        ...state,
        deletingCompany: true,
        errorMessage: null,
        successMessage: null,
      };
    case t.DELETE_TRANSPORTATION_COMPANY_SUCCESS:
      return {
        ...state,
        deletingCompany: false,
        successMessage: "Company deactivated successfully.",
      };
    case t.DELETE_TRANSPORTATION_COMPANY_FAIL:
      return { ...state, deletingCompany: false, errorMessage: action.payload };

    // Contracts
    case t.GET_TRANSPORTATION_CONTRACTS:
      return { ...state, loadingContracts: true, contractsError: null };
    case t.GET_TRANSPORTATION_CONTRACTS_SUCCESS:
      return {
        ...state,
        loadingContracts: false,
        contracts: action.payload?.CONTRACTS || action.payload || [],
      };
    case t.GET_TRANSPORTATION_CONTRACTS_FAIL:
      return {
        ...state,
        loadingContracts: false,
        contractsError: action.payload,
      };

    case t.CREATE_TRANSPORTATION_CONTRACT:
    case t.UPDATE_TRANSPORTATION_CONTRACT:
    case t.DELETE_TRANSPORTATION_CONTRACT:
      return { ...state, errorMessage: null, successMessage: null };

    case t.CREATE_TRANSPORTATION_CONTRACT_SUCCESS:
      return { ...state, successMessage: "Contract saved successfully." };
    case t.UPDATE_TRANSPORTATION_CONTRACT_SUCCESS:
      return { ...state, successMessage: "Contract updated successfully." };
    case t.DELETE_TRANSPORTATION_CONTRACT_SUCCESS:
      return { ...state, successMessage: "Contract deleted successfully." };

    case t.CREATE_TRANSPORTATION_CONTRACT_FAIL:
    case t.UPDATE_TRANSPORTATION_CONTRACT_FAIL:
    case t.DELETE_TRANSPORTATION_CONTRACT_FAIL:
      return { ...state, errorMessage: action.payload };

    // Vehicles
    case t.GET_TRANSPORTATION_VEHICLES:
      return { ...state, loadingVehicles: true, vehiclesError: null };
    case t.GET_TRANSPORTATION_VEHICLES_SUCCESS:
      return {
        ...state,
        loadingVehicles: false,
        vehicles: action.payload?.VEHICLES || action.payload || [],
      };
    case t.GET_TRANSPORTATION_VEHICLES_FAIL:
      return {
        ...state,
        loadingVehicles: false,
        vehiclesError: action.payload,
      };

    case t.CREATE_TRANSPORTATION_VEHICLE_SUCCESS:
      return { ...state, successMessage: "Vehicle saved successfully." };
    case t.UPDATE_TRANSPORTATION_VEHICLE_SUCCESS:
      return { ...state, successMessage: "Vehicle updated successfully." };
    case t.DELETE_TRANSPORTATION_VEHICLE_SUCCESS:
      return { ...state, successMessage: "Vehicle deactivated successfully." };

    case t.CREATE_TRANSPORTATION_VEHICLE_FAIL:
    case t.UPDATE_TRANSPORTATION_VEHICLE_FAIL:
    case t.DELETE_TRANSPORTATION_VEHICLE_FAIL:
      return { ...state, errorMessage: action.payload };

    // UI
    case t.CLEAR_TRANSPORTATION_MESSAGES:
      return { ...state, successMessage: null, errorMessage: null };

    default:
      return state;
  }
};

export default Transportation;
