import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, "Full name is required"],
    validate: {
      validator: function(v) {
        return /^[A-Za-z\s]+$/.test(v); // Only letters and spaces
      },
      message: props => `${props.value} is not a valid full name!`
    }
  },
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: { 
    type: String, 
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
    validate: {
      validator: function(v) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(v);
      },
      message: props => `Password must have uppercase, lowercase letters and a number`
    }
  },
  role: {
  type: String,
  enum: ["admin", "user"],
  default: "user",
},
phone: {
    type: String,
    default: "", // can be empty initially
    validate: {
      validator: function(v) {
        return !v || /^[0-9]{10,15}$/.test(v); // optional, 10-15 digits
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  profileImage: {
    type: String,
    default: "https://i.pravatar.cc/100" // default profile image
  },
resetPasswordToken: String, 
resetPasswordExpire: Date,  

}, { timestamps: true });

export default mongoose.model("User", userSchema);
