import { GET_HOTELS, GET_HOTELS_SUCCESS, GET_HOTELS_FAIL } from "./actionTypes";

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
