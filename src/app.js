import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import sessionMiddleware from './middleware/sessionMiddleware.js';
import errorHandler from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import passport from "passport";
import "./config/passport.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/', urlRoutes);

// Error Handler
app.use(errorHandler);

export default app;