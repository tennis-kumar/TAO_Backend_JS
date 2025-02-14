import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import passport from "passport";
import session from "express-session";
import "./config/passport.js";
import authRoutes from "./routes/auth.js";
import urlRoutes from "./routes/urlRoutes.js";
// import urlRoutes from "./routes/urlRoutesNew.js";

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Add session middleware (Must be before passport)
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // Set secure: true if using HTTPS
    })
  );
  
  // ✅ Initialize Passport (After session)
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.use("/auth",authRoutes);
  app.use("/api",urlRoutes);

  //DB connection
connectDB();


// Root Route
app.get("/", (req, res) => {
  res.send("URL Shortener API is running...");
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
