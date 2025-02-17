import Url from "../models/Url.js";
import useragent from "useragent";
import geoip from "geoip-lite";
import Analytics from "../models/Analytics.js";
import shortid from "shortid";
import redisClient from "../config/redisClient.js";



// Rate limiting middleware using Redis
export const rateLimiter = async (req, res, next) => {
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

// 🔥  Updated Analytics Logger Function
export const logAnalytics = async (alias, req, ip) => {
  const userAgent = useragent.parse(req.headers["user-agent"]);
  const geo = geoip.lookup(ip) || {}; // Get geolocation data

  const os = userAgent.os.family || "Unknown";
  const device = userAgent.device.family || "Unknown";
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  // Update Analytics collection
  const analyticsEntry = new Analytics({
    alias,
    timestamp: new Date(),
    userAgent: req.headers["user-agent"],
    os,
    device,
    ip,
    location: {
      country: geo.country || "Unknown",
      city: geo.city || "Unknown",
    },
  });

  await analyticsEntry.save();

  // Update URL Analytics in the URL collection
  const urlEntry = await Url.findOne({ shortUrl: alias });

  if (urlEntry) {
    // Add unique user IP if not already present
    const isNewUser = !urlEntry.uniqueUsers.includes(ip);
    if (isNewUser) {
      urlEntry.uniqueUsers.push(ip);
    }

    // Update clicksByDate
    const dateEntry = urlEntry.clicksByDate.find((entry) => entry.date === currentDate);
    if (dateEntry) {
      dateEntry.count += 1;
    } else {
      urlEntry.clicksByDate.push({ date: currentDate, count: 1 });
    }

    // Update OS analytics
    const osEntry = urlEntry.osType.find((entry) => entry.osName === os);
    if (osEntry) {
      osEntry.uniqueClicks += 1;
      if (isNewUser) osEntry.uniqueUsers += 1;
    } else {
      urlEntry.osType.push({ osName: os, uniqueClicks: 1, uniqueUsers: isNewUser ? 1 : 0 });
    }

    // Update Device analytics
    const deviceEntry = urlEntry.deviceType.find((entry) => entry.deviceName === device);
    if (deviceEntry) {
      deviceEntry.uniqueClicks += 1;
      if (isNewUser) deviceEntry.uniqueUsers += 1;
    } else {
      urlEntry.deviceType.push({
        deviceName: device,
        uniqueClicks: 1,
        uniqueUsers: isNewUser ? 1 : 0,
      });
    }

    await urlEntry.save();
  }
};

// GET /api/analytics/overall
export const getOverallAnalytics = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user ID

    // Fetch all URLs created by the user
    const urls = await Url.find({ userId });

    if (!urls.length) {
      return res.status(404).json({ message: "No URLs found" });
    }

    // Total URLs
    const totalUrls = urls.length;

    // Aggregate Click Data
    const totalClicks = urls.reduce((sum, url) => sum + url.totalClicks, 0);
    const uniqueUsers = new Set(urls.flatMap(url => url.uniqueUsers)).size;

    // Clicks by Date (last 7 days)
    const clicksByDate = {};
    urls.forEach(url => {
      url.clicksByDate.forEach(({ date, count }) => {
        clicksByDate[date] = (clicksByDate[date] || 0) + count;
      });
    });

    const formattedClicksByDate = Object.entries(clicksByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // OS Type Analytics
    const osTypeStats = {};
    urls.forEach(url => {
      url.osType.forEach(({ osName, uniqueClicks, uniqueUsers }) => {
        if (!osTypeStats[osName]) osTypeStats[osName] = { uniqueClicks: 0, uniqueUsers: 0 };
        osTypeStats[osName].uniqueClicks += uniqueClicks;
        osTypeStats[osName].uniqueUsers += uniqueUsers;
      });
    });

    const osType = Object.entries(osTypeStats).map(([osName, data]) => ({
      osName,
      uniqueClicks: data.uniqueClicks,
      uniqueUsers: data.uniqueUsers,
    }));

    // Device Type Analytics
    const deviceTypeStats = {};
    urls.forEach(url => {
      url.deviceType.forEach(({ deviceName, uniqueClicks, uniqueUsers }) => {
        if (!deviceTypeStats[deviceName]) deviceTypeStats[deviceName] = { uniqueClicks: 0, uniqueUsers: 0 };
        deviceTypeStats[deviceName].uniqueClicks += uniqueClicks;
        deviceTypeStats[deviceName].uniqueUsers += uniqueUsers;
      });
    });

    const deviceType = Object.entries(deviceTypeStats).map(([deviceName, data]) => ({
      deviceName,
      uniqueClicks: data.uniqueClicks,
      uniqueUsers: data.uniqueUsers,
    }));

    // Response JSON
    res.json({
      totalUrls,
      totalClicks,
      uniqueUsers,
      clicksByDate: formattedClicksByDate,
      osType,
      deviceType,
    });
  } catch (error) {
    console.error("Error fetching overall analytics:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


export const shortenUrl = async (req, res) => {
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
};

export const getUrlAnalytics = async (req, res) => {
  const { alias } = req.params;

  try {
    // Find the URL and check ownership
    const urlEntry = await Url.findOne({ shortUrl: alias });
    if (!urlEntry) {
      return res.status(404).json({ message: "URL not found" });
    }

    // Check if the authenticated user is the owner
    if (urlEntry.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Fetch analytics data
    const clicks = await Analytics.find({ alias });

    if (clicks.length === 0) {
      return res
        .status(404)
        .json({ message: "No analytics found for this URL" });
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
};

export const getTopicAnalytics = async (req, res) => {
  const { topic } = req.params;
  const userId = req.user.id; // Extract user ID from JWT

  try {
    // Fetch only the URLs that belong to the authenticated user
    const urls = await Url.find({ topic, userId });

    if (!urls.length) {
      return res.status(404).json({ message: "No URLs found for this topic" });
    }

    // Aggregate total clicks for URLs owned by the user
    const totalClicks = urls.reduce((sum, url) => sum + (url.totalClicks || 0), 0);

    res.json({
      topic,
      totalClicks,
      urls: urls.map((url) => ({
        shortUrl: url.shortUrl,
        totalClicks: url.totalClicks || 0,
      })),
    });
  } catch (err) {
    console.error("Error fetching topic analytics:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUrl = async (req, res) => {
  const { alias } = req.params;
  const userId = req.user.id; // Extract user ID from JWT

  try {
    // Find the URL and ensure it belongs to the authenticated user
    const url = await Url.findOne({ shortUrl: alias, userId });
    if (!url) {
      return res.status(404).json({ message: "URL not found or unauthorized" });
    }

    // Remove from database
    await Url.deleteOne({ _id: url._id });

    // Remove from Redis cache (if exists)
    await redisClient.del(alias);

    res.json({ message: "URL deleted successfully" });
  } catch (err) {
    console.error("Error deleting URL:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateUrl = async (req, res) => {
  const { alias } = req.params;
  const { longUrl, customAlias, topic } = req.body;
  const userId = req.user.id;

  try {
    // Find the URL and ensure it belongs to the authenticated user
    const url = await Url.findOne({ shortUrl: alias, userId });
    if (!url) {
      return res.status(404).json({ message: "URL not found or unauthorized" });
    }

    // Check if the new customAlias is already taken
    if (customAlias && customAlias !== alias) {
      const existingAlias = await Url.findOne({ shortUrl: customAlias });
      if (existingAlias) {
        return res.status(400).json({ message: "Custom alias already taken" });
      }
      url.shortUrl = customAlias;
    }

    // Update allowed fields
    if (longUrl) url.longUrl = longUrl;
    if (topic) url.topic = topic;

    await url.save();

    // Update Redis cache for faster lookups
    await redisClient.del(alias); // Remove old cache
    await redisClient.setEx(url.shortUrl, 86400, url.longUrl); // Cache new URL

    res.json({ message: "URL updated successfully", url });
  } catch (err) {
    console.error("Error updating URL:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUrlsByUser = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from token

    const urls = await Url.find({ userId });

    if (!urls.length) {
      return res.status(404).json({ message: "No URLs found for this user" });
    }

    res.json({ urls });
  } catch (err) {
    console.error("Error fetching user URLs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const redirectUrl = async (req, res) => {
  const { alias } = req.params;
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    // Check Redis cache first
    const cachedUrl = await redisClient.get(alias);
    if (cachedUrl) {
      await logAnalytics(alias, req, ip); // Log analytics
      await Url.updateOne({ shortUrl: alias }, { $inc: { totalClicks: 1 } }); // Increment totalClicks
      return res.redirect(301, cachedUrl); // Permanent Redirect
    }

    // If not in Redis, check MongoDB
    const urlEntry = await Url.findOne({ shortUrl: alias });
    if (!urlEntry) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    await logAnalytics(alias, req, ip); // Log analytics
    await Url.updateOne({ shortUrl: alias }, { $inc: { totalClicks: 1 } }); // Increment totalClicks

    // Cache in Redis
    await redisClient.setEx(alias, 86400, urlEntry.longUrl);

    res.redirect(301, urlEntry.longUrl);
  } catch (err) {
    console.error("Redirection error:", err);
    res.status(500).json({ message: "Server error" });
  }
};