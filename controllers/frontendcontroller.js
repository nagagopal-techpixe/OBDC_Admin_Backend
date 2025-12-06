// controllers/instaController.js
import fetch from "node-fetch";
import InstaMedia from "../models/frontend.js";
import dotenv from "dotenv";

dotenv.config();

export const frontendSync = async () => {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/17841461297442020/media?fields=id,media_type,media_url,caption,thumbnail_url,timestamp&access_token=${process.env.INSTAGRAM_TOKEN}`
    );
    const data = await res.json();

    if (!data.data) {
      console.log("❌ Invalid response:", data);
      return;
    }

    const updated = [];

    for (const item of data.data) {
      let finalMediaUrl = item.media_url; // default
      let finalType = item.media_type;

      // ✔ If carousel → fetch children → pick FIRST child only
      if (item.media_type === "CAROUSEL_ALBUM") {
        const childRes = await fetch(
          `https://graph.facebook.com/v19.0/${item.id}/children?fields=id,media_type,media_url&access_token=${process.env.INSTAGRAM_TOKEN}`
        );
        const childData = await childRes.json();

        if (childData.data && childData.data.length > 0) {
          const firstChild = childData.data[0];
          finalMediaUrl = firstChild.media_url;
          finalType = firstChild.media_type;
        }
      }

      updated.push({
        id: item.id,
        media_type: finalType,       // image OR video
        media_url: finalMediaUrl,    // only ONE media
        caption: item.caption,
        timestamp: item.timestamp,
      });
    }

    await InstaMedia.deleteMany({});
    await InstaMedia.insertMany(updated);

    console.log("✅ Instagram media synced (1 media per post)");
  } catch (err) {
    console.log("❌ Instagram sync error:", err);
  }
};


// API route to fetch media
export const getMedia = async (req, res) => {
  try {
    const media = await InstaMedia.find().sort({ timestamp: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch media" });
  }
};
