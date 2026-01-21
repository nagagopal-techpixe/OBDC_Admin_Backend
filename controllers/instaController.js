import fetch from "node-fetch";
import dotenv from "dotenv";
import InstagramMedia from "../models/instaimages.js";

dotenv.config();

const ACCESS_TOKEN = process.env.INSTAGRAM_TOKEN;
const INSTAGRAM_ID = process.env.INSTAGRAM_ID;


// Fetch first image in carousel
async function getCarouselImage(parentId) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${parentId}/children?fields=media_type,media_url&access_token=${ACCESS_TOKEN}`
    );

    const json = await res.json();
    if (!json.data) return null;

    const firstImage = json.data.find(c => c.media_type === "IMAGE");
    return firstImage?.media_url || null;

  } catch (err) {
    console.error("Carousel fetch error:", err);
    return null;
  }
}


// Fetch Instagram images
async function fetchInstagramImages(since = null) {

  let url =
    `https://graph.facebook.com/v19.0/${INSTAGRAM_ID}/media` +
    `?fields=id,media_type,media_url,caption,timestamp,children{media_type,media_url}` +
    `&limit=50&access_token=${ACCESS_TOKEN}`;

  if (since) url += `&since=${since}`;

  const images = [];

  while (url) {
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data?.length) break;

    for (const item of json.data) {

      let imageUrl = null;

      if (item.media_type === "IMAGE") {
        imageUrl = item.media_url;
      }

      else if (item.media_type === "CAROUSEL_ALBUM") {
        imageUrl = await getCarouselImage(item.id);
      }

      else continue; // skip video

      if (!imageUrl) continue;

      images.push({
        mediaId: item.id,
        caption: item.caption || "",
        image: imageUrl,

        // store as Date object
        timestamp: new Date(item.timestamp),
      });
    }

    if (since) break;
    url = json.paging?.next || null;
  }

  return images;
}


// FRONTEND API — latest 100
export const getInstagramMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const media = await InstagramMedia.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InstagramMedia.countDocuments();

    res.json({
      data: media,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
};



// CRON — sync only new posts
export const syncInstagramMedia = async () => {


  try {
    const latest = await InstagramMedia
      .findOne()
      .sort({ timestamp: -1 });

    const since = latest
      ? Math.floor(latest.timestamp.getTime() / 1000) - 5
      : null;

    const images = await fetchInstagramImages(since);

    if (!images.length) {
      console.log("ℹ No new Instagram images");
      return;
    }

    for (const img of images) {

      await InstagramMedia.updateOne(
        { mediaId: img.mediaId },

        {
          $setOnInsert: {
            mediaId: img.mediaId,
            timestamp: img.timestamp,   // already a Date()
          },

          $set: {
            caption: img.caption,
            image: img.image,
            url: `https://www.obcd.ai/media/${img.mediaId}`,
          },
        },

        { upsert: true }
      );
    }

    console.log(`✔ Synced ${images.length} Instagram images`);

  } catch (err) {
    console.log("❌ Image sync failed", err);
  }
};
// Helper — fetch latest image URL
async function refreshImageUrl(mediaId) {
  try {
    const url = `https://graph.facebook.com/v19.0/${mediaId}?fields=media_url&access_token=${ACCESS_TOKEN}`;

    const res = await fetch(url);
    const json = await res.json();

    if (!json.media_url) return null;

    return json.media_url;

  } catch (err) {
    console.log("Refresh media_url failed:", err);
    return null;
  }
}
// Refresh ALL image URLs
export const refreshAllImageUrls = async () => {
  try {
    const images = await InstagramMedia.find({}, { mediaId: 1 });

    console.log(` Refreshing image media_url for ${images.length} images`);

    for (const img of images) {
      const newUrl = await refreshImageUrl(img.mediaId);
      if (!newUrl) continue;

      await InstagramMedia.updateOne(
        { mediaId: img.mediaId },
        { $set: { image: newUrl } }
      );
    }

    console.log("✔ image media_url refresh completed");

  } catch (err) {
    console.log("❌ image media_url refresh failed", err);
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

