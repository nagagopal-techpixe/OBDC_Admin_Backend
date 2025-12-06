import dotenv from "dotenv";
import { processCommentEvent } from "../services/instagramService.js";

dotenv.config();

// STEP 1: VERIFY WEBHOOK
export const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
};

// STEP 2: RECEIVE REAL-TIME EVENTS
export const receiveWebhook = async (req, res) => {
  console.log(" Webhook POST received:", req.body);

  try {
    const body = req.body;
    if (body.object === "instagram") {
      await processCommentEvent(body);
      return res.sendStatus(200);
    }
  } catch (err) {
    console.log("Webhook Error:", err);
  }
  res.sendStatus(404);
};
