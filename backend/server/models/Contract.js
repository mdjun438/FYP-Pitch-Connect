const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema({
  envelopeId: { type: String, required: true, unique: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
  participants: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      email: String,
      signed: Boolean,
    },
  ],
  signedDocument: String,
  status: { type: String, enum: ["sent", "completed"], default: "sent" },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

module.exports = mongoose.model("Contract", ContractSchema);
