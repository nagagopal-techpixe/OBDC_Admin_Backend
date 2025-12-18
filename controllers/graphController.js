// import fetch from "node-fetch";
// import InstagramMedia from "../models/instaimages.js";
// import InstagramVideo from "../models/instavideos.js";
// import comment from "../models/commentModel.js"

// const ACCESS_TOKEN = process.env.INSTAGRAM_TOKEN;
// const INSTAGRAM_ID = process.env.INSTAGRAM_ID;

// // STEP 1 — Get all media from Instagram
// async function getAllMedia() {
//   const url = `https://graph.facebook.com/v19.0/${INSTAGRAM_ID}/media?fields=id,caption&access_token=${ACCESS_TOKEN}`;
//   const res = await fetch(url);
//   const data = await res.json();
//   return data.data;
// }

// // STEP 2 — Get comments for a single media
// async function getCommentsForMedia(mediaId) {
//   const url = `https://graph.facebook.com/v19.0/${mediaId}/comments?fields=id,text,username,timestamp&access_token=${ACCESS_TOKEN}`;
//   const res = await fetch(url);
//   const data = await res.json();
//   return data.data || [];
// }

// // STEP 3 — Match logic for both DBs
// export async function getMatchedMediaCommentsData() {
//   const photoDB = await InstagramMedia.find();
//   const videoDB = await InstagramVideo.find();

//   const allDBMedia = [...photoDB, ...videoDB];
//   const igMediaList = await getAllMedia();

//   let matchedMedia = [];

//   for (const igMedia of igMediaList) {
//     const dbMedia = allDBMedia.find(x => x.mediaId === igMedia.id);
//     if (!dbMedia) continue;

//     const comments = await getCommentsForMedia(igMedia.id);

//     const isMatched = comments.some(
//       c =>
//         c.text?.trim().toLowerCase() ===
//         dbMedia.adminComment?.trim().toLowerCase()
//     );

//     if (isMatched) {
//       matchedMedia.push({
//         mediaId: igMedia.id,
//         caption: igMedia.caption,
//         adminComment: dbMedia.adminComment,
//         comments,
//         image: dbMedia.image || null,
//         video: dbMedia.video || null,
//       });
//     }
//   }

//   return matchedMedia;
// }

// export const getMatchedMediaComments = async (req, res) => {
//   try {
//     const matchedMedia = await getMatchedMediaCommentsData();
//     res.json(matchedMedia);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// export const getSingleMatchedMedia = async (req, res) => {
//   try {
//     const mediaId = req.params.mediaId;
//     const photo = await InstagramMedia.findOne({ mediaId });
//     const video = await InstagramVideo.findOne({ mediaId });
//     const dbMedia = photo || video;

//     if (!dbMedia) return res.status(404).json({ message: "Media not found" });

//     const comments = await getCommentsForMedia(mediaId);

//     res.json({
//       mediaId,
//       caption: dbMedia.caption,
//       adminComment: dbMedia.adminComment,
//       comments,
//       image: dbMedia.image || null,
//       video: dbMedia.video || null,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



// export const urls = async (req, res) => {
//   try {
//     const matchedMedia = await getMatchedMediaCommentsData();
//     let finalResponse = [];

//     for (const media of matchedMedia) {
//       let dbRecord = await comment.findOne({ mediaId: media.mediaId });

//       if (!dbRecord) {
//         dbRecord = new comment({
//           mediaId: media.mediaId,
//           processedComments: [],
//         });
//       }

//       const newComments = media.comments.filter(
//         (c) => !dbRecord.processedComments.includes(c.id)
//       );

//       if (newComments.length === 0) continue;

//       // ✅ One response per comment
//       for (const c of newComments) {
//         finalResponse.push({
//           mediaId: media.mediaId,
//           commentId: c.id,
//           url: `obcd.ai/media/${media.mediaId}`,
//         });

//         dbRecord.processedComments.push(c.id); // ONLY ONCE
//       }

//       await dbRecord.save();
//     }

//     res.json(finalResponse);

//   } catch (err) {
//     console.error("URLs ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// };




// export const found = async (req, res) => {
//   try {
//     const { mediaId } = req.params;

//     // Check in images collection
//     const image = await InstagramMedia.findOne({ mediaId });

//     // Check in videos collection
//     const video = await InstagramVideo.findOne({ mediaId });

//     if (!image && !video) {
//       return res.json({
//         found: false,
//         message: "Media not found in DB",
//       });
//     }

//     return res.json({
//       found: true,
//       mediaType: image ? "image" : "video",
//       media: image || video,
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

