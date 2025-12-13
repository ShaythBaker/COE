import {
  GET_HOTELS,
  GET_HOTELS_SUCCESS,
  GET_HOTELS_FAIL,
} from "./actionTypes";

const initialState = {
  hotels: [],
  loadingHotels: false,
  hotelsError: null,
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

    default:
      return state;
  }
};

export default hotels;
