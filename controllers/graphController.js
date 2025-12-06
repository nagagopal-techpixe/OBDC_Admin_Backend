import fetch from "node-fetch";
import InstagramMedia from "../models/instaimages.js";
import InstagramVideo from "../models/instavideos.js";
import comment from "../models/commentModel.js"

const ACCESS_TOKEN = process.env.INSTAGRAM_TOKEN;
const INSTAGRAM_ID = process.env.INSTAGRAM_ID;

// STEP 1 — Get all media from Instagram
async function getAllMedia() {
  const url = `https://graph.facebook.com/v19.0/${INSTAGRAM_ID}/media?fields=id,caption&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

// STEP 2 — Get comments for a single media
async function getCommentsForMedia(mediaId) {
  const url = `https://graph.facebook.com/v19.0/${mediaId}/comments?fields=id,text,username,timestamp&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data || [];
}

// STEP 3 — Match logic for both DBs
export async function getMatchedMediaCommentsData() {
  const photoDB = await InstagramMedia.find();
  const videoDB = await InstagramVideo.find();

  const allDBMedia = [...photoDB, ...videoDB];
  const igMediaList = await getAllMedia();

  let matchedMedia = [];

  for (const igMedia of igMediaList) {
    const dbMedia = allDBMedia.find(x => x.mediaId === igMedia.id);
    if (!dbMedia) continue;

    const comments = await getCommentsForMedia(igMedia.id);

    const isMatched = comments.some(
      c =>
        c.text?.trim().toLowerCase() ===
        dbMedia.adminComment?.trim().toLowerCase()
    );

    if (isMatched) {
      matchedMedia.push({
        mediaId: igMedia.id,
        caption: igMedia.caption,
        adminComment: dbMedia.adminComment,
        comments,
        image: dbMedia.image || null,
        video: dbMedia.video || null,
      });
    }
  }

  return matchedMedia;
}

export const getMatchedMediaComments = async (req, res) => {
  try {
    const matchedMedia = await getMatchedMediaCommentsData();
    res.json(matchedMedia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getSingleMatchedMedia = async (req, res) => {
  try {
    const mediaId = req.params.mediaId;
    const photo = await InstagramMedia.findOne({ mediaId });
    const video = await InstagramVideo.findOne({ mediaId });
    const dbMedia = photo || video;

    if (!dbMedia) return res.status(404).json({ message: "Media not found" });

    const comments = await getCommentsForMedia(mediaId);

    res.json({
      mediaId,
      caption: dbMedia.caption,
      adminComment: dbMedia.adminComment,
      comments,
      image: dbMedia.image || null,
      video: dbMedia.video || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const urls = async (req, res) => {
  try {
    const matchedMedia = await getMatchedMediaCommentsData(); // all matched media from Instagram + DB
    let finalResponse = [];

    for (const media of matchedMedia) {
      // Check if this media already exists in Comment collection
      let dbRecord = await comment.findOne({ mediaId: media.mediaId });

      if (!dbRecord) {
        // Create record if not exists
        dbRecord = new comment({ mediaId: media.mediaId, processedComments: [] });
      }

      // Filter only new comments (not processed)
      const newComments = media.comments.filter(
        (c) => !dbRecord.processedComments.includes(c.id)
      );

      if (newComments.length === 0) {
        // Skip media if all comments already processed
        continue;
      }

      // Add only new comments to response
      finalResponse.push({
        mediaId: media.mediaId,
        // image: media.image,
        // video: media.video,
        // adminComment: media.adminComment,
        commentId: newComments[0].id,
        url: `http://localhost:5173/media/${media.mediaId}`,
      });

      // Store processed comment IDs
      newComments.forEach((c) => dbRecord.processedComments.push(c.id));
      await dbRecord.save();
    }

    res.json(finalResponse);

  } catch (err) {
    console.error("URLs ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};



export const found = async (req, res) => {
  try {
    const { mediaId } = req.params;

    // Check in images collection
    const image = await InstagramMedia.findOne({ mediaId });

    // Check in videos collection
    const video = await InstagramVideo.findOne({ mediaId });

    if (!image && !video) {
      return res.json({
        found: false,
        message: "Media not found in DB",
      });
    }

    return res.json({
      found: true,
      mediaType: image ? "image" : "video",
      media: image || video,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
