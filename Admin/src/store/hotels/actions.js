// src/store/hotels/actions.js
import {
  GET_HOTELS,
  GET_HOTELS_SUCCESS,
  GET_HOTELS_FAIL,

  GET_HOTEL_CONTRACTS,
  GET_HOTEL_CONTRACTS_SUCCESS,
  GET_HOTEL_CONTRACTS_FAIL,

  CREATE_HOTEL_CONTRACT,
  CREATE_HOTEL_CONTRACT_SUCCESS,
  CREATE_HOTEL_CONTRACT_FAIL,

  UPDATE_HOTEL_CONTRACT,
  UPDATE_HOTEL_CONTRACT_SUCCESS,
  UPDATE_HOTEL_CONTRACT_FAIL,

  DELETE_HOTEL_CONTRACT,
  DELETE_HOTEL_CONTRACT_SUCCESS,
  DELETE_HOTEL_CONTRACT_FAIL,

  // Contract rates (deprecated)
  GET_HOTEL_CONTRACT_RATES,
  GET_HOTEL_CONTRACT_RATES_SUCCESS,
  GET_HOTEL_CONTRACT_RATES_FAIL,

  CREATE_HOTEL_CONTRACT_RATE,
  CREATE_HOTEL_CONTRACT_RATE_SUCCESS,
  CREATE_HOTEL_CONTRACT_RATE_FAIL,

  UPDATE_HOTEL_CONTRACT_RATE,
  UPDATE_HOTEL_CONTRACT_RATE_SUCCESS,
  UPDATE_HOTEL_CONTRACT_RATE_FAIL,

  DELETE_HOTEL_CONTRACT_RATE,
  DELETE_HOTEL_CONTRACT_RATE_SUCCESS,
  DELETE_HOTEL_CONTRACT_RATE_FAIL,

  // Seasons
  GET_HOTEL_SEASONS,
  GET_HOTEL_SEASONS_SUCCESS,
  GET_HOTEL_SEASONS_FAIL,

  CREATE_HOTEL_SEASON,
  CREATE_HOTEL_SEASON_SUCCESS,
  CREATE_HOTEL_SEASON_FAIL,

  UPDATE_HOTEL_SEASON,
  UPDATE_HOTEL_SEASON_SUCCESS,
  UPDATE_HOTEL_SEASON_FAIL,

  DELETE_HOTEL_SEASON,
  DELETE_HOTEL_SEASON_SUCCESS,
  DELETE_HOTEL_SEASON_FAIL,

  // Pricing
  GET_HOTEL_SEASONS_WITH_RATES,
  GET_HOTEL_SEASONS_WITH_RATES_SUCCESS,
  GET_HOTEL_SEASONS_WITH_RATES_FAIL,

  // NEW Season rates
  CREATE_HOTEL_SEASON_RATE,
  CREATE_HOTEL_SEASON_RATE_SUCCESS,
  CREATE_HOTEL_SEASON_RATE_FAIL,

  UPDATE_HOTEL_SEASON_RATE,
  UPDATE_HOTEL_SEASON_RATE_SUCCESS,
  UPDATE_HOTEL_SEASON_RATE_FAIL,

  DELETE_HOTEL_SEASON_RATE,
  DELETE_HOTEL_SEASON_RATE_SUCCESS,
  DELETE_HOTEL_SEASON_RATE_FAIL,

  CLEAR_HOTEL_SEASON_MESSAGES,

   // Additional Services
  GET_HOTEL_ADDITIONAL_SERVICES,
  GET_HOTEL_ADDITIONAL_SERVICES_SUCCESS,
  GET_HOTEL_ADDITIONAL_SERVICES_FAIL,

  CREATE_HOTEL_ADDITIONAL_SERVICE,
  CREATE_HOTEL_ADDITIONAL_SERVICE_SUCCESS,
  CREATE_HOTEL_ADDITIONAL_SERVICE_FAIL,

  UPDATE_HOTEL_ADDITIONAL_SERVICE,
  UPDATE_HOTEL_ADDITIONAL_SERVICE_SUCCESS,
  UPDATE_HOTEL_ADDITIONAL_SERVICE_FAIL,

  DELETE_HOTEL_ADDITIONAL_SERVICE,
  DELETE_HOTEL_ADDITIONAL_SERVICE_SUCCESS,
  DELETE_HOTEL_ADDITIONAL_SERVICE_FAIL,
} from "./actionTypes";

// --------------------
// Hotels list
// --------------------
export const getHotels = (filters) => ({
  type: GET_HOTELS,
  payload: filters,
});

export const getHotelsSuccess = (payload) => ({
  type: GET_HOTELS_SUCCESS,
  payload,
});

export const getHotelsFail = (error) => ({
  type: GET_HOTELS_FAIL,
  payload: error,
});

// --------------------
// Contracts
// --------------------
export const getHotelContracts = (hotelId) => ({
  type: GET_HOTEL_CONTRACTS,
  payload: { hotelId },
});

