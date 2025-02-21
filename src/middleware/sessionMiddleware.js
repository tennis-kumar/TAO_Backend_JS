import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Secure in production
    httpOnly: true, // Prevent XSS attacks
    sameSite: "lax", // Adjust based on frontend needs
  },
});

export default sessionMiddleware;