// src/store/transportation/actions.js
import * as t from "./actionTypes";

// Companies
export const getTransportationCompanies = (params) => ({
  type: t.GET_TRANSPORTATION_COMPANIES,
  payload: params,
});
export const getTransportationCompaniesSuccess = (data) => ({
  type: t.GET_TRANSPORTATION_COMPANIES_SUCCESS,
  payload: data,
});
export const getTransportationCompaniesFail = (error) => ({
  type: t.GET_TRANSPORTATION_COMPANIES_FAIL,
  payload: error,
});

export const createTransportationCompany = (data) => ({
  type: t.CREATE_TRANSPORTATION_COMPANY,
  payload: data,
});
export const createTransportationCompanySuccess = (data) => ({
  type: t.CREATE_TRANSPORTATION_COMPANY_SUCCESS,
  payload: data,
});
export const createTransportationCompanyFail = (error) => ({
  type: t.CREATE_TRANSPORTATION_COMPANY_FAIL,
  payload: error,
});

export const getTransportationCompany = (companyId) => ({
  type: t.GET_TRANSPORTATION_COMPANY,
  payload: companyId,
});
export const getTransportationCompanySuccess = (data) => ({
  type: t.GET_TRANSPORTATION_COMPANY_SUCCESS,
  payload: data,
});
export const getTransportationCompanyFail = (error) => ({
  type: t.GET_TRANSPORTATION_COMPANY_FAIL,
  payload: error,
});

export const updateTransportationCompany = (companyId, data) => ({
  type: t.UPDATE_TRANSPORTATION_COMPANY,
  payload: { companyId, data },
});
export const updateTransportationCompanySuccess = (data) => ({
  type: t.UPDATE_TRANSPORTATION_COMPANY_SUCCESS,
  payload: data,
});
export const updateTransportationCompanyFail = (error) => ({
  type: t.UPDATE_TRANSPORTATION_COMPANY_FAIL,
  payload: error,
});

export const deleteTransportationCompany = (companyId) => ({
  type: t.DELETE_TRANSPORTATION_COMPANY,
  payload: companyId,
});
export const deleteTransportationCompanySuccess = (data) => ({
  type: t.DELETE_TRANSPORTATION_COMPANY_SUCCESS,
  payload: data,
});
export const deleteTransportationCompanyFail = (error) => ({
  type: t.DELETE_TRANSPORTATION_COMPANY_FAIL,
  payload: error,
});

// Contracts
export const getTransportationContracts = (companyId) => ({
  type: t.GET_TRANSPORTATION_CONTRACTS,
  payload: companyId,
});
export const getTransportationContractsSuccess = (data) => ({
  type: t.GET_TRANSPORTATION_CONTRACTS_SUCCESS,
  payload: data,
});
export const getTransportationContractsFail = (error) => ({
  type: t.GET_TRANSPORTATION_CONTRACTS_FAIL,
  payload: error,
});

export const createTransportationContract = (companyId, data) => ({
  type: t.CREATE_TRANSPORTATION_CONTRACT,
  payload: { companyId, data },
});
export const createTransportationContractSuccess = (data) => ({
  type: t.CREATE_TRANSPORTATION_CONTRACT_SUCCESS,
  payload: data,
});
export const createTransportationContractFail = (error) => ({
  type: t.CREATE_TRANSPORTATION_CONTRACT_FAIL,
  payload: error,
});

export const updateTransportationContract = (contractId, data, companyId) => ({
  type: t.UPDATE_TRANSPORTATION_CONTRACT,
  payload: { contractId, data, companyId },
});
export const updateTransportationContractSuccess = (data) => ({
  type: t.UPDATE_TRANSPORTATION_CONTRACT_SUCCESS,
  payload: data,
});
export const updateTransportationContractFail = (error) => ({
  type: t.UPDATE_TRANSPORTATION_CONTRACT_FAIL,
  payload: error,
});

export const deleteTransportationContract = (contractId, companyId) => ({
  type: t.DELETE_TRANSPORTATION_CONTRACT,
  payload: { contractId, companyId },
});
export const deleteTransportationContractSuccess = (data) => ({
  type: t.DELETE_TRANSPORTATION_CONTRACT_SUCCESS,
  payload: data,
});
export const deleteTransportationContractFail = (error) => ({
  type: t.DELETE_TRANSPORTATION_CONTRACT_FAIL,
  payload: error,
});

// Vehicles
export const getTransportationVehicles = (companyId, params) => ({
  type: t.GET_TRANSPORTATION_VEHICLES,
  payload: { companyId, params },
});
export const getTransportationVehiclesSuccess = (data) => ({
  type: t.GET_TRANSPORTATION_VEHICLES_SUCCESS,
  payload: data,
});
export const getTransportationVehiclesFail = (error) => ({
  type: t.GET_TRANSPORTATION_VEHICLES_FAIL,
  payload: error,
});

export const createTransportationVehicle = (companyId, data) => ({
  type: t.CREATE_TRANSPORTATION_VEHICLE,
  payload: { companyId, data },
});
export const createTransportationVehicleSuccess = (data) => ({
  type: t.CREATE_TRANSPORTATION_VEHICLE_SUCCESS,
  payload: data,
});
export const createTransportationVehicleFail = (error) => ({
  type: t.CREATE_TRANSPORTATION_VEHICLE_FAIL,
  payload: error,
});

export const updateTransportationVehicle = (vehicleId, data, companyId) => ({
  type: t.UPDATE_TRANSPORTATION_VEHICLE,
  payload: { vehicleId, data, companyId },
});
export const updateTransportationVehicleSuccess = (data) => ({
  type: t.UPDATE_TRANSPORTATION_VEHICLE_SUCCESS,
  payload: data,
});
export const updateTransportationVehicleFail = (error) => ({
  type: t.UPDATE_TRANSPORTATION_VEHICLE_FAIL,
  payload: error,
});

export const deleteTransportationVehicle = (vehicleId, companyId) => ({
  type: t.DELETE_TRANSPORTATION_VEHICLE,
  payload: { vehicleId, companyId },
});
export const deleteTransportationVehicleSuccess = (data) => ({
  type: t.DELETE_TRANSPORTATION_VEHICLE_SUCCESS,
  payload: data,
});
export const deleteTransportationVehicleFail = (error) => ({
  type: t.DELETE_TRANSPORTATION_VEHICLE_FAIL,
  payload: error,
});

// UI
export const clearTransportationMessages = () => ({
  type: t.CLEAR_TRANSPORTATION_MESSAGES,
});
