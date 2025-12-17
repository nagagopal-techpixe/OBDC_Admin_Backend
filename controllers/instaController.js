import fetch from "node-fetch";
import dotenv from "dotenv";
import InstagramMedia from "../models/instaimages.js";

dotenv.config();

const ACCESS_TOKEN = process.env.INSTAGRAM_TOKEN;
const INSTAGRAM_ID = process.env.INSTAGRAM_ID;

// Fetch first image from a carousel
async function getCarouselImage(id) {
  try {
    const url = `https://graph.facebook.com/v19.0/${id}/children?fields=media_type,media_url&access_token=${ACCESS_TOKEN}`;
    const res = await fetch(url);
    const json = await res.json();

    // Take the FIRST IMAGE only (skip videos)
    const firstImage = json?.data?.find(c => c.media_type === "IMAGE");

    return firstImage?.media_url || null;
  } catch {
    return null;
  }
}

// Fetch ALL posts
async function fetchInstagramPosts() {
  let url = `https://graph.facebook.com/v19.0/${INSTAGRAM_ID}/media?fields=id,media_type,media_url,caption,timestamp&limit=100&access_token=${ACCESS_TOKEN}`;
  const posts = [];

  while (url) {
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data) break;

    const mapped = await Promise.all(
      json.data.map(async (item) => {

        let img = null;

        // --- 1. IMAGE POST ---
        if (item.media_type === "IMAGE") {
          img = item.media_url;
        }

        // --- 2. CAROUSEL POST ---
        else if (item.media_type === "CAROUSEL_ALBUM") {
          img = await getCarouselImage(item.id);
        }

        // --- 3. VIDEO → SKIP ---
        else {
          return null;
        }

        // No image found → skip
        if (!img) return null;

        return {
          mediaId: item.id,
          caption: item.caption || "",
          image: img,
          timestamp: item.timestamp,
        };
      })
    );

    // filter out skipped
    posts.push(...mapped.filter(Boolean));

    url = json.paging?.next || null;
  }

  return posts;
}

// ⭐ FRONTEND API → FAST RESPONSE
export const getInstagramMedia = async (req, res) => {
  try {
    const latest100 = await InstagramMedia.find()
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(latest100);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
};

// ⭐ CRON JOB FUNCTION (NO req,res)
export const syncInstagramMedia = async () => {
  try {
    const posts = await fetchInstagramPosts();

    for (const p of posts) {
      const postWithUrl = {
        ...p,
        url: `https://obcd.ai/media/${p.mediaId}`, // <-- store this in DB
      };
      await InstagramMedia.updateOne(
        { mediaId: p.mediaId },
        { $set: postWithUrl },
        { upsert: true }
      );
    }

    console.log("✔ Instagram media synced");
  } catch (e) {
    console.log("❌ Sync failed", e);
  }
};

// Prompt update
export const updatePrompt = async (req, res) => {
  const { mediaId } = req.params;
  await InstagramMedia.updateOne(
    { mediaId },
    { $set: { prompt: req.body.prompt } }
  );
  res.json({ message: "Prompt Updated" });
};

// Tool update
export const updateTool = async (req, res) => {
  const { mediaId } = req.params;
  await InstagramMedia.updateOne(
    { mediaId },
    { $set: { tool: req.body.tool } }
  );
  res.json({ message: "Tool Updated" });
};

//comments
export const updatedComment = async (req, res) => {
  const { mediaId } = req.params;
  const { comment } = req.body; // <-- must match frontend

  if (!comment) {
    return res.status(400).json({ message: "Comment is required" });
  }

  try {
    const result = await InstagramMedia.updateOne(
      { mediaId },
      { $set: { adminComment: comment } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Media not found or comment unchanged" });
    }

    res.json({ message: "Admin comment updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