import fetch from "node-fetch";
import InstagramMedia from "../models/instaimages.js";
import InstagramVideo from "../models/instavideos.js";
import Comment from "../models/commentModel.js";

// ================== CONFIG ==================
const ACCESS_TOKEN = "EAAcxezZA5bxwBQBKvIBFnv6ZAZAS8yMqu6Aj8oZAmQkZCeyZAzVqiHxa52PTgEmDZAS3x020sCZBkXSKuyFUNJuDYExl6KI1cgZAf7dwX5fTLGkBTLk7fepkHKEtXJN2phSQ3lICEyW7KBQPfg2gvU1CeC1cXtnjpE0Fvr8ME5d6QZA4UkEXvDvjlCKIM76Sil67VxM2iiTZByAjMc588BVwVZBIAUYT";
const INSTAGRAM_ID = process.env.INSTAGRAM_ID;
const GRAPH_VERSION = "v19.0";

// ================== STEP 1: GET ALL MEDIA ==================
async function getAllMedia() {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${INSTAGRAM_ID}/media?fields=id,caption&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data || [];
}

// ================== STEP 2: GET COMMENTS ==================
async function getCommentsForMedia(mediaId) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}/comments?fields=id,text,username,timestamp&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data || [];
}

// ================== STEP 3: MATCH MEDIA ==================
async function getMatchedMediaCommentsData() {
  const photoDB = await InstagramMedia.find();
  const videoDB = await InstagramVideo.find();
  const allDBMedia = [...photoDB, ...videoDB];

  const igMediaList = await getAllMedia();
  let matchedMedia = [];

  for (const igMedia of igMediaList) {
    const dbMedia = allDBMedia.find(x => x.mediaId === igMedia.id);
    if (!dbMedia) continue;

    const comments = await getCommentsForMedia(igMedia.id);

    // ✅ Filter only comments that match adminComment
    const matchedComments = comments.filter(
      c =>
        c.text?.trim().toLowerCase() ===
        dbMedia.adminComment?.trim().toLowerCase()
    );

    // Only add media if there is at least one matched comment
    if (matchedComments.length > 0) {
      matchedMedia.push({
        mediaId: igMedia.id,
        caption: igMedia.caption,
        adminComment: dbMedia.adminComment,
        comments: matchedComments, // only matched comments
      });
    }
  }
  return matchedMedia;
}


// ================== STEP 4: AUTO-REPLY HELPER ==================
async function replyToComment(commentId, message) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${commentId}/replies`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      access_token: ACCESS_TOKEN,
    }),
  });

  const data = await res.json();

  if (data.error) {
    console.error("Reply error:", data.error);
    return false;
  }
  return true;
}

// ================== STEP 5: MAIN AUTO-REPLY LOGIC ==================
async function getNewCommentsForAutoReply() {
  const matchedMedia = await getMatchedMediaCommentsData();
  let finalResponse = [];

  for (const media of matchedMedia) {
    let dbRecord = await Comment.findOne({ mediaId: media.mediaId });

    if (!dbRecord) {
      dbRecord = new Comment({
        mediaId: media.mediaId,
        processedComments: [],
      });
    }

    const newComments = media.comments.filter(
      c => !dbRecord.processedComments.includes(c.id)
    );

    for (const c of newComments) {
      finalResponse.push({
        mediaId: media.mediaId,
        commentId: c.id,
      });

      dbRecord.processedComments.push(c.id);
    }

    await dbRecord.save();
  }

  return finalResponse;
}

// ================== API 1: JUST GET URL DATA ==================
export const urls = async (req, res) => {
  try {
    const list = await getNewCommentsForAutoReply();
    res.json(
      list.map(item => ({
        mediaId: item.mediaId,
        commentId: item.commentId,
        url: `https://obcd.ai/media/${item.mediaId}`,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================== API 2: AUTO REPLY ==================
export const autoReply = async (req, res) => {
  try {
    const commentList = await getNewCommentsForAutoReply();
    let result = [];

    for (const item of commentList) {
      // Build URL here
        const mediaUrl = `https://obcd.ai/media/${item.mediaId}`;

      const success = await replyToComment(
        item.commentId,
        `Thanks for your comment! 😊\nHere’s your link:\n${mediaUrl}`,
      );

      result.push({
        mediaId: item.mediaId,
        commentId: item.commentId,
        replied: success,
      });

      // ⏳ Delay to avoid Instagram rate limit
      await new Promise(r => setTimeout(r, 1500));
    }

    res.json(result);
  } catch (err) {
    console.error("AUTO REPLY ERROR:", err);
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

