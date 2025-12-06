import User from "../models/user.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const signup = async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();

    //const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email },
      //token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    //  console.log(user.role)

    res.json({
      message: "Login successful",
      token,
      // user: {
      //   name: user.fullName,
      //   email: user.email,
      //   role: user.role,
      // },
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // 1️⃣ Find user by email
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  // 2️⃣ Generate random token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // 3️⃣ Hash token before saving to DB
  const hashedToken = await bcrypt.hash(resetToken, 10);

  // 4️⃣ Save hashed token + expiry (15 minutes)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  // 5️⃣ Create reset link
  const resetUrl = `http://localhost:5175/reset-password/${resetToken}`;

  // 6️⃣ Gmail Nodemailer Transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nagagopalchimata566@gmail.com",      // your Gmail
      pass: process.env.pass  // your App Password
    },
  });

  // 7️⃣ Send Email
  try {
    await transporter.sendMail({
      from: "nagagopalchimata566@gmail.com",
      to: user.email,
      subject: "Password Reset Request",
      html: `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Hello!</h2>

    <p>You requested to reset your password for your account.</p>

    <p>Please click the button below to create a new password:</p>

    <a href="${resetUrl}" 
       style="
         display: inline-block; 
         padding: 12px 20px; 
         background-color: #007bff; 
         color: white; 
         text-decoration: none; 
         border-radius: 5px;
         margin-top: 10px;
       ">
      Reset Your Password
    </a>

    <p style="margin-top: 20px;">
      If the button above does not work, copy and paste the link below into your browser:
    </p>
    
    <p style="word-break: break-all;">
      ${resetUrl}
    </p>

    <p style="margin-top: 20px;">
      This link will expire in <strong>15 minutes</strong> for your security.
    </p>

    <p>If you did not request a password reset, you can safely ignore this email.</p>

    <br/>
    <p>Best regards,<br/>Your App Team</p>
  </div>
`

    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return res.status(500).json({ message: "Email sending failed" });
  }


  // 8️⃣ Also show link in console (for testing)
  console.log("Password reset link:", resetUrl);

  res.json({ message: "Password reset link sent to your email" });
};



export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  // 1️⃣ Find user with valid token and unexpired
  const users = await User.find(); // fetch all users (we will filter manually)
  let user = null;

  for (const u of users) {
    if (u.resetPasswordToken) {
      const isMatch = await bcrypt.compare(token, u.resetPasswordToken);
      if (isMatch && u.resetPasswordExpire > Date.now()) {
        user = u;
        break;
      }
    }
  }

  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  // 2️⃣ Update password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  // 3️⃣ Clear token and expiry
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({ message: "Password has been reset successfully" });
};