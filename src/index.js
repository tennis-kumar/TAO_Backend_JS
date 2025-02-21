import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import passport from "passport";

import connectDB from "./config/db.js";
import sessionMiddleware from "./middleware/SessionMiddleware.js";
import errorHandler from "./middleware/errorMiddleware.js";

import "./middleware/PassportMiddleware.js"; // Load Passport config
import authRoutes from "./routes/AuthRoutes.js";
import urlRoutes from "./routes/UrlRoutes.js";

dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session & Authentication
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);
app.use("/api", urlRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Database Connection
connectDB();

// Root Route
app.get("/", (req, res) => {
  res.send("URL Shortener API is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
