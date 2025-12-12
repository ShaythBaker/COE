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

  const token = authHeader.split(" ")[1];
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
