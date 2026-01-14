// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"]; // Expected: "Bearer <token>"

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      code: "AUTH_HEADER_MISSING",
      message: "Authorization header missing",
    });
  }

  const parts = String(authHeader).split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      success: false,
      code: "AUTH_HEADER_INVALID",
      message: "Authorization header must be: Bearer <token>",
    });
  }

  const token = parts[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      code: "TOKEN_MISSING",
      message: "Token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      code: "TOKEN_INVALID_OR_EXPIRED",
      message: "Invalid or expired token",
    });
  }
}

module.exports = authMiddleware;
