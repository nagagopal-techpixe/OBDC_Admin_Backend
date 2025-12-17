import mongoose from "mongoose";

const InstagramVideoSchema = new mongoose.Schema(
  {
    mediaId: { type: String, required: true, unique: true },
    caption: { type: String, default: "" },
    video: { type: String, required: true }, // video URL
    prompt: { type: String, default: "" },   // user can add prompt
    tool: { type: String, default: "" },     // user can add tool
    adminComment: { type: String, default: "" },
     url: { type: String },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true }
);

// export default mongoose.model("InstagarmVideo", InstagramVideoSchema);

export default mongoose.model("InstagramVideo", InstagramVideoSchema);

    