import mongoose from "mongoose";

const SubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    media_url: { type: String, required: true },
     media_id: {
      type: String,
      index: true, // useful for search
    },
    
  },
  { timestamps: true }
);

export default mongoose.model("Subscriber", SubscriberSchema);
