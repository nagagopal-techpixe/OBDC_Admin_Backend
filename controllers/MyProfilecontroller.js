import User from "../models/user.js";

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // exclude password
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Provide defaults if DB fields are empty
    const userData = {
      fullName: user.fullName || "No Name",
      email: user.email,
      phone: user.phone || "",
      profileImage: user.profileImage || "https://i.pravatar.cc/100",
      role: user.role,
    };

    res.json({ success: true, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE logged-in user profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, profileImage } = req.body;

    // Find user by id from JWT (set in auth middleware)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Update fields if provided, else keep existing or default
    user.fullName = fullName !== undefined ? fullName : user.fullName || "No Name";
    user.phone = phone !== undefined ? phone : user.phone || "";
    user.profileImage = profileImage !== undefined ? profileImage : user.profileImage || "https://i.pravatar.cc/100";

    await user.save();

    // Return updated user
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
