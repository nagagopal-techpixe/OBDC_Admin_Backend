import cron from "node-cron";
import { syncInstagramMedia } from "./controllers/instaController.js";
import { updateInstagramStatsCron } from "./controllers/DashboardController.js";
import { syncInstagramVideos } from "./controllers/instaVideoController.js";
import {frontendSync} from "./controllers/frontendcontroller.js"


cron.schedule("0 2,14 * * *", async () => {
  console.log("🚀 Starting combined cron job...");

  try {
    console.log("📌 Updating Instagram Media...");
    await syncInstagramMedia();

    console.log("📊 Updating Instagram Stats...");
    await updateInstagramStatsCron();

    console.log("🎬 Updating Instagram Videos...");
    await syncInstagramVideos();

    console.log("🖼️ Syncing Frontend...");
    await frontendSync();

    console.log("✅ All cron tasks completed successfully!");
  } catch (error) {
    console.error("❌ Cron Job Error:", error);
  }
});
