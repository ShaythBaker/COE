const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const dbService = require("../../core/dbService");

const USERS_TABLE = "COE_TBL_USERS";
const PASSWORD_RESETS_TABLE = "COE_TBL_PASSWORD_RESETS";

// POST /api/auth/register
async function register(req, res) {
  try {
    const {
      FIRST_NAME,
      LAST_NAME,
      EMAIL,
      PASSWORD,
      PROFILE_IMG,
      DEPATRMENT_ID,
      PHONE_NUMBER,
      ACTIVE_STATUS,
    } = req.body;

    if (!FIRST_NAME || !LAST_NAME || !EMAIL || !PASSWORD) {
      return res.status(400).json({
        message: "FIRST_NAME, LAST_NAME, EMAIL, PASSWORD are required",
      });
    }

    // Check if email exists
    const existingUsers = await dbService.find({
      table: USERS_TABLE,
      where: { EMAIL },
      limit: 1,
    });

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "EMAIL already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    // Insert user
    const result = await dbService.insert(USERS_TABLE, {
      FIRST_NAME,
      LAST_NAME,
      EMAIL,
      PASSWORD: hashedPassword,
      PROFILE_IMG: PROFILE_IMG || null,
      DEPATRMENT_ID: DEPATRMENT_ID || null,
      PHONE_NUMBER: PHONE_NUMBER || null,
      ACTIVE_STATUS: ACTIVE_STATUS ?? 1,
    });

    return res.status(201).json({
      message: "User registered successfully",
      USER_ID: result.insertId,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const email = req.body.email || req.body.EMAIL;
    const password = req.body.password || req.body.PASSWORD;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "EMAIL and PASSWORD are required",
      });
    }

    const users = await dbService.find({
      table: USERS_TABLE,
      where: { EMAIL: email, ACTIVE_STATUS: 1 },
      limit: 1,
    });

    if (!users.length) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.PASSWORD);

    if (!match) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    const payload = {
      USER_ID: user.USER_ID,
      EMAIL: user.EMAIL,
      FIRST_NAME: user.FIRST_NAME,
      LAST_NAME: user.LAST_NAME,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    const responseBody = {
      // Travco - COE-style user
      uid: user.USER_ID,
      email: user.EMAIL,
      role: user.ROLE || "user",

      FIRST_NAME: user.FIRST_NAME,
      LAST_NAME: user.LAST_NAME,

      // tokens
      accessToken: token,
      token,
      TOKEN: token,

      username: user.FIRST_NAME || user.EMAIL,

      USER: user,
      user,

      status: true,
      message: "Login successful",
    };

    return res.json(responseBody);
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
}

// GET /api/auth/me
// assumes you have auth middleware that sets req.user from the JWT
// e.g. req.user = { USER_ID, EMAIL, FIRST_NAME, LAST_NAME, ... }

