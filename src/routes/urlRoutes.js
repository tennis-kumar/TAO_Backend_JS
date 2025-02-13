import express from "express";
import Url from "../models/Url.js";
import shortid from "shortid";
import rateLimit from "express-rate-limit";
import redisClient from "../config/redisClient.js"; // Redis setup
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Rate limiting middleware using Redis
const rateLimiter = async (req, res, next) => {
  const userId = req.user.id; // Extract from auth middleware
  const limit = 10; // Example: 10 URLs per hour
  const ttl = 3600; // 1 hour

  try {
    const usage = await redisClient.get(`shorten_limit_${userId}`);
    if (usage && usage >= limit) {
      return res.status(429).json({ message: "Rate limit exceeded" });
    }

    await redisClient.incr(`shorten_limit_${userId}`);
    await redisClient.expire(`shorten_limit_${userId}`, ttl);

    next();
  } catch (err) {
    console.error("Redis error:", err);
    next(err);
  }
};

// Shorten URL API
router.post("/shorten", authMiddleware,rateLimiter, async (req, res) => {
  const { longUrl, customAlias, topic } = req.body;
  const userId = req.user.id; // Extracted from JWT

  try {
    let shortUrl;
    if (customAlias) {
      const existingUrl = await Url.findOne({ shortUrl: customAlias });
      if (existingUrl) return res.status(400).json({ message: "Alias already taken" });
      shortUrl = customAlias;
    } else {
      shortUrl = shortid.generate();
    }

    const newUrl = new Url({ userId, longUrl, shortUrl, topic });
    await newUrl.save();

    // Cache in Redis for faster redirections
    await redisClient.setEx(shortUrl, 86400, longUrl); // Cache for 1 day

    res.json({ shortUrl, createdAt: newUrl.createdAt });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔥 New: Redirect API 🔥
router.get("/shorten/:alias", async (req, res) => {
  const { alias } = req.params;

  try {
    // Check Redis cache first
    const cachedUrl = await redisClient.get(alias);
    if (cachedUrl) {
      return res.redirect(301, cachedUrl); // Permanent Redirect
    }

    // If not in Redis, check MongoDB
    const urlEntry = await Url.findOne({ shortUrl: alias });
    if (!urlEntry) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    // Log analytics (extend later with more details)
    console.log({
      timestamp: new Date(),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      alias,
    });

    // Cache the URL in Redis for future lookups
    await redisClient.setEx(alias, 86400, urlEntry.longUrl); // Cache for 1 day

    res.redirect(301, urlEntry.longUrl);
  } catch (err) {
    console.error("Redirection error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
