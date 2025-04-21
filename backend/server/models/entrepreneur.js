// models/passenger.js
const mongoose = require("mongoose");

const entrepreneurSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
    },
    profilePicture: {
      type: [String],
      required: [true, "Profile picture is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    industry: {
      type: String,
      required: [true, "Industry is required"],
    },
    Bios: {
      type: String,
      required: [true, "Bios is required"],
    },
    skills: {
      type: String,
      required: [true, "Skills/Expertise is required"],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    featureTime: {
      type: Date,
      required: false,
    },
    bid: {
      type: Object,
      default: {},
    },
    time: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Entrepreneur", entrepreneurSchema);
