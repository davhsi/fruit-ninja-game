// backend/utils/jwtUtils.js
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

// Removed logging of JWT_SECRET to prevent exposure of sensitive information.

exports.signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

exports.verifyToken = (token) => jwt.verify(token, JWT_SECRET);

exports.verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id; // attach userId for route access
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
