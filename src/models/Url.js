import mongoose from "mongoose";

const UrlSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  longUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  customAlias: { type: String, unique: true, sparse: true },
  topic: { type: String },
  totalClicks: { type: Number, default: 0 },
  uniqueUsers: { type: [String], default: [] }, // Store unique user IPs
  clicksByDate: [{ date: String, count: Number }], // Track clicks per date
  osType: [{ osName: String, uniqueClicks: Number, uniqueUsers: Number }],
  deviceType: [{ deviceName: String, uniqueClicks: Number, uniqueUsers: Number }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Url", UrlSchema);
