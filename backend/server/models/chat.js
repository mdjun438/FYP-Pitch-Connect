const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const chatSchema = mongoose.Schema(
  {
    sender: {
      type: ObjectId,
      required: true,
    },
    receiver: {
      type: ObjectId,
      required: true,
    },
    chat: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chat", chatSchema);
