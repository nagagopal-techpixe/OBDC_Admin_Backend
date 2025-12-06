import express from "express";
import { signup, login,resetPassword ,forgotPassword} from "../controllers/authController.js";
import { subscribe } from "../controllers/SubController.js";
import {adminOnly} from "../middleware/adminOnly.js"
import {protect} from "../middleware/authMiddleware.js"
import { getMyProfile, updateProfile } from "../controllers/MyProfilecontroller.js";
import getFacebookPosts from "../controllers/FacebookPosts.js";
import { verifyWebhook, receiveWebhook } from "../controllers/webhookController.js";
import {processCommentEvent} from "../services/instagramService.js"
import { getMatchedMediaComments ,getSingleMatchedMedia,getMatchedMediaCommentsData,found,urls} from "../controllers/graphController.js";
import { 
  getInstagramMedia, 
  updatePrompt, 
  updateTool,
  updatedComment,
  syncInstagramMedia 
} from "../controllers/instaController.js";

import {
  getInstagramVideos,
  syncInstagramVideos,
  updateVideoPrompt,
  updateVideoTool,
  updatedVideoComment
} from "../controllers/instaVideoController.js";

import { getInstagramStats, updateInstagramStatsCron } from "../controllers/DashboardController.js";
// import { forgotPassword } from "../controllers/authController.js";
import { getMedia,frontendSync } from "../controllers/frontendcontroller.js";

const router = express.Router();

router.get("/media", getMedia);
router.post("/media/sync", async (req, res) => {
  try {
    await frontendSync(); // call your CRON function
    res.json({ message: "Instagram media frontend sucessfull " });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/facebook-posts", getFacebookPosts);

// Auth
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Subscribe
router.post("/subscribe", subscribe);

// Instagram Media
router.get("/instagram", getInstagramMedia);      
router.post("/instagram/sync", async (req, res) => {
  try {
    await syncInstagramMedia(); // call your CRON function
    res.json({ message: "Instagram media synced successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Stats
router.get("/instagram/stats", protect, adminOnly, getInstagramStats);
router.post("/instagram/latest", async (req, res) => {
  try {
    await updateInstagramStatsCron();
    res.json({ message: "Stats updated successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Editor updates
router.put("/prompt/:mediaId", updatePrompt);
router.put("/tool/:mediaId", updateTool);
router.put("/comment/:mediaId",updatedComment)


//videos
// FRONTEND API → fetch latest videos (fast)
router.get("/videos", getInstagramVideos);

// ADMIN/CRON → force sync from Instagram
router.post("/videos/sync", async (req, res) => {
  await syncInstagramVideos();
  res.json({ message: "Videos synced" });
});

// UPDATE prompt or tool per video
router.put("/videos/prompt/:mediaId", updateVideoPrompt);
router.put("/videos/tool/:mediaId", updateVideoTool);
router.put("/videos/comment/:mediaId",updatedVideoComment)

//profile 
router.get("/profile", protect, getMyProfile);
router.put("/update", protect, updateProfile);
//web
router.get("/webhook", verifyWebhook);
router.post("/webhook", receiveWebhook);

// router.get("/check-comments", fetchCommentsAndReply); 
router.get("/instagram/comments", getMatchedMediaComments);
router.get("/instagram/comments/:mediaId", getSingleMatchedMedia);


//new


router.get("/instagram/urls", urls)

router.get("/media/:mediaId", found);


export default router;
