import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema(
  {
    alias: { type: String, required: true, index: true }, // Index for faster lookups
    userAgent: { type: String, trim: true },
    os: { type: String, default: "Unknown", trim: true },
    device: { type: String, default: "Unknown", trim: true },
    ip: { type: String, trim: true },
    location: {
      country: { type: String, default: "Unknown", trim: true },
      city: { type: String, default: "Unknown", trim: true },
    },
  },
  { timestamps: true } // Automatically manages createdAt & updatedAt
);

export default mongoose.model("Analytics", AnalyticsSchema);
