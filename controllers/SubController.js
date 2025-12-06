import Subscriber from "../models/Subscriber.js";
import InstagramMedia from "../models/instaimages.js";
import InstagramVideo from "../models/instavideos.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const subscribe = async (req, res) => {
  const { email, mediaId } = req.body;

  if (!email || !mediaId) {
    return res.status(400).json({ message: "Email and mediaId are required" });
  }

  try {
    // 1️⃣ Find media in both image and video collections
    let media = await InstagramMedia.findOne({ mediaId });
    let type = "image";

    if (!media) {
      media = await InstagramVideo.findOne({ mediaId });
      type = "video";
    }

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // 2️⃣ Save subscriber to DB
    const subscriberData =
      type === "video"
        ? { email, media_url: media.video }
        : { email, media_url: media.image };

    const subscriber = new Subscriber(subscriberData);
    await subscriber.save();

    // 3️⃣ Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nagagopalchimata566@gmail.com",
        pass: process.env.pass, // Gmail App password
      },
    });

    // 4️⃣ Prepare media HTML safely
    const mediaHtml =
      type === "video" && media.video
        ? `<video src="${media.video}" width="400" controls></video>`
        : type === "image" && media.image
        ? `<img src="${media.image}" width="400"/>`
        : `<p>No media available</p>`;

    // 5️⃣ Prepare email content
    const mailOptions = {
      from: "nagagopalchimata566@gmail.com",
      to: email,
      subject: "Thanks for subscribing!",
      html: `
        <h2>Welcome!</h2>
        <p>Thanks for subscribing. Here's the Instagram media you clicked:</p>
        <ul>
          <li><b>Prompt:</b> ${media.prompt || "N/A"}</li>
          <li><b>Tool:</b> ${media.tool || "N/A"}</li>
        
        </ul>
        <p>You will now receive exclusive updates from us.</p>
      `,
    };

    // 6️⃣ Send email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Successfully email sent!" });
  } catch (error) {
    console.error("Subscribe Error:", error);
    res
      .status(500)
      .json({ message: "Error saving data or sending email", error: error.message });
  }
};
