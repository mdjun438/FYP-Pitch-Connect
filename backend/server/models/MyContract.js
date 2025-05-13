// models/Contract.js
const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ["investor", "entrepreneur"],
      required: true,
    },
    contractName: {
      type: String,
      required: true,
    },
    terms: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
    },
    filePath: {
      type: String,
    },
    fileType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MyContract", contractSchema);
