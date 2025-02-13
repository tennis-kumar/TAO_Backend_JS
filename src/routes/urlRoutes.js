import express from "express";
import Url from "../models/Url.js";
import shortid from "shortid";
import rateLimit from "express-rate-limit";
import redisClient from "../config/redisClient.js"; // Redis setup
import authMiddleware from "../middleware/authMiddleware.js";

import useragent from "useragent";
import geoip from "geoip-lite";
import Analytics from "../models/Analytics.js";

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

// 🔥 New: Function to Log Analytics
const logAnalytics = async (alias, req) => {
  const userAgent = useragent.parse(req.headers["user-agent"]);
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip) || {}; // Get geolocation data

  const analyticsEntry = new Analytics({
    alias,
    timestamp: new Date(),
    userAgent: req.headers["user-agent"],
    os: userAgent.os.family,
    device: userAgent.device.family,
    ip,
    location: {
      country: geo.country || "Unknown",
      city: geo.city || "Unknown",
    },
  });

  await analyticsEntry.save();
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
      await logAnalytics(alias, req); // Log analytics
      await Url.updateOne({ shortUrl: alias }, { $inc: { totalClicks: 1 } }); // Increment totalClicks
      console.log({
        timestamp: new Date(),
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        alias,
      });
      return res.redirect(301, cachedUrl); // Permanent Redirect
    }

    // If not in Redis, check MongoDB
    const urlEntry = await Url.findOne({ shortUrl: alias });
    if (!urlEntry) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    await logAnalytics(alias, req); // Log analytics
    await Url.updateOne({ shortUrl: alias }, { $inc: { totalClicks: 1 } }); // Increment totalClicks

    await redisClient.setEx(alias, 86400, urlEntry.longUrl);
    console.log({
      timestamp: new Date(),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      alias,
    });

    res.redirect(301, urlEntry.longUrl);
  } catch (err) {
    console.error("Redirection error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/analytics/:alias", async (req, res) => {
  const { alias } = req.params;

  try {
    const clicks = await Analytics.find({ alias });

    if (clicks.length === 0) {
      return res.status(404).json({ message: "No analytics found for this URL" });
    }

    const totalClicks = clicks.length;
    const uniqueUsers = new Set(clicks.map((c) => c.ip)).size;

    const clicksByDate = clicks.reduce((acc, click) => {
      const date = click.timestamp.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const osType = clicks.reduce((acc, click) => {
      acc[click.os] = (acc[click.os] || 0) + 1;
      return acc;
    }, {});

    const deviceType = clicks.reduce((acc, click) => {
      acc[click.device] = (acc[click.device] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalClicks,
      uniqueUsers,
      clicksByDate,
      osType,
      deviceType,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/analytics/topic/:topic", async (req, res) => {
  const { topic } = req.params;

  try {
    const urls = await Url.find({ topic });

    if (!urls.length) {
      return res.status(404).json({ message: "No URLs found for this topic" });
    }

    // Aggregate total clicks
    const totalClicks = urls.reduce((sum, url) => sum + (url.totalClicks || 0), 0);

    res.json({
      topic,
      totalClicks,
      urls: urls.map(url => ({
        shortUrl: url.shortUrl,
        totalClicks: url.totalClicks || 0,
      })),
    });
  } catch (err) {
    console.error("Error fetching topic analytics:", err);
    res.status(500).json({ message: "Server error" });
  }
});




export default router;
