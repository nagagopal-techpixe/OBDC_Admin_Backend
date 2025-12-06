// models/InstaMedia.js
import mongoose from "mongoose";

const instaMediaSchema = new mongoose.Schema({
  id: String,
  media_type: String,
  media_url: String,
  caption: String,
  thumbnail_url: String,
  timestamp: Date,
  children: Array,
});

export default mongoose.model("InstaMedia", instaMediaSchema);
