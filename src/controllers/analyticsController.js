import Url from "../models/Url.js";

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


