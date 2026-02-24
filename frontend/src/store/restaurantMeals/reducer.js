import * as types from "./actionTypes";

const INIT_STATE = {
  list: [],
  loading: false,
  saving: false,
  deleting: false,
  successMessage: null,
  error: null,
  lastQuery: { restaurantId: null, filters: { ACTIVE_STATUS: 1 } },
};

const RestaurantMeals = (state = INIT_STATE, action) => {
  switch (action.type) {
    case types.CLEAR_RESTAURANT_MEALS_MESSAGES:
      return { ...state, successMessage: null, error: null };

    case types.GET_RESTAURANT_MEALS:
      return {
        ...state,
        loading: true,
        error: null,
        lastQuery: {
          restaurantId: action.payload?.restaurantId ?? null,
          filters: action.payload?.filters || {},
        },
      };
    case types.GET_RESTAURANT_MEALS_SUCCESS:
      return { ...state, loading: false, list: action.payload || [] };
    case types.GET_RESTAURANT_MEALS_FAIL:
      return { ...state, loading: false, error: action.payload };

    case types.CREATE_RESTAURANT_MEAL:
    case types.UPDATE_RESTAURANT_MEAL:
      return { ...state, saving: true, successMessage: null, error: null };

    case types.CREATE_RESTAURANT_MEAL_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage: action.payload?.message || "Meal created",
      };
    case types.UPDATE_RESTAURANT_MEAL_SUCCESS:
      return {
        ...state,
        saving: false,
        successMessage: action.payload?.message || "Meal updated",
      };

    case types.CREATE_RESTAURANT_MEAL_FAIL:
    case types.UPDATE_RESTAURANT_MEAL_FAIL:
      return { ...state, saving: false, error: action.payload };

    case types.DELETE_RESTAURANT_MEAL:
      return { ...state, deleting: true, successMessage: null, error: null };
    case types.DELETE_RESTAURANT_MEAL_SUCCESS:
      return {
        ...state,
        deleting: false,
        successMessage: action.payload?.message || "Meal deleted",
      };
    case types.DELETE_RESTAURANT_MEAL_FAIL:
      return { ...state, deleting: false, error: action.payload };

    default:
      return state;
  }
};

export default RestaurantMeals;
