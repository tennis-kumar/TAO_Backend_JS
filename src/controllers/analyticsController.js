import AnalyticsService from "../services/AnalyticsService.js";

// 📊 Get Overall Analytics
export const getOverallAnalytics = async (req, res) => {
    try {
      const analytics = await AnalyticsService.getOverallAnalytics(req.user.id);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics" });
    }
  };
  
  // 📊 Get URL-specific Analytics
  export const getUrlAnalytics = async (req, res) => {
    try {
      const { alias } = req.params;
      const analytics = await AnalyticsService.getUrlAnalytics(alias, req.user.id);
  
      if (!analytics) return res.status(404).json({ message: "No analytics found for this URL" });
  
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics" });
    }
  };
  
  // 📊 Get Analytics by Topic
  export const getTopicAnalytics = async (req, res) => {
    try {
      const { topic } = req.params;
      const analytics = await AnalyticsService.getTopicAnalytics(topic, req.user.id);
  
      if (!analytics) return res.status(404).json({ message: "No URLs found for this topic" });
  
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching topic analytics" });
    }
  };