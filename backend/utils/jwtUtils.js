// backend/utils/jwtUtils.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

exports.signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

exports.verifyToken = (token) => jwt.verify(token, JWT_SECRET);
