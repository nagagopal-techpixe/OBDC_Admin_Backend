import sendMessage from "../controllers/messageController.js";

export const processCommentEvent = async (body) => {
  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];

  if (change.field === "comments") {

    const commentText = change.value.text;
    const userId = change.value.from.id;

    console.log("💬 New Comment:", commentText, "From:", userId);

    // KEYWORD CHECK
    if (commentText.toLowerCase().includes("info")) {
      await sendMessage(userId, "Thanks for commenting! Here is the info you requested.");
    }
  }
};


