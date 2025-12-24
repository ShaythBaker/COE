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
  GET_HOTEL_CONTRACT_RATES,
  GET_HOTEL_CONTRACT_RATES_SUCCESS,
  GET_HOTEL_CONTRACT_RATES_FAIL,
  CREATE_HOTEL_CONTRACT_RATE_SUCCESS,
  UPDATE_HOTEL_CONTRACT_RATE_SUCCESS,
  DELETE_HOTEL_CONTRACT_RATE_SUCCESS,
  CREATE_HOTEL_CONTRACT_RATE_FAIL,
  UPDATE_HOTEL_CONTRACT_RATE_FAIL,
  DELETE_HOTEL_CONTRACT_RATE_FAIL,
  CLEAR_HOTEL_SEASON_MESSAGES,
  GET_HOTEL_SEASONS,
  GET_HOTEL_SEASONS_SUCCESS,
  GET_HOTEL_SEASONS_FAIL,
  CREATE_HOTEL_SEASON_SUCCESS,
  CREATE_HOTEL_SEASON_FAIL,
  UPDATE_HOTEL_SEASON_SUCCESS,
  UPDATE_HOTEL_SEASON_FAIL,
  DELETE_HOTEL_SEASON_SUCCESS,
  DELETE_HOTEL_SEASON_FAIL,
  GET_HOTEL_SEASONS_WITH_RATES,
  GET_HOTEL_SEASONS_WITH_RATES_SUCCESS,
  GET_HOTEL_SEASONS_WITH_RATES_FAIL,
} from "./actionTypes";

const initialState = {
  hotels: [],
  loadingHotels: false,
  hotelsError: null,

  hotelContracts: [],
  loadingHotelContracts: false,
  hotelContractsError: null,

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

  lastFilters: {
    ACTIVE_STATUS: "",
    HOTEL_AREA: "",
    HOTEL_STARS: "",
  },
};

const hotels = (state = initialState, action) => {
  switch (action.type) {
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

    // CONTRACTS
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
      };

    case GET_HOTEL_CONTRACTS_FAIL:
      return {
        ...state,
        loadingHotelContracts: false,
        hotelContractsError: action.payload,
      };

    case CREATE_HOTEL_CONTRACT_SUCCESS:
    case UPDATE_HOTEL_CONTRACT_SUCCESS:
    case DELETE_HOTEL_CONTRACT_SUCCESS:
      return {
        ...state,
        hotelContractsError: null,
      };

    case CREATE_HOTEL_CONTRACT_FAIL:
    case UPDATE_HOTEL_CONTRACT_FAIL:
    case DELETE_HOTEL_CONTRACT_FAIL:
      return {
        ...state,
        hotelContractsError: action.payload,
      };

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
        hotelContractRatesError: null,
      };

    case CREATE_HOTEL_CONTRACT_RATE_FAIL:
    case UPDATE_HOTEL_CONTRACT_RATE_FAIL:
    case DELETE_HOTEL_CONTRACT_RATE_FAIL:
      return {
        ...state,
        hotelContractRatesError: action.payload,
      };

    case CLEAR_HOTEL_SEASON_MESSAGES:
      return {
        ...state,
        seasonSuccessMessage: null,
        seasonsError: null,
        seasonsWithRatesError: null,
      };

    case GET_HOTEL_SEASONS:
      return { ...state, loadingSeasons: true, seasonsError: null };
    case GET_HOTEL_SEASONS_SUCCESS:
      return { ...state, loadingSeasons: false, seasons: action.payload || [] };
    case GET_HOTEL_SEASONS_FAIL:
      return { ...state, loadingSeasons: false, seasonsError: action.payload };

    case CREATE_HOTEL_SEASON_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Created",
      };
    case CREATE_HOTEL_SEASON_FAIL:
      return { ...state, seasonsError: action.payload };

    case UPDATE_HOTEL_SEASON_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: action.payload?.message || "Updated",
      };
    case UPDATE_HOTEL_SEASON_FAIL:
      return { ...state, seasonsError: action.payload };

    case DELETE_HOTEL_SEASON_SUCCESS:
      return {
        ...state,
        seasonSuccessMessage: "Deleted",
        seasons: (state.seasons || []).filter(
          (s) => String(s.SEASON_ID) !== String(action.payload)
        ),
      };
    case DELETE_HOTEL_SEASON_FAIL:
      return { ...state, seasonsError: action.payload };

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
        seasonsWithRates: action.payload,
      };
    case GET_HOTEL_SEASONS_WITH_RATES_FAIL:
      return {
        ...state,
        loadingSeasonsWithRates: false,
        seasonsWithRatesError: action.payload,
      };

    default:
      return state;
  }
};

export default hotels;
