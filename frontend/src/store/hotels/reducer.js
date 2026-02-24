// src/store/hotels/reducer.js
import {
  GET_HOTELS,
  GET_HOTELS_SUCCESS,
  GET_HOTELS_FAIL,
  GET_HOTEL_CONTRACTS,
  GET_HOTEL_CONTRACTS_SUCCESS,
  GET_HOTEL_CONTRACTS_FAIL,
  CREATE_HOTEL_CONTRACT_SUCCESS,
  UPDATE_HOTEL_CONTRACT_SUCCESS,
  DELETE_HOTEL_CONTRACT_SUCCESS,
  CREATE_HOTEL_CONTRACT_FAIL,
  UPDATE_HOTEL_CONTRACT_FAIL,
  DELETE_HOTEL_CONTRACT_FAIL,

  // Contract rates (deprecated)
  GET_HOTEL_CONTRACT_RATES,
  GET_HOTEL_CONTRACT_RATES_SUCCESS,
  GET_HOTEL_CONTRACT_RATES_FAIL,
  CREATE_HOTEL_CONTRACT_RATE_SUCCESS,
  UPDATE_HOTEL_CONTRACT_RATE_SUCCESS,
  DELETE_HOTEL_CONTRACT_RATE_SUCCESS,
  CREATE_HOTEL_CONTRACT_RATE_FAIL,
  UPDATE_HOTEL_CONTRACT_RATE_FAIL,
  DELETE_HOTEL_CONTRACT_RATE_FAIL,

  // Seasons
  GET_HOTEL_SEASONS,
  GET_HOTEL_SEASONS_SUCCESS,
  GET_HOTEL_SEASONS_FAIL,
  CREATE_HOTEL_SEASON_SUCCESS,
  UPDATE_HOTEL_SEASON_SUCCESS,
  DELETE_HOTEL_SEASON_SUCCESS,
  CREATE_HOTEL_SEASON_FAIL,
  UPDATE_HOTEL_SEASON_FAIL,
  DELETE_HOTEL_SEASON_FAIL,

  // Pricing
  GET_HOTEL_SEASONS_WITH_RATES,
  GET_HOTEL_SEASONS_WITH_RATES_SUCCESS,
  GET_HOTEL_SEASONS_WITH_RATES_FAIL,

  // NEW season rates
  CREATE_HOTEL_SEASON_RATE_SUCCESS,
  UPDATE_HOTEL_SEASON_RATE_SUCCESS,
  DELETE_HOTEL_SEASON_RATE_SUCCESS,
  CREATE_HOTEL_SEASON_RATE_FAIL,
  UPDATE_HOTEL_SEASON_RATE_FAIL,
  DELETE_HOTEL_SEASON_RATE_FAIL,
  CLEAR_HOTEL_SEASON_MESSAGES,

  // Additional Services
  GET_HOTEL_ADDITIONAL_SERVICES,
  GET_HOTEL_ADDITIONAL_SERVICES_SUCCESS,
  GET_HOTEL_ADDITIONAL_SERVICES_FAIL,
  CREATE_HOTEL_ADDITIONAL_SERVICE_SUCCESS,
  UPDATE_HOTEL_ADDITIONAL_SERVICE_SUCCESS,
  DELETE_HOTEL_ADDITIONAL_SERVICE_SUCCESS,
  CREATE_HOTEL_ADDITIONAL_SERVICE_FAIL,
  UPDATE_HOTEL_ADDITIONAL_SERVICE_FAIL,
  DELETE_HOTEL_ADDITIONAL_SERVICE_FAIL,


} from "./actionTypes";

const initialState = {
  hotels: [],
  loadingHotels: false,
  hotelsError: null,

  hotelContracts: [],
  loadingHotelContracts: false,
  hotelContractsError: null,

  // Deprecated
  hotelContractRates: [],
  loadingHotelContractRates: false,
  hotelContractRatesError: null,

  seasons: [],
  loadingSeasons: false,
  seasonsError: null,

  seasonsWithRates: null,
  loadingSeasonsWithRates: false,
  seasonsWithRatesError: null,

  seasonSuccessMessage: null,
  seasonRateError: null,

  additionalServices: [],
  loadingAdditionalServices: false,
  additionalServicesError: null,

  lastFilters: {
    ACTIVE_STATUS: "",
    HOTEL_AREA: "",
    HOTEL_STARS: "",
  },
};

