import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  mediaId: { type: String, required: true },
  processedComments: { type: [String], default: [] },

}, { timestamps: true });

export default mongoose.model("comment", commentSchema);
