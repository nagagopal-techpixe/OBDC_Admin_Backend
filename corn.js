import cron from "node-cron";
import fetch from "node-fetch";
import { syncInstagramMedia,refreshAllImageUrls } from "./controllers/instaController.js";
import { updateInstagramStatsCron } from "./controllers/DashboardController.js";
import { syncInstagramVideos,refreshAllMediaUrls } from "./controllers/instaVideoController.js";
import {frontendSync} from "./controllers/frontendcontroller.js"
import { urls } from "./controllers/graphController.js"; 
import { updatePostSubscriberMediaUrls } from "./controllers/postSubscriberCron.js";


cron.schedule("0 1 */3 * *", async () => {
  console.log(" Starting combined cron job...");

  try {
    console.log(" Updating Instagram Media...");
    await syncInstagramMedia();

    console.log(" Updating Instagram Stats...");
    await updateInstagramStatsCron();

    console.log(" Updating Instagram Videos...");
    await syncInstagramVideos();

    console.log("️ Syncing Frontend...");
    await frontendSync();

    console.log("All cron tasks completed successfully!");
  } catch (error) {
    console.error("Cron Job Error:", error);
  }
});

// Runs at 1:00 AM every 3rd day
cron.schedule("0 1 */3 * *", async () => {
    try{
  console.log(" CRON: Refreshing Instagram new videos  media_url");
   await refreshAllMediaUrls();
     console.log("CRON: Refreshing Instagram new images media_url ");
  await refreshAllImageUrls();
    }
    catch (error) {
    console.error("Cron Job Error:", error);
  }
});

//  Daily PostSubscriber mediaUrl sync
// Runs every day at 3:30 AM

cron.schedule("0 1 */3 * *", async () => {
  console.log(" CRON: Updating PostSubscriber media URLs...");

  try {
    await updatePostSubscriberMediaUrls();
    console.log("PostSubscriber media URLs updated successfully!");
  } catch (error) {
    console.error("PostSubscriber Cron Error:", error);
  }
});
