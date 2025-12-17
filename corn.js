import cron from "node-cron";
import fetch from "node-fetch";
import { syncInstagramMedia } from "./controllers/instaController.js";
import { updateInstagramStatsCron } from "./controllers/DashboardController.js";
import { syncInstagramVideos } from "./controllers/instaVideoController.js";
import {frontendSync} from "./controllers/frontendcontroller.js"
import { urls } from "./controllers/graphController.js"; 


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


cron.schedule("0 2,14 * * *", async () => {
  console.log("⏳ Running TEST cron...");

  try {
    // Capture the final response from urls()
    const finalResponse = await new Promise((resolve, reject) => {
      urls(
        {},
        {
          json: (data) => resolve(data),
          status: () => ({ json: (data) => reject(data) }),
        }
      );
    });

    console.log("Cron Final Response:", finalResponse);

    // 👉 Send finalResponse TO Make.com webhook using fetch
    const webhookUrl = "https://hook.eu2.make.com/2nu4e1etu5qf4r4sd7v9zo59iswawxh1";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalResponse),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status}`);
    }

    console.log("🚀 Sent to Make.com successfully!",finalResponse);
  } catch (error) {
    console.error("❌ Cron Error:", error);
  }
});
