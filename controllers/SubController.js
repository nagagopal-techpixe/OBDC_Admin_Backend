import Subscriber from "../models/Subscriber.js";
import InstagramMedia from "../models/instaimages.js";
import InstagramVideo from "../models/instavideos.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
// import logo from "../logo.png"

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
// 3️⃣ Configure Nodemailer with Loopia SMTP
const transporter = nodemailer.createTransport({
  host: "mailcluster.loopia.se",
  port: 587,
  secure: false,
  auth: {
    user: "info@obcd.ai",  // Loopia email
    pass: "info@obcd.ai",   // Loopia mailbox password
  },
  tls: {
    rejectUnauthorized: false
  }
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
      from: "info@obcd.ai",
      to: email,
      subject: "Thanks for subscribing!",
      html: `
        <html>
  <body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial, sans-serif;">
    
    <!-- Container -->
    <div style="
      max-width:480px; 
      margin:30px auto; 
      background:#ffffff; 
      border-radius:12px; 
      padding:30px; 
      box-shadow:0 4px 14px rgba(0,0,0,0.1);
    ">

      <!-- Logo -->
      <div style="text-align:center; margin-bottom:20px;">
        <img 
  src="https://raw.githubusercontent.com/nagagopal-techpixe/OBCD_Admin/main/src/assets/icons/logo.png" 
  alt="Logo" 
  style="width:120px; height:auto;" 
/>

      </div>

      <!-- Title -->
      <h2 style="text-align:center; color:#222; margin:0 0 10px 0; font-size:26px;">
        Welcome!
      </h2>

      <!-- Message -->
      <p style="text-align:center; color:#555; font-size:16px; line-height:24px; margin:10px 0 25px 0;">
        Thanks for subscribing. Here's the Instagram media you clicked:
      </p>

      <!-- Details -->
      <div style="color:#444; font-size:16px; line-height:26px;">
        <p><b>Prompt:</b> ${media.prompt || "N/A"}</p>
        <p><b>Tool:</b> ${media.tool || "N/A"}</p>
      </div>

      <!-- Footer -->
      <p style="text-align:center; color:#666; font-size:15px; margin-top:25px;">
        You will now receive exclusive updates from us.
      </p>

    </div>

  </body>
</html>

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
