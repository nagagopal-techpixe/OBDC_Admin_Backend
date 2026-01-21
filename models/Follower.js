import mongoose from "mongoose";

const followerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    full_name: String,
    instagram_id: String,
  },
  { timestamps: true }
);

export default mongoose.model("Follower", followerSchema);
