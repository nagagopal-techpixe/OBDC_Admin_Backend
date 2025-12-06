import fetch from "node-fetch";
import InstagramStats from "../models/Dashboard.js";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN = process.env.INSTAGRAM_TOKEN;
const INSTAGRAM_ID = process.env.INSTAGRAM_ID;

/**
 * Get Instagram stats from DB
 */
export const getInstagramStats = async (req, res) => {
  try {
    const stats = await InstagramStats.findOne().sort({ lastUpdated: -1 });

    if (!stats) {
      return res.status(404).json({ error: "Stats not found" });
    }

    res.json(stats);
  } catch (err) {
    console.error("Error fetching stats from DB:", err);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
};

/**
 * Fetch stats from Instagram API and update DB
 * Can be run manually or scheduled (cron job)
 */
export const updateInstagramStatsCron = async () => {
  try {
    let allMedia = [];
    let nextUrl = `https://graph.facebook.com/v19.0/${INSTAGRAM_ID}/media?fields=id,media_type,children{media_type}&limit=100&access_token=${ACCESS_TOKEN}`;

    while (nextUrl) {
      const response = await fetch(nextUrl);
      const data = await response.json();

      if (data.error) {
        console.error("CRON Instagram API Error:", data.error);
        return;
      }

      if (data.data) allMedia.push(...data.data);
      nextUrl = data.paging?.next || null;
    }

    let totalPosts = allMedia.length;
    let totalCarousel = 0;
    let totalVideos = 0;

    allMedia.forEach(post => {
      if (post.media_type === "CAROUSEL_ALBUM") {
        totalCarousel++;
        if (post.children?.data?.length) {
          post.children.data.forEach(child => {
            if (child.media_type === "VIDEO") totalVideos++;
          });
        }
      } else if (post.media_type === "VIDEO") {
        totalVideos++;
      }
    });

    const stats = {
      totalPosts,
      totalCarousel,
      totalVideos,
      readyToDownload: totalPosts,
      lastUpdated: new Date(),
    };

    await InstagramStats.findOneAndUpdate({}, stats, { upsert: true });

    console.log("📌 CRON: Instagram stats updated:", stats);
    

  } catch (err) {
    console.error("CRON update failed:", err.message);
  }
};

