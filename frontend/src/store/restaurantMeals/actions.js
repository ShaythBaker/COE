import * as types from "./actionTypes";

export const getRestaurantMeals = (restaurantId, filters = {}) => ({
  type: types.GET_RESTAURANT_MEALS,
  payload: { restaurantId, filters },
});
export const getRestaurantMealsSuccess = (items) => ({
  type: types.GET_RESTAURANT_MEALS_SUCCESS,
  payload: items,
});
export const getRestaurantMealsFail = (error) => ({
  type: types.GET_RESTAURANT_MEALS_FAIL,
  payload: error,
});

export const createRestaurantMeal = (restaurantId, data) => ({
  type: types.CREATE_RESTAURANT_MEAL,
  payload: { restaurantId, data },
});
export const createRestaurantMealSuccess = (res) => ({
  type: types.CREATE_RESTAURANT_MEAL_SUCCESS,
  payload: res,
});
export const createRestaurantMealFail = (error) => ({
  type: types.CREATE_RESTAURANT_MEAL_FAIL,
  payload: error,
});

export const updateRestaurantMeal = (restaurantId, mealId, data) => ({
  type: types.UPDATE_RESTAURANT_MEAL,
  payload: { restaurantId, mealId, data },
});
export const updateRestaurantMealSuccess = (res) => ({
  type: types.UPDATE_RESTAURANT_MEAL_SUCCESS,
  payload: res,
});
export const updateRestaurantMealFail = (error) => ({
  type: types.UPDATE_RESTAURANT_MEAL_FAIL,
  payload: error,
});

export const deleteRestaurantMeal = (restaurantId, mealId) => ({
  type: types.DELETE_RESTAURANT_MEAL,
  payload: { restaurantId, mealId },
});
export const deleteRestaurantMealSuccess = (res) => ({
  type: types.DELETE_RESTAURANT_MEAL_SUCCESS,
  payload: res,
});
export const deleteRestaurantMealFail = (error) => ({
  type: types.DELETE_RESTAURANT_MEAL_FAIL,
  payload: error,
});

export const clearRestaurantMealsMessages = () => ({
  type: types.CLEAR_RESTAURANT_MEALS_MESSAGES,
});
