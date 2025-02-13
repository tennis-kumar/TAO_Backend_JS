import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema({
  alias: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  userAgent: String,
  os: String,
  device: String,
  ip: String,
  location: {
    country: String,
    city: String,
  },
});

export default mongoose.model("Analytics", AnalyticsSchema);
