// src/modules/restaurants/restaurants.routes.js
const express = require("express");
const restaurantsController = require("./restaurants.controller");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

// List restaurants (filterable by any column via query params)
router.get("/", authMiddleware, restaurantsController.listRestaurants);

// NEW: meals lookup (view)
router.get(
  "/meals/lookup",
  authMiddleware,
  restaurantsController.listRestaurantMealsLookup
);

// Get single restaurant by ID
router.get(
  "/:RESTUARANT_ID",
  authMiddleware,
  restaurantsController.getRestaurantById
);

// Create new restaurant
router.post("/", authMiddleware, restaurantsController.createRestaurant);

// Update restaurant
router.put(
  "/:RESTUARANT_ID",
  authMiddleware,
  restaurantsController.updateRestaurant
);

// Soft delete restaurant
router.delete(
  "/:RESTUARANT_ID",
  authMiddleware,
  restaurantsController.deleteRestaurant
);

router.get("/meals", authMiddleware, restaurantsController.listRestaurantMeals);

// Nested by RESTAURANT_ID (also dynamic GET)
router.get(
  "/:RESTAURANT_ID/meals",
  authMiddleware,
  restaurantsController.listRestaurantMeals
);

router.post(
  "/:RESTAURANT_ID/meals",
  authMiddleware,
  restaurantsController.createRestaurantMeal
);

router.put(
  "/:RESTAURANT_ID/meals/:RESTAURANT_MEAL_ID",
  authMiddleware,
  restaurantsController.updateRestaurantMeal
);

router.delete(
  "/:RESTAURANT_ID/meals/:RESTAURANT_MEAL_ID",
  authMiddleware,
  restaurantsController.deleteRestaurantMeal
);

module.exports = router;
