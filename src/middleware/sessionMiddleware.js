import session from "express-session";
import config from "../config/env.js";

const sessionMiddleware = session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === "production", // Secure in production
    httpOnly: true, // Prevent XSS attacks
    sameSite: "lax", // Adjust based on frontend needs
  },
});

export default sessionMiddleware;