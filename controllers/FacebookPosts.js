// controllers/facebookController.js
import fetch from "node-fetch";
import cors from "cors"; 

// Controller to fetch Facebook Page posts
const getFacebookPosts = async (req, res) => {
  // Use the token that works in curl
  const accessToken = "EAAKYEWZCxDQ4BQILSHfpErueSWdAbUZAZBxX9lSbg331hXLgPrBx0yM15rmO5JBmGXfajV0FjqiXuKkDVkY2DP7ZAPZBnyuZBm4QKHYkUFmXMfbhFVVE1XSOBNf7mUVYO62CsDJg6kIRM7ZAGvIdSlJ4ZBrxBSH7r01ZBw3kiSmfes48HdhibGinsP2HfEZBpOvylwjAh5hHHSdsDF74NqAHmNTVhaFvZBeZBxZABs6uiBO7bsNO16zAX8nszgIAZD";
  const pageId = "317162025412400"; // Replace with your Page ID
  const limit = 10;

  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url&limit=${limit}&access_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data) {
      return res.status(500).json({ success: false, message: "No posts found", data });
    }

    // Normalize to Instagram-like format
    const formattedPosts = data.data.map(post => ({
      id: post.id,
      media_type: post.full_picture ? "IMAGE" : "TEXT",
      media_url: post.full_picture || null,
      caption: post.message || "",
      timestamp: post.created_time
    }));

    res.json({ success: true, data: formattedPosts });
  } catch (error) {
    console.error("Error fetching Facebook posts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch posts", error: error.message });
  }
};

export default getFacebookPosts;
