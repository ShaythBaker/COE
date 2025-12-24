import {
  GET_HOTELS,
  GET_HOTELS_SUCCESS,
  GET_HOTELS_FAIL,
  GET_HOTEL_CONTRACTS,
  GET_HOTEL_CONTRACTS_SUCCESS,
  GET_HOTEL_CONTRACTS_FAIL,
  CREATE_HOTEL_CONTRACT,
  UPDATE_HOTEL_CONTRACT,
  DELETE_HOTEL_CONTRACT,
  GET_HOTEL_CONTRACT_RATES,
  GET_HOTEL_CONTRACT_RATES_SUCCESS,
  GET_HOTEL_CONTRACT_RATES_FAIL,
  CREATE_HOTEL_CONTRACT_RATE,
  UPDATE_HOTEL_CONTRACT_RATE,
  DELETE_HOTEL_CONTRACT_RATE,
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
  GET_HOTEL_SEASONS_WITH_RATES,
  GET_HOTEL_SEASONS_WITH_RATES_SUCCESS,
  GET_HOTEL_SEASONS_WITH_RATES_FAIL,
  CLEAR_HOTEL_SEASON_MESSAGES,
} from "./actionTypes";
// filters is an optional object: { ACTIVE_STATUS, HOTEL_AREA, HOTEL_STARS }
export const getHotels = (filters = {}) => ({
  type: GET_HOTELS,
  payload: filters,
});

export const getHotelsSuccess = (hotels) => ({
  type: GET_HOTELS_SUCCESS,
  payload: hotels,
});

export const getHotelsFail = (error) => ({
  type: GET_HOTELS_FAIL,
  payload: error,
});

// LIST
export const getHotelContracts = (hotelId) => ({
  type: GET_HOTEL_CONTRACTS,
  payload: { hotelId },
});

export const getHotelContractsSuccess = (contracts) => ({
  type: GET_HOTEL_CONTRACTS_SUCCESS,
  payload: contracts,
});

export const getHotelContractsFail = (error) => ({
  type: GET_HOTEL_CONTRACTS_FAIL,
  payload: error,
});

// CREATE
export const createHotelContract = (hotelId, data) => ({
  type: CREATE_HOTEL_CONTRACT,
  payload: { hotelId, data },
});

// UPDATE
export const updateHotelContract = (hotelId, contractId, data) => ({
  type: UPDATE_HOTEL_CONTRACT,
  payload: { hotelId, contractId, data },
});

// DELETE
export const deleteHotelContract = (hotelId, contractId) => ({
  type: DELETE_HOTEL_CONTRACT,
  payload: { hotelId, contractId },
});

// LIST rates
export const getHotelContractRates = (hotelId, contractId) => ({
  type: GET_HOTEL_CONTRACT_RATES,
  payload: { hotelId, contractId },
});

export const getHotelContractRatesSuccess = (rates) => ({
  type: GET_HOTEL_CONTRACT_RATES_SUCCESS,
  payload: rates,
});

export const getHotelContractRatesFail = (error) => ({
  type: GET_HOTEL_CONTRACT_RATES_FAIL,
  payload: error,
});

// CREATE rate
export const createHotelContractRate = (hotelId, contractId, data) => ({
  type: CREATE_HOTEL_CONTRACT_RATE,
  payload: { hotelId, contractId, data },
});

// UPDATE rate
export const updateHotelContractRate = (hotelId, contractId, rateId, data) => ({
  type: UPDATE_HOTEL_CONTRACT_RATE,
  payload: { hotelId, contractId, rateId, data },
});

// DELETE rate
export const deleteHotelContractRate = (hotelId, contractId, rateId) => ({
  type: DELETE_HOTEL_CONTRACT_RATE,
  payload: { hotelId, contractId, rateId },
});

// -------------------- Hotel Seasons --------------------
export const getHotelSeasons = (hotelId) => ({
  type: GET_HOTEL_SEASONS,
  payload: { hotelId },
});
export const getHotelSeasonsSuccess = (items) => ({
  type: GET_HOTEL_SEASONS_SUCCESS,
  payload: items,
});
export const getHotelSeasonsFail = (error) => ({
  type: GET_HOTEL_SEASONS_FAIL,
  payload: error,
});

export const createHotelSeason = (hotelId, data) => ({
  type: CREATE_HOTEL_SEASON,
  payload: { hotelId, data },
});
export const createHotelSeasonSuccess = (res) => ({
  type: CREATE_HOTEL_SEASON_SUCCESS,
  payload: res,
});
export const createHotelSeasonFail = (error) => ({
  type: CREATE_HOTEL_SEASON_FAIL,
  payload: error,
});

export const updateHotelSeason = (hotelId, seasonId, data) => ({
  type: UPDATE_HOTEL_SEASON,
  payload: { hotelId, seasonId, data },
});
export const updateHotelSeasonSuccess = (res) => ({
  type: UPDATE_HOTEL_SEASON_SUCCESS,
  payload: res,
});
export const updateHotelSeasonFail = (error) => ({
  type: UPDATE_HOTEL_SEASON_FAIL,
  payload: error,
});

export const deleteHotelSeason = (hotelId, seasonId) => ({
  type: DELETE_HOTEL_SEASON,
  payload: { hotelId, seasonId },
});
export const deleteHotelSeasonSuccess = (seasonId) => ({
  type: DELETE_HOTEL_SEASON_SUCCESS,
  payload: seasonId,
});
export const deleteHotelSeasonFail = (error) => ({
  type: DELETE_HOTEL_SEASON_FAIL,
  payload: error,
});

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

export const clearHotelSeasonMessages = () => ({
  type: CLEAR_HOTEL_SEASON_MESSAGES,
});
