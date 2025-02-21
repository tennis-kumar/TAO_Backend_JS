import Url from "../models/Url.js";
import redisClient from "../config/redisClient.js";
import shortid from "shortid";

class UrlService {
  static async createShortUrl(userId, longUrl, customAlias, topic) {
    let shortUrl = customAlias || shortid.generate();

    if (customAlias) {
      const existingUrl = await Url.findOne({ shortUrl: customAlias });
      if (existingUrl) throw { status: 400, message: "Alias already taken" };
    }

    const newUrl = new Url({ userId, longUrl, shortUrl, topic });
    await newUrl.save();

    await redisClient.setEx(shortUrl, 86400, longUrl); // Cache for 1 day

    return { shortUrl, createdAt: newUrl.createdAt };
  }

  static async getLongUrl(alias) {
    const cachedUrl = await redisClient.get(alias);
    if (cachedUrl) return cachedUrl;

    const urlEntry = await Url.findOne({ shortUrl: alias });
    if (!urlEntry) return null;

    await redisClient.setEx(alias, 86400, urlEntry.longUrl);
    return urlEntry.longUrl;
  }

  static async incrementClickCount(alias) {
    await Url.updateOne({ shortUrl: alias }, { $inc: { totalClicks: 1 } });
  }

  static async updateShortUrl(userId, alias, longUrl, customAlias, topic) {
    const url = await Url.findOne({ shortUrl: alias, userId });
    if (!url) throw { status: 404, message: "URL not found or unauthorized" };

    if (customAlias && customAlias !== alias) {
      const existingAlias = await Url.findOne({ shortUrl: customAlias });
      if (existingAlias) throw { status: 400, message: "Custom alias already taken" };
      url.shortUrl = customAlias;
    }

    if (longUrl) url.longUrl = longUrl;
    if (topic) url.topic = topic;

    await url.save();
    await redisClient.setEx(url.shortUrl, 86400, url.longUrl);

    return url;
  }

  static async deleteShortUrl(userId, alias) {
    const url = await Url.findOneAndDelete({ shortUrl: alias, userId });
    if (!url) throw { status: 404, message: "URL not found or unauthorized" };

    await redisClient.del(alias);
  }

  static async getUserUrls(userId) {
    return Url.find({ userId });
  }
}

export default UrlService;