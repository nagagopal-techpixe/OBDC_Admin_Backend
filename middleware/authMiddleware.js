import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  // console.log("token",token)
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // console.log(req.user.id)
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

