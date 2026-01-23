import * as types from "./actionTypes";

export const getRestaurants = (filters) => ({
  type: types.GET_RESTAURANTS,
  payload: { filters: filters || {} },
});
export const getRestaurantsSuccess = (items) => ({
  type: types.GET_RESTAURANTS_SUCCESS,
  payload: items,
});
export const getRestaurantsFail = (error) => ({
  type: types.GET_RESTAURANTS_FAIL,
  payload: error,
});

export const getRestaurant = (restaurantId) => ({
  type: types.GET_RESTAURANT,
  payload: { restaurantId },
});
export const getRestaurantSuccess = (item) => ({
  type: types.GET_RESTAURANT_SUCCESS,
  payload: item,
});
export const getRestaurantFail = (error) => ({
  type: types.GET_RESTAURANT_FAIL,
  payload: error,
});

export const createRestaurant = (data) => ({
  type: types.CREATE_RESTAURANT,
  payload: { data },
});
export const createRestaurantSuccess = (res) => ({
  type: types.CREATE_RESTAURANT_SUCCESS,
  payload: res,
});
export const createRestaurantFail = (error) => ({
  type: types.CREATE_RESTAURANT_FAIL,
  payload: error,
});

export const updateRestaurant = (restaurantId, data) => ({
  type: types.UPDATE_RESTAURANT,
  payload: { restaurantId, data },
});
export const updateRestaurantSuccess = (res) => ({
  type: types.UPDATE_RESTAURANT_SUCCESS,
  payload: res,
});
export const updateRestaurantFail = (error) => ({
  type: types.UPDATE_RESTAURANT_FAIL,
  payload: error,
});

export const deleteRestaurant = (restaurantId) => ({
  type: types.DELETE_RESTAURANT,
  payload: { restaurantId },
});
export const deleteRestaurantSuccess = (res) => ({
  type: types.DELETE_RESTAURANT_SUCCESS,
  payload: res,
});
export const deleteRestaurantFail = (error) => ({
  type: types.DELETE_RESTAURANT_FAIL,
  payload: error,
});

export const clearRestaurantsMessages = () => ({
  type: types.CLEAR_RESTAURANTS_MESSAGES,
});
