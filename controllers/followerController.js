import https from "https";
import Follower from "../models/Follower.js";
import dotenv from "dotenv";
dotenv.config();

const fetchFollowersPage = (username, paginationToken = null) => {
  return new Promise((resolve, reject) => {
    let path = `/userfollowers/?username_or_id=${username}`;

    if (paginationToken) {
      path += `&pagination_token=${encodeURIComponent(paginationToken)}`;
    }

    const options = {
	method: 'GET',
	hostname: 'instagram-scraper-20251.p.rapidapi.com',
	port: null,
	path: '/userfollowers/?username_or_id=djbildt',
	headers: {
		'x-rapidapi-key': 'fac5af089amsh194f50943d50a3ep14a99fjsnc3df5805fa17',
		'x-rapidapi-host': 'instagram-scraper-20251.p.rapidapi.com'
	}
};

    const req = https.request(options, (res) => {
      const chunks = [];

      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
};

export const fetchAndStoreFollowers = async (req, res) => {
  try {
    const { username } = req.params;

    let paginationToken = null;
    let totalFetched = 0;
    let totalSaved = 0;
    let pageCount = 0;

    do {
      pageCount++;

      const response = await fetchFollowersPage(username, paginationToken);

      const followers = response?.data?.items || [];
      paginationToken = response?.pagination_token || null;

      if (!followers.length) break;

      for (const user of followers) {
        await Follower.updateOne(
          { username: user.username },
          {
            $set: {
              username: user.username,
              full_name: user.full_name,
              instagram_id: user.id
            }
          },
          { upsert: true }
        );
        totalSaved++;
      }

      totalFetched += followers.length;

      // 🔒 IMPORTANT: delay to avoid ban
      await new Promise((r) => setTimeout(r, 1200));

      // 🔒 Safety limit (do NOT remove)
      if (pageCount >= 200) break;

    } while (paginationToken);

    return res.json({
      success: true,
      pagesFetched: pageCount,
      totalFetched,
      savedToDB: totalSaved
    });

  } catch (error) {
    console.error("Controller Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};
