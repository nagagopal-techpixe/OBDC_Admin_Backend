import dotenv from "dotenv";
dotenv.config();

export const createKlaviyoProfile = async ({ email, mediaId, mediaType }) => {
  const url = "https://a.klaviyo.com/api/profiles/";

  const payload = {
    data: {
      type: "profile",
      attributes: {
        email: email,
        properties: {
          source: "Instagram Subscription",
          mediaId: mediaId,
          mediaType: mediaType,
        },
      },
    },
  };

  const headers = {
    Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`,
    "Content-Type": "application/json",
    revision: "2024-10-15",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create profile: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating Klaviyo profile:", error);
    throw error;
  }
};
