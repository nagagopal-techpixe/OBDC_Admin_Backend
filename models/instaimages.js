import mongoose from "mongoose";

const InstagramMediaSchema = new mongoose.Schema(
  {
    mediaId: { type: String, required: true, unique: true },
    caption: String,
    image: String,
    prompt: { type: String, default: "" },
    tool: { type: String, default: "" },
    adminComment: { type: String, default: "" },
    timestamp: String,

  },
  { timestamps: true }
);

export default mongoose.model("InstagramMedia", InstagramMediaSchema);
