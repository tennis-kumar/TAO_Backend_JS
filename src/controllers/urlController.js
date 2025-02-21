import UrlService from "../services/UrlService.js";
import AnalyticsService from "../services/AnalyticsService.js";


// 🔗 Shorten URL
export const shortenUrl = async (req, res) => {
  try {
    const { longUrl, customAlias, topic } = req.body;
    const userId = req.user.id;

    const { shortUrl, createdAt } = await UrlService.createShortUrl(userId, longUrl, customAlias, topic);

    res.json({ shortUrl, createdAt });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

// 🔄 Redirect Short URL
export const redirectUrl = async (req, res) => {
  try {
    const { alias } = req.params;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const longUrl = await UrlService.getLongUrl(alias);
    if (!longUrl) return res.status(404).json({ message: "Short URL not found" });

    await AnalyticsService.logAnalytics(alias, req, ip);
    await UrlService.incrementClickCount(alias);

    res.redirect(301, longUrl);
  } catch (error) {
    res.status(500).json({ message: "Redirection error" });
  }
};

// 🔥 Update Short URL
export const updateUrl = async (req, res) => {
  try {
    const { alias } = req.params;
    const { longUrl, customAlias, topic } = req.body;
    const userId = req.user.id;

    const updatedUrl = await UrlService.updateShortUrl(userId, alias, longUrl, customAlias, topic);

    res.json({ message: "URL updated successfully", updatedUrl });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

// ❌ Delete Short URL
export const deleteUrl = async (req, res) => {
  try {
    const { alias } = req.params;
    const userId = req.user.id;

    await UrlService.deleteShortUrl(userId, alias);
    res.json({ message: "URL deleted successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

// 📌 Get User's URLs
export const getUrlsByUser = async (req, res) => {
  try {
    const urls = await UrlService.getUserUrls(req.user.id);
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user URLs" });
  }
};
