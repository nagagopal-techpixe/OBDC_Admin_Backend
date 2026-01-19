import mongoose from "mongoose";

const PostSubscriberSchema = new mongoose.Schema(
  {
    mediaId: {
      type: String,
      required: true,
      unique: true, // one document per media
      index: true,
    },

    emailIds: [
      {
        email: {
          type: String,
          required: true,
        },
        subscribedAt: {
          type: Date,
          default: Date.now, // 👈 date for THIS email
        },
      },
    ],

    mediaUrl: {
      type: String,
      required: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PostSubscriber", PostSubscriberSchema);
