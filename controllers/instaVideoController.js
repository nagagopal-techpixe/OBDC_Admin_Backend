import fetch from "node-fetch";
import dotenv from "dotenv";
import InstagramVideo from "../models/instavideos.js";

dotenv.config();

const ACCESS_TOKEN = process.env.INSTAGRAM_TOKEN;
const INSTAGRAM_ID = process.env.INSTAGRAM_ID;

// Fetch videos inside a carousel
async function getCarouselVideos(parentId) {
  try {
    const url = `https://graph.facebook.com/v19.0/${parentId}/children?fields=id,media_type,media_url&access_token=${ACCESS_TOKEN}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data) return [];

    // Only keep VIDEO children
    return json.data
      .filter((child) => child.media_type === "VIDEO")
      .map((child) => ({
        mediaId: child.id,
        video: child.media_url,
      }));
  } catch (err) {
    console.error("Carousel Video Fetch Error:", err);
    return [];
  }
}

// Fetch all Instagram posts and extract videos
async function fetchInstagramVideos() {
  let url = `https://graph.facebook.com/v19.0/${INSTAGRAM_ID}/media?fields=id,media_type,media_url,caption,timestamp,children{media_type,media_url}&limit=100&access_token=${ACCESS_TOKEN}`;
  const videos = [];

  while (url) {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.data) break;

    for (const item of json.data) {
      // Top-level VIDEO
      if (item.media_type === "VIDEO") {
        videos.push({
          mediaId: item.id,
          caption: item.caption || "",
          video: item.media_url,
          timestamp: item.timestamp,
        });
      }

      // CAROUSEL_ALBUM → check children
      if (item.media_type === "CAROUSEL_ALBUM" && item.children?.data) {
        const childVideos = item.children.data
          .filter((c) => c.media_type === "VIDEO")
          .map((c) => ({
            mediaId: c.id,
            caption: item.caption || "", // inherit parent caption
            video: c.media_url,
            timestamp: item.timestamp,
          }));

        videos.push(...childVideos);
      }
    }

    url = json.paging?.next || null;
  }

  return videos;
}

// ⭐ FRONTEND API → FAST RESPONSE
export const getInstagramVideos = async (req, res) => {
  try {
    const latest100 = await InstagramVideo.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(latest100);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
};

// ⭐ CRON JOB FUNCTION → Sync videos
export const syncInstagramVideos = async () => {
  try {
    const videos = await fetchInstagramVideos();

    for (const v of videos) {
      await InstagramVideo.updateOne(
        { mediaId: v.mediaId },
        { $set: v },
        { upsert: true }
      );
    }

    console.log("✔ Instagram videos synced");
  } catch (e) {
    console.log("❌ Sync failed", e);
  }
};

// Update prompt
export const updateVideoPrompt = async (req, res) => {
  const { mediaId } = req.params;
  await InstagramVideo.updateOne(
    { mediaId },
    { $set: { prompt: req.body.prompt } }
  );
  res.json({ message: "Prompt Updated" });
};

// Update tool
export const updateVideoTool = async (req, res) => {
  const { mediaId } = req.params;
  await InstagramVideo.updateOne(
    { mediaId },
    { $set: { tool: req.body.tool } }
  );
  res.json({ message: "Tool Updated" });
};

export const updatedVideoComment = async (req, res) => {
  const { mediaId } = req.params;
  const { comment } = req.body; 

  if (!comment) {
    return res.status(400).json({ message: "Comment is required" });
  }

  try {
    const result = await InstagramVideo.updateOne(
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
