import mongoose from "mongoose";

const UrlSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    longUrl: { 
      type: String, 
      required: true, 
      trim: true, 
      match: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i // URL validation 
    },
    shortUrl: { type: String, required: true, unique: true, index: true },
    customAlias: { type: String, unique: true, sparse: true, index: true },
    topic: { type: String, trim: true },
    totalClicks: { type: Number, default: 0 },
    uniqueUsers: { type: [String], of: String, default: [] }, // Store unique user IPs
    clicksByDate: [{ date: String, count: Number }], // Track clicks per date
    osType: [{ osName: String, uniqueClicks: Number, uniqueUsers: Number }],
    deviceType: [{ deviceName: String, uniqueClicks: Number, uniqueUsers: Number }],
  },
  { timestamps: true } // Automatically manages createdAt & updatedAt
);

export default mongoose.model("Url", UrlSchema);