export const getHotelContractsSuccess = (payload) => ({
  type: GET_HOTEL_CONTRACTS_SUCCESS,
  payload,
});

export const getHotelContractsFail = (error) => ({
  type: GET_HOTEL_CONTRACTS_FAIL,
  payload: error,
});

export const createHotelContract = (hotelId, data) => ({
  type: CREATE_HOTEL_CONTRACT,
  payload: { hotelId, data },
});

export const createHotelContractSuccess = (payload) => ({
  type: CREATE_HOTEL_CONTRACT_SUCCESS,
  payload,
});

export const createHotelContractFail = (error) => ({
  type: CREATE_HOTEL_CONTRACT_FAIL,
  payload: error,
});

export const updateHotelContract = (hotelId, contractId, data) => ({
  type: UPDATE_HOTEL_CONTRACT,
  payload: { hotelId, contractId, data },
});

export const updateHotelContractSuccess = (payload) => ({
  type: UPDATE_HOTEL_CONTRACT_SUCCESS,
  payload,
});

export const updateHotelContractFail = (error) => ({
  type: UPDATE_HOTEL_CONTRACT_FAIL,
  payload: error,
});

export const deleteHotelContract = (hotelId, contractId) => ({
  type: DELETE_HOTEL_CONTRACT,
  payload: { hotelId, contractId },
});

export const deleteHotelContractSuccess = (payload) => ({
  type: DELETE_HOTEL_CONTRACT_SUCCESS,
  payload,
});

export const deleteHotelContractFail = (error) => ({
  type: DELETE_HOTEL_CONTRACT_FAIL,
  payload: error,
});

// --------------------
// Contract rates (deprecated - kept for backward compatibility)
// --------------------
export const getHotelContractRates = (hotelId, contractId) => ({
  type: GET_HOTEL_CONTRACT_RATES,
  payload: { hotelId, contractId },
});

export const getHotelContractRatesSuccess = (payload) => ({
  type: GET_HOTEL_CONTRACT_RATES_SUCCESS,
  payload,
});

export const getHotelContractRatesFail = (error) => ({
  type: GET_HOTEL_CONTRACT_RATES_FAIL,
  payload: error,
});

export const createHotelContractRate = (hotelId, contractId, data) => ({
  type: CREATE_HOTEL_CONTRACT_RATE,
  payload: { hotelId, contractId, data },
});

export const createHotelContractRateSuccess = (payload) => ({
  type: CREATE_HOTEL_CONTRACT_RATE_SUCCESS,
  payload,
});

export const createHotelContractRateFail = (error) => ({
  type: CREATE_HOTEL_CONTRACT_RATE_FAIL,
  payload: error,
});

export const updateHotelContractRate = (hotelId, contractId, rateId, data) => ({
  type: UPDATE_HOTEL_CONTRACT_RATE,
  payload: { hotelId, contractId, rateId, data },
});

export const updateHotelContractRateSuccess = (payload) => ({
  type: UPDATE_HOTEL_CONTRACT_RATE_SUCCESS,
  payload,
});

export const updateHotelContractRateFail = (error) => ({
  type: UPDATE_HOTEL_CONTRACT_RATE_FAIL,
  payload: error,
});

export const deleteHotelContractRate = (hotelId, contractId, rateId) => ({
  type: DELETE_HOTEL_CONTRACT_RATE,
  payload: { hotelId, contractId, rateId },
});

export const deleteHotelContractRateSuccess = (payload) => ({
  type: DELETE_HOTEL_CONTRACT_RATE_SUCCESS,
  payload,
});

export const deleteHotelContractRateFail = (error) => ({
  type: DELETE_HOTEL_CONTRACT_RATE_FAIL,
  payload: error,
});

// --------------------
// Seasons
// --------------------
export const getHotelSeasons = (hotelId) => ({
  type: GET_HOTEL_SEASONS,
  payload: { hotelId },
});

export const getHotelSeasonsSuccess = (payload) => ({
  type: GET_HOTEL_SEASONS_SUCCESS,
  payload,
});

export const getHotelSeasonsFail = (error) => ({
  type: GET_HOTEL_SEASONS_FAIL,
  payload: error,
});

export const createHotelSeason = (hotelId, data) => ({
  type: CREATE_HOTEL_SEASON,
  payload: { hotelId, data },
});

export const createHotelSeasonSuccess = (payload) => ({
  type: CREATE_HOTEL_SEASON_SUCCESS,
  payload,
});

export const createHotelSeasonFail = (error) => ({
  type: CREATE_HOTEL_SEASON_FAIL,
  payload: error,
});

export const updateHotelSeason = (hotelId, seasonId, data) => ({
  type: UPDATE_HOTEL_SEASON,
  payload: { hotelId, seasonId, data },
});

export const updateHotelSeasonSuccess = (payload) => ({
  type: UPDATE_HOTEL_SEASON_SUCCESS,
  payload,
});

export const updateHotelSeasonFail = (error) => ({
  type: UPDATE_HOTEL_SEASON_FAIL,
  payload: error,
});

