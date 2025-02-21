import Analytics from "../models/Analytics.js";
import Url from "../models/Url.js";
import useragent from "useragent";
import geoip from "geoip-lite";

class AnalyticsService {
  static async logAnalytics(alias, req, ip) {
    const userAgent = useragent.parse(req.headers["user-agent"]);
    const geo = geoip.lookup(ip) || {};

    const analyticsEntry = new Analytics({
      alias,
      timestamp: new Date(),
      userAgent: req.headers["user-agent"],
      os: userAgent.os.family || "Unknown",
      device: userAgent.device.family || "Unknown",
      ip,
      location: {
        country: geo.country || "Unknown",
        city: geo.city || "Unknown",
      },
    });

    await analyticsEntry.save();
    await Url.updateOne({ shortUrl: alias }, { $inc: { totalClicks: 1 } });
  }

  static async getOverallAnalytics(userId) {
    const urls = await Url.find({ userId });
    return { totalUrls: urls.length, totalClicks: urls.reduce((sum, url) => sum + url.totalClicks, 0) };
  }

  static async getUrlAnalytics(alias, userId) {
    return Analytics.find({ alias, userId });
  }

  static async getTopicAnalytics(topic, userId) {
    return Url.find({ topic, userId });
  }
}

export default AnalyticsService;