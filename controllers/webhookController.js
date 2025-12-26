import dotenv from "dotenv";
dotenv.config();
const PAGE_ACCESS_TOKEN ="EAAR2Nb5jGxIBQAorTasBjDVfsD593EEdSHk5S7GnFkJWN3ZBUU20ZBkZANZCd4nsXq8bkDiwrjZCedShsIHcH38fnXQsMvLM2VbTNJOyxb6o1t5pMrNZAhW7xA02EZBgK30faVVyZBhZBg9IaaAFv9MVepJmZBZC0OHTk1NhoHy9xZCer72c8WoZBMZCdMjmdvxIriRqCNZCmNPHutAAQFgv1f59EaZC54OI";
const VERIFY_TOKEN = "VERIFY_TOKEN";
import InstagramMedia from "../models/instaimages.js"; 
import InstagramVideo from "../models/instavideos.js"

// STEP 1: VERIFY WEBHOOK
export const verifyWebhook = (req, res) => {
   const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🔹 Webhook verification attempt", { mode, token, challenge });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.log("❌ Webhook verification failed");
  return res.sendStatus(403);

};

// ===================================
// 2️⃣ RECEIVE INSTAGRAM COMMENTS
// ===================================

// adjust path to your model

// Helper: fetch mediaId from comment ID if not in webhook
async function getMediaIdFromComment(commentId) {
  try {
    const url = `https://graph.facebook.com/v21.0/${commentId}?fields=id,text,media&access_token=${PAGE_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.media?.id || null;
  } catch (err) {
    console.error(" Error fetching mediaId from IG API:", err.message);
    return null;
  }
}

export const receiveWebhook = async (req, res) => {
  console.log("📩 Webhook received:", JSON.stringify(req.body, null, 2));
  try {
    const entry = req.body.entry?.[0];

    if (entry?.changes) {
      const change = entry.changes[0];
      const value = change.value;

      if (!value || !value.id) {
        console.log(" No comment ID found in changes");
        return res.sendStatus(200);
      }

      const commentId = value.id;
      const commentText = value.text?.toLowerCase().trim();
      const username = value.from?.username;

      // Try to get mediaId from webhook, fallback to parent_id
      let mediaId = value.media_id || value.parent_id || null;

      // If still null, fetch from Instagram API
      if (!mediaId) {
        mediaId = await getMediaIdFromComment(commentId);
      }

      console.log("🆔 Comment ID:", commentId);
      console.log("📝 Comment Text:", commentText);
      console.log("👤 Username:", username);
      console.log("📸 Media ID:", mediaId);

      const YOUR_IG_USERNAME = "YOUR_INSTAGRAM_USERNAME";
      if (username === YOUR_IG_USERNAME) return res.sendStatus(200);

      // ---------------------------
      // DB-driven logic starts here
      // ---------------------------
      if (!mediaId) {
        console.log("❌ Media ID not found, cannot match DB");
      } else {
        let media = await InstagramMedia.findOne({ mediaId });

if (!media) {
  // If not found in images, check videos
  media = await InstagramVideo.findOne({ mediaId });
}

if (media) {
  const adminComment = media.adminComment?.trim().toLowerCase();
  const incomingComment = commentText?.trim().toLowerCase();

  if (incomingComment === adminComment) {
    const replyMessage = `👉 Check this media: ${media.url}`;
    await sendReply(commentId, replyMessage);
    console.log(" DM sent for media:", mediaId);
  } else {
    console.log(" Comment does not match adminComment, skipping DM");
  }
} else {
  console.log(" Media not found in DB for mediaId:", mediaId);
}

      }

      return res.sendStatus(200);
    }

    // ===== Case 2: Message echo (your own DM) =====
    if (entry?.messaging) {
      entry.messaging.forEach(msg => {
        if (msg.message?.is_echo) {
          console.log("📩 DM Sent:", msg.message);
        }
      });
      return res.sendStatus(200);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(" Webhook error:", err.message);
    return res.sendStatus(200);
  }
};




// ===================================
// 4️⃣ SEND PUBLIC COMMENT REPLY
// ===================================
const IG_BUSINESS_ID = "102862209366036"; // Paste your ID here

async function sendReply(commentId, message) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${IG_BUSINESS_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PAGE_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient: { comment_id: commentId }, // Link the DM to the comment
          message: { text: message }
        })
      }
    );

    const data = await response.json(); // axios.data equivalent

    if (!response.ok) {
      console.error("❌ DM API Error:", data);
      return;
    }

    console.log("📩 DM Sent:", data);

  } catch (err) {
    console.error("❌ DM API Error:", err.message);
  }
}


