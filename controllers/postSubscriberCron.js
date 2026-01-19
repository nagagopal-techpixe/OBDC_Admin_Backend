import PostSubscriber from "../models/PostSubscriber.js";
import InstagramMedia from "../models/instaimages.js";
import InstagramVideo from "../models/instavideos.js";

export const updatePostSubscriberMediaUrls = async () => {
  const subscribers = await PostSubscriber.find();

  for (const sub of subscribers) {
    let media = await InstagramMedia.findOne({ mediaId: sub.mediaId });
    let type = "image";

    if (!media) {
      media = await InstagramVideo.findOne({ mediaId: sub.mediaId });
      type = "video";
    }

    if (!media) {
      console.warn(`⚠️ Media not found for mediaId: ${sub.mediaId}`);
      continue;
    }

    const latestUrl =
      type === "video" ? media.video : media.image;

    if (latestUrl && latestUrl !== sub.mediaUrl) {
      await PostSubscriber.updateOne(
        { _id: sub._id },
        {
          $set: {
            mediaUrl: latestUrl,
            mediaType: type,
          },
        }
      );

      console.log(`🔁 Updated mediaId: ${sub.mediaId}`);
    }
  }
};
