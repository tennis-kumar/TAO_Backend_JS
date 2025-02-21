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

dotenv.config();

const app = express();

app.use(cors({ origin: "https://tao-url-shortner-ui.vercel.app" , credentials: true }));
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
      cookie: { secure: true }, // Set secure: true if using HTTPS
    })
  );
  

  app.use(passport.initialize());
  app.use(passport.session());


  app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({
      message: error.message || 'Internal Server Error'
    });
  });
  
  app.use("/auth",authRoutes);
  app.use("/api",urlRoutes);


connectDB();



app.get("/", (req, res) => {
  res.send("URL Shortener API is running...");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
