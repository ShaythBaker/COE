const express = require("express");
const authController = require("./auth.controller");
const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

// Auth
router.post("/register", authController.register);
router.post("/login", authController.login);
//router.post("/logout", authMiddleware, authController.logout);

// Password
router.post(
  "/change-password",
  authMiddleware,
  authController.changePasswordWhenLogin
);

router.post(
  "/request-password-reset",
  authController.requestPasswordResetByEmail
);

router.post("/reset-password", authController.resetPasswordUsingToken);

router.get("/me", authMiddleware, authController.getMe);

router.post("/profile", authMiddleware, authController.updateProfile);

module.exports = router;