const hotels = (state = initialState, action) => {
  switch (action.type) {
    // --------------------
    // HOTELS LIST
    // --------------------
    case GET_HOTELS:
      return {
        ...state,
        loadingHotels: true,
        hotelsError: null,
        lastFilters: action.payload || {},
      };

    case GET_HOTELS_SUCCESS:
      return {
        ...state,
        loadingHotels: false,
        hotels: action.payload || [],
        hotelsError: null,
      };

    case GET_HOTELS_FAIL:
      return {
        ...state,
        loadingHotels: false,
        hotelsError: action.payload,
      };

    // --------------------
    // CONTRACTS
    // --------------------
    case GET_HOTEL_CONTRACTS:
      return {
        ...state,
        loadingHotelContracts: true,
        hotelContractsError: null,
      };

    case GET_HOTEL_CONTRACTS_SUCCESS:
      return {
        ...state,
        loadingHotelContracts: false,
        hotelContracts: action.payload || [],
        hotelContractsError: null,
      };

    case GET_HOTEL_CONTRACTS_FAIL:
      return {
        ...state,
        loadingHotelContracts: false,
        hotelContractsError: action.payload,
      };

    case CREATE_HOTEL_CONTRACT_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Contract created",
      };

    case UPDATE_HOTEL_CONTRACT_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Contract updated",
      };

    case DELETE_HOTEL_CONTRACT_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Contract deleted",
      };

    case CREATE_HOTEL_CONTRACT_FAIL:
    case UPDATE_HOTEL_CONTRACT_FAIL:
    case DELETE_HOTEL_CONTRACT_FAIL:
      return {
        ...state,
        hotelContractsError: action.payload,
      };

    // --------------------
    // CONTRACT RATES (deprecated)
    // --------------------
    case GET_HOTEL_CONTRACT_RATES:
      return {
        ...state,
        loadingHotelContractRates: true,
        hotelContractRatesError: null,
      };

    case GET_HOTEL_CONTRACT_RATES_SUCCESS:
      return {
        ...state,
        loadingHotelContractRates: false,
        hotelContractRates: action.payload || [],
        hotelContractRatesError: null,
      };

    case GET_HOTEL_CONTRACT_RATES_FAIL:
      return {
        ...state,
        loadingHotelContractRates: false,
        hotelContractRatesError: action.payload,
      };

    case CREATE_HOTEL_CONTRACT_RATE_SUCCESS:
    case UPDATE_HOTEL_CONTRACT_RATE_SUCCESS:
    case DELETE_HOTEL_CONTRACT_RATE_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Rate updated",
      };

    case CREATE_HOTEL_CONTRACT_RATE_FAIL:
    case UPDATE_HOTEL_CONTRACT_RATE_FAIL:
    case DELETE_HOTEL_CONTRACT_RATE_FAIL:
      return {
        ...state,
        hotelContractRatesError: action.payload,
      };

    // --------------------
    // SEASONS
    // --------------------
    case GET_HOTEL_SEASONS:
      return {
        ...state,
        loadingSeasons: true,
        seasonsError: null,
      };

    case GET_HOTEL_SEASONS_SUCCESS:
      return {
        ...state,
        loadingSeasons: false,
        seasons: action.payload || [],
        seasonsError: null,
      };

    case GET_HOTEL_SEASONS_FAIL:
      return {
        ...state,
        loadingSeasons: false,
        seasonsError: action.payload,
      };

    case CREATE_HOTEL_SEASON_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Season created",
      };

    case UPDATE_HOTEL_SEASON_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Season updated",
      };

    case DELETE_HOTEL_SEASON_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Season deleted",
      };

    case CREATE_HOTEL_SEASON_FAIL:
    case UPDATE_HOTEL_SEASON_FAIL:
    case DELETE_HOTEL_SEASON_FAIL:
      return {
        ...state,
        seasonsError: action.payload,
      };

    // --------------------
    // PRICING (seasons with nested rates)
    // --------------------
    case GET_HOTEL_SEASONS_WITH_RATES:
      return {
        ...state,
        loadingSeasonsWithRates: true,
        seasonsWithRatesError: null,
      };

    case GET_HOTEL_SEASONS_WITH_RATES_SUCCESS:
      return {
        ...state,
        loadingSeasonsWithRates: false,
        seasonsWithRates: action.payload || null,
        seasonsWithRatesError: null,
      };

    case GET_HOTEL_SEASONS_WITH_RATES_FAIL:
      return {
        ...state,
        loadingSeasonsWithRates: false,
        seasonsWithRatesError: action.payload,
      };

    // --------------------
    // NEW: season rates messages/errors (data refresh handled by re-fetch pricing)
    // --------------------
    case CREATE_HOTEL_SEASON_RATE_SUCCESS:
    case UPDATE_HOTEL_SEASON_RATE_SUCCESS:
    case DELETE_HOTEL_SEASON_RATE_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Season rate updated",
        seasonRateError: null,
      };

    case CREATE_HOTEL_SEASON_RATE_FAIL:
    case UPDATE_HOTEL_SEASON_RATE_FAIL:
    case DELETE_HOTEL_SEASON_RATE_FAIL:
      return {
        ...state,
        seasonRateError: action.payload,
      };

    // --------------------
    case CLEAR_HOTEL_SEASON_MESSAGES:
      return {
        ...state,
        seasonSuccessMessage: null,
        seasonsError: null,
        seasonsWithRatesError: null,
        seasonRateError: null,
      };

    // --------------------
    // ADDITIONAL SERVICES
    // --------------------
    case GET_HOTEL_ADDITIONAL_SERVICES:
      return {
        ...state,
        loadingAdditionalServices: true,
        additionalServicesError: null,
      };

    case GET_HOTEL_ADDITIONAL_SERVICES_SUCCESS:
      return {
        ...state,
        loadingAdditionalServices: false,
        additionalServices: action.payload || [],
        additionalServicesError: null,
      };

    case GET_HOTEL_ADDITIONAL_SERVICES_FAIL:
      return {
        ...state,
        loadingAdditionalServices: false,
        additionalServicesError: action.payload,
      };

    case CREATE_HOTEL_ADDITIONAL_SERVICE_SUCCESS:
    case UPDATE_HOTEL_ADDITIONAL_SERVICE_SUCCESS:
    case DELETE_HOTEL_ADDITIONAL_SERVICE_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage:
          action.payload?.message || "Additional service updated",
      };

    case CREATE_HOTEL_ADDITIONAL_SERVICE_FAIL:
    case UPDATE_HOTEL_ADDITIONAL_SERVICE_FAIL:
    case DELETE_HOTEL_ADDITIONAL_SERVICE_FAIL:
      return {
        ...state,
        additionalServicesError: action.payload,
      };

    default:
      return state;
  }
};

export default hotels;
