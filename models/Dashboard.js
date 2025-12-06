// models/InstagramStats.js
import mongoose from "mongoose";

const InstagramStatsSchema = new mongoose.Schema(
  {
    totalPosts: { type: Number, default: 0 },
    totalCarousel: { type: Number, default: 0 },
    totalVideos: { type: Number, default: 0 },
    readyToDownload: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("InstagramStats", InstagramStatsSchema);