async function getMe(req, res) {
  try {
    const userId = req.user?.USER_ID;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const users = await dbService.find({
      table: USERS_TABLE,
      where: { USER_ID: userId, ACTIVE_STATUS: 1 },
      limit: 1,
    });

    if (users.length === 0) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const u = users[0];

    const username =
      (u.FIRST_NAME || "") + (u.LAST_NAME ? ` ${u.LAST_NAME}` : "");

    // Build a Travco - COE-friendly object
    const body = {
      // Travco - COE-style fields
      uid: u.USER_ID,
      username: username || u.EMAIL,
      email: u.EMAIL,

      // Keep DB fields as-is
      USER_ID: u.USER_ID,
      FIRST_NAME: u.FIRST_NAME,
      LAST_NAME: u.LAST_NAME,
      EMAIL: u.EMAIL,
      PROFILE_IMG: u.PROFILE_IMG,
      DEPATRMENT_ID: u.DEPATRMENT_ID,
      PHONE_NUMBER: u.PHONE_NUMBER,
      ACTIVE_STATUS: u.ACTIVE_STATUS,
      CREATED_AT: u.CREATED_AT,
      UPDATED_AT: u.UPDATED_AT,

      // full row for convenience
      USER: u,
      user: u,

      status: true,
      message: "User profile",
    };

    return res.json(body);
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
}

// POST /api/auth/change-password
// BODY (UPPERCASE): { "CURRENT_PASSWORD": "...", "NEW_PASSWORD": "..." }
async function changePasswordWhenLogin(req, res) {
  try {
    const { CURRENT_PASSWORD, NEW_PASSWORD } = req.body;

    if (!CURRENT_PASSWORD || !NEW_PASSWORD) {
      return res.status(400).json({
        message: "CURRENT_PASSWORD and NEW_PASSWORD are required",
      });
    }

    if (NEW_PASSWORD.length < 8) {
      return res.status(400).json({
        message: "NEW_PASSWORD must be at least 8 characters",
      });
    }

    const userFromToken = req.user; // from authMiddleware
    if (!userFromToken || !userFromToken.USER_ID) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const USER_ID = userFromToken.USER_ID;

    // Get user from DB
    const users = await dbService.find({
      table: USERS_TABLE,
      where: { USER_ID },
      fields: ["USER_ID", "PASSWORD"],
      limit: 1,
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Check current password
    const isMatch = await bcrypt.compare(CURRENT_PASSWORD, user.PASSWORD);
    if (!isMatch) {
      return res.status(400).json({ message: "CURRENT_PASSWORD is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // Update password
    await dbService.update(
      USERS_TABLE,
      { PASSWORD: hashedNewPassword },
      { USER_ID }
    );

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/auth/request-password-reset
// BODY (UPPERCASE): { "EMAIL": "user@example.com" }
async function requestPasswordResetByEmail(req, res) {
  try {
    const { EMAIL } = req.body;

    if (!EMAIL) {
      return res.status(400).json({ message: "EMAIL is required" });
    }

    // Find user by EMAIL
    const users = await dbService.find({
      table: USERS_TABLE,
      where: { EMAIL },
      fields: ["USER_ID", "EMAIL"],
      limit: 1,
    });

    if (users.length === 0) {
      // For security, do not reveal if email exists
      return res.json({
        message: "If this EMAIL exists, a reset link has been generated",
      });
    }

    const user = users[0];
    const USER_ID = user.USER_ID;

    // Generate random token
    const rawToken = crypto.randomBytes(32).toString("hex"); // token returned to user for now

    // Expire in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Insert reset entry
    await dbService.insert(PASSWORD_RESETS_TABLE, {
      USER_ID,
      RESET_TOKEN: rawToken,
      EXPIRES_AT: expiresAt,
      USED_STATUS: 0,
    });

    // In real world: email the token as URL.
    // For now: return the token in response so you can test easily.
    return res.json({
      message: "Password reset token generated",
      RESET_TOKEN: rawToken,
    });
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/auth/reset-password
// BODY (UPPERCASE): { "RESET_TOKEN": "...", "NEW_PASSWORD": "..." }
async function resetPasswordUsingToken(req, res) {
  try {
    const { RESET_TOKEN, NEW_PASSWORD } = req.body;

    if (!RESET_TOKEN || !NEW_PASSWORD) {
      return res.status(400).json({
        message: "RESET_TOKEN and NEW_PASSWORD are required",
      });
    }

    if (NEW_PASSWORD.length < 8) {
      return res.status(400).json({
        message: "NEW_PASSWORD must be at least 8 characters",
      });
    }

    // Find reset token entry
    const resets = await dbService.find({
      table: PASSWORD_RESETS_TABLE,
      where: { RESET_TOKEN, USED_STATUS: 0 },
      limit: 1,
    });

    if (resets.length === 0) {
      return res.status(400).json({ message: "Invalid or used RESET_TOKEN" });
    }

    const resetRow = resets[0];

    // Check expiration
    const now = new Date();
    const expires = new Date(resetRow.EXPIRES_AT);

    if (expires <= now) {
      return res.status(400).json({ message: "RESET_TOKEN has expired" });
    }

    const USER_ID = resetRow.USER_ID;

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(NEW_PASSWORD, 10);

    // Update user password
    await dbService.update(
      USERS_TABLE,
      { PASSWORD: hashedNewPassword },
      { USER_ID }
    );

    // Mark reset token as used
    await dbService.update(
      PASSWORD_RESETS_TABLE,
      { USED_STATUS: 1 },
      { RESET_ID: resetRow.RESET_ID }
    );

    return res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// controllers/auth.js (or wherever updateProfile lives)

async function updateProfile(req, res) {
  try {
    console.log("HIT updateProfile, body =", req.body);

    const userIdFromToken = req.user?.USER_ID;

    if (!userIdFromToken) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const { firstName, lastName, email, phoneNumber, departmentId, idx } =
      req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        status: false,
        message: "firstName, lastName and email are required",
      });
    }

    // Optional safety: ensure idx matches token user
    if (idx && Number(idx) !== Number(userIdFromToken)) {
      return res.status(403).json({
        status: false,
        message: "Forbidden",
      });
    }

    // 👇 This is the important part: same style as resetPasswordUsingToken

    await dbService.update(
      USERS_TABLE, // "COE_TBL_USERS"
      {
        FIRST_NAME: firstName,
        LAST_NAME: lastName,
        EMAIL: email,
        PHONE_NUMBER: phoneNumber,
        // use the SAME column name you used in register()
        DEPATRMENT_ID: departmentId,
      },
      { USER_ID: userIdFromToken }
    );

    return res.json("Profile Updated Successfully");
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePasswordWhenLogin,
  requestPasswordResetByEmail,
  resetPasswordUsingToken,
};
