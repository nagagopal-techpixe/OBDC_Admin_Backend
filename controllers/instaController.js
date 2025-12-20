import fetch from "node-fetch";
import dotenv from "dotenv";
import InstagramMedia from "../models/instaimages.js";

dotenv.config();

const ACCESS_TOKEN = process.env.INSTAGRAM_TOKEN;
const INSTAGRAM_ID = process.env.INSTAGRAM_ID;

// Fetch first image from a carousel
async function getCarouselImage(parentId) {
  try {
    const url = `https://graph.facebook.com/v19.0/${parentId}/children?fields=media_type,media_url&access_token=${ACCESS_TOKEN}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data) return null;

    // Only take the FIRST IMAGE in the carousel
    const firstImage = json.data.find((c) => c.media_type === "IMAGE");
    return firstImage?.media_url || null;
  } catch (err) {
    console.error("Carousel Image Fetch Error:", err);
    return null;
  }
}

// Fetch all Instagram image posts
async function fetchInstagramImages(since = null) {
  let url = `https://graph.facebook.com/v19.0/${INSTAGRAM_ID}/media?fields=id,media_type,media_url,caption,timestamp,children{media_type,media_url}&limit=50&access_token=${ACCESS_TOKEN}`;

  if (since) url += `&since=${since}`;

  const images = [];

  while (url) {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.data || json.data.length === 0) break;

    for (const item of json.data) {
      let imageUrl = null;

      // IMAGE post
      if (item.media_type === "IMAGE") {
        imageUrl = item.media_url;
      }

      // CAROUSEL → get first image
      else if (item.media_type === "CAROUSEL_ALBUM") {
        imageUrl = await getCarouselImage(item.id);
      }

      // Skip VIDEO
      else continue;

      if (!imageUrl) continue;

      images.push({
        mediaId: item.id,
        caption: item.caption || "",
        image: imageUrl,
        timestamp: new Date(item.timestamp),
      });
    }

    // If using 'since', no need for pagination
    if (since) break;

    url = json.paging?.next || null;
  }

  return images;
}

// ⭐ FRONTEND API → return latest 100 images
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

// ⭐ CRON JOB → sync only new images
export const syncInstagramMedia = async () => {
  try {
    const latest = await InstagramMedia.findOne().sort({ timestamp: -1 });
    // console.log("latest",latest)
    const since = latest
      ? Math.floor(new Date(latest.timestamp).getTime() / 1000) - 5
      : null;
      // console.log("since",since)
    const images = await fetchInstagramImages(since);

    if (images.length === 0) {
      console.log("ℹ No new Instagram images");
      return;
    }
    for (const img of images) {
      await InstagramMedia.updateOne(
        { mediaId: img.mediaId },
        {
          $set: {
            ...img,
            url: `https://www.obcd.ai/media/${img.mediaId}`,
          },
        },
        { upsert: true }
      );
    }

    console.log(`✔ Synced ${images.length} new Instagram images`);
  } catch (err) {
    console.log("❌ Image sync failed", err);
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