export const deleteHotelSeason = (hotelId, seasonId) => ({
  type: DELETE_HOTEL_SEASON,
  payload: { hotelId, seasonId },
});

export const deleteHotelSeasonSuccess = (payload) => ({
  type: DELETE_HOTEL_SEASON_SUCCESS,
  payload,
});

export const deleteHotelSeasonFail = (error) => ({
  type: DELETE_HOTEL_SEASON_FAIL,
  payload: error,
});

// --------------------
// Pricing (seasons with rates)
// --------------------
export const getHotelSeasonsWithRates = (hotelId) => ({
  type: GET_HOTEL_SEASONS_WITH_RATES,
  payload: { hotelId },
});

export const getHotelSeasonsWithRatesSuccess = (payload) => ({
  type: GET_HOTEL_SEASONS_WITH_RATES_SUCCESS,
  payload,
});

export const getHotelSeasonsWithRatesFail = (error) => ({
  type: GET_HOTEL_SEASONS_WITH_RATES_FAIL,
  payload: error,
});

// --------------------
// NEW: Season rates (CRUD)
// --------------------
export const createHotelSeasonRate = (hotelId, seasonId, data) => ({
  type: CREATE_HOTEL_SEASON_RATE,
  payload: { hotelId, seasonId, data },
});

export const createHotelSeasonRateSuccess = (payload) => ({
  type: CREATE_HOTEL_SEASON_RATE_SUCCESS,
  payload,
});

export const createHotelSeasonRateFail = (error) => ({
  type: CREATE_HOTEL_SEASON_RATE_FAIL,
  payload: error,
});

export const updateHotelSeasonRate = (hotelId, seasonId, rateId, data) => ({
  type: UPDATE_HOTEL_SEASON_RATE,
  payload: { hotelId, seasonId, rateId, data },
});

export const updateHotelSeasonRateSuccess = (payload) => ({
  type: UPDATE_HOTEL_SEASON_RATE_SUCCESS,
  payload,
});

export const updateHotelSeasonRateFail = (error) => ({
  type: UPDATE_HOTEL_SEASON_RATE_FAIL,
  payload: error,
});

export const deleteHotelSeasonRate = (hotelId, seasonId, rateId) => ({
  type: DELETE_HOTEL_SEASON_RATE,
  payload: { hotelId, seasonId, rateId },
});

export const deleteHotelSeasonRateSuccess = (payload) => ({
  type: DELETE_HOTEL_SEASON_RATE_SUCCESS,
  payload,
});

export const deleteHotelSeasonRateFail = (error) => ({
  type: DELETE_HOTEL_SEASON_RATE_FAIL,
  payload: error,
});

// --------------------
export const clearHotelSeasonMessages = () => ({
  type: CLEAR_HOTEL_SEASON_MESSAGES,
});


// --------------------
// Additional Services
// --------------------
export const getHotelAdditionalServices = (hotelId) => ({
  type: GET_HOTEL_ADDITIONAL_SERVICES,
  payload: { hotelId },
});

export const getHotelAdditionalServicesSuccess = (payload) => ({
  type: GET_HOTEL_ADDITIONAL_SERVICES_SUCCESS,
  payload,
});

export const getHotelAdditionalServicesFail = (error) => ({
  type: GET_HOTEL_ADDITIONAL_SERVICES_FAIL,
  payload: error,
});

export const createHotelAdditionalService = (hotelId, data) => ({
  type: CREATE_HOTEL_ADDITIONAL_SERVICE,
  payload: { hotelId, data },
});

export const createHotelAdditionalServiceSuccess = (payload) => ({
  type: CREATE_HOTEL_ADDITIONAL_SERVICE_SUCCESS,
  payload,
});

export const createHotelAdditionalServiceFail = (error) => ({
  type: CREATE_HOTEL_ADDITIONAL_SERVICE_FAIL,
  payload: error,
});

export const updateHotelAdditionalService = (hotelId, additionalServiceId, data) => ({
  type: UPDATE_HOTEL_ADDITIONAL_SERVICE,
  payload: { hotelId, additionalServiceId, data },
});

export const updateHotelAdditionalServiceSuccess = (payload) => ({
  type: UPDATE_HOTEL_ADDITIONAL_SERVICE_SUCCESS,
  payload,
});

export const updateHotelAdditionalServiceFail = (error) => ({
  type: UPDATE_HOTEL_ADDITIONAL_SERVICE_FAIL,
  payload: error,
});

export const deleteHotelAdditionalService = (hotelId, additionalServiceId) => ({
  type: DELETE_HOTEL_ADDITIONAL_SERVICE,
  payload: { hotelId, additionalServiceId },
});

export const deleteHotelAdditionalServiceSuccess = (payload) => ({
  type: DELETE_HOTEL_ADDITIONAL_SERVICE_SUCCESS,
  payload,
});

export const deleteHotelAdditionalServiceFail = (error) => ({
  type: DELETE_HOTEL_ADDITIONAL_SERVICE_FAIL,
  payload: error,
});
