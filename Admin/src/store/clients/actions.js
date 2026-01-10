import * as types from "./actionTypes";

export const getClients = (activeStatus) => ({
  type: types.GET_CLIENTS,
  payload: { activeStatus },
});
export const getClientsSuccess = (items) => ({
  type: types.GET_CLIENTS_SUCCESS,
  payload: items,
});
export const getClientsFail = (error) => ({
  type: types.GET_CLIENTS_FAIL,
  payload: error,
});

export const getClient = (clientId) => ({
  type: types.GET_CLIENT,
  payload: { clientId },
});
export const getClientSuccess = (item) => ({
  type: types.GET_CLIENT_SUCCESS,
  payload: item,
});
export const getClientFail = (error) => ({
  type: types.GET_CLIENT_FAIL,
  payload: error,
});

export const createClient = (data) => ({
  type: types.CREATE_CLIENT,
  payload: { data },
});
export const createClientSuccess = (res) => ({
  type: types.CREATE_CLIENT_SUCCESS,
  payload: res,
});
export const createClientFail = (error) => ({
  type: types.CREATE_CLIENT_FAIL,
  payload: error,
});

export const updateClient = (clientId, data) => ({
  type: types.UPDATE_CLIENT,
  payload: { clientId, data },
});
export const updateClientSuccess = (res) => ({
  type: types.UPDATE_CLIENT_SUCCESS,
  payload: res,
});
export const updateClientFail = (error) => ({
  type: types.UPDATE_CLIENT_FAIL,
  payload: error,
});

export const deleteClient = (clientId) => ({
  type: types.DELETE_CLIENT,
  payload: { clientId },
});
export const deleteClientSuccess = (res) => ({
  type: types.DELETE_CLIENT_SUCCESS,
  payload: res,
});
export const deleteClientFail = (error) => ({
  type: types.DELETE_CLIENT_FAIL,
  payload: error,
});

export const getCountries = () => ({ type: types.GET_COUNTRIES });
export const getCountriesSuccess = (items) => ({
  type: types.GET_COUNTRIES_SUCCESS,
  payload: items,
});
export const getCountriesFail = (error) => ({
  type: types.GET_COUNTRIES_FAIL,
  payload: error,
});

export const clearClientsMessages = () => ({
  type: types.CLEAR_CLIENTS_MESSAGES,
});
