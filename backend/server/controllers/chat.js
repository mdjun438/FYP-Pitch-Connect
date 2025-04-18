const asyncHandler = require("express-async-handler");
const Chat = require("../models/chat");
const Entrepreneurs = require("../models/entrepreneur");
const Investors = require("../models/investor");

exports.sendMessage = asyncHandler(async (req, res) => {
  const { sender, receiver, message, senderType, receiverType } = req.body;

  if (!message) {
    res.status(400);
    throw new Error("Please write a message");
  }

  // Find chat regardless of sender-receiver order
  let findChat = await Chat.findOne({
    $or: [
      { sender, receiver },
      { sender: receiver, receiver: sender },
    ],
  });

  if (findChat) {
    // Add new message with "pending" status by default
    findChat.chat.push({
      id: Date.now(),
      message,
      sender,
      receiver,
      senderType,
      receiverType,
      status: "pending", // Default status
    });

    await findChat.save();
    res.send(findChat);
  } else {
    // Create a new chat with "pending" status for the first message
    const newChat = await Chat.create({
      sender,
      receiver,
      chat: [
        {
          id: Date.now(),
          message,
          sender,
          receiver,
          senderType,
          receiverType,
          status: "pending", // Default status
        },
      ],
      senderType,
      receiverType,
    });

    res.send(newChat);
  }
});

// Get messages between 2 users
exports.getMessages = asyncHandler(async (req, res) => {
  const { sender, receiver } = req.params;

  const findChat = await Chat.findOne({
    $or: [
      { sender, receiver },
      { sender: receiver, receiver: sender },
    ],
  });

  if (!findChat) {
    return res.status(404).json({ message: "No chat found between users" });
  }

  res.json(findChat);
});

// Get all chats (admin or debug purpose)
exports.getAllChats = asyncHandler(async (req, res) => {
  try {
    const chats = await Chat.find({}).sort({ createdAt: -1 });

    res.status(200).send(chats);
  } catch (error) {
    res.status(500).send({
      message: "Error fetching chats",
      error: error.message,
    });
  }
});
exports.approveMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { messageId, approved } = req.body;

  if (!chatId || !messageId || typeof approved !== "boolean") {
    res.status(400);
    throw new Error("chatId, messageId, and approved (boolean) are required");
  }

  // Find the chat by ID
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Find message by its ID
  const message = chat.chat.find((msg) => msg.id === Number(messageId));
  if (!message) {
    res.status(404);
    throw new Error("Message not found in chat");
  }

  // Update status
  message.status = approved ? "approved" : "rejected";

  // Mark chat array as modified (important for Mongoose to track nested changes)
  chat.markModified("chat");

  await chat.save();

  res.status(200).json({
    message: `Message has been ${approved ? "approved" : "rejected"}`,
    updatedMessage: message,
  });
});

// Get all chats for a user (no filtering by 'approved' status)
exports.getUserChats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const chats = await Chat.find({
    $or: [{ sender: userId }, { receiver: userId }],
  }).sort({ createdAt: -1 });

  if (!chats || chats.length === 0) {
    res.status(404);
    throw new Error("No chats found");
  }

  res.status(200).json(chats);
});

exports.getUserData = async (req, res) => {
  const { id } = req.params;
  const entrepreneurs = await Entrepreneurs.find();
  const investors = await Investors.find();

  const allUsers = [...entrepreneurs, ...investors];

  const data = allUsers.find((user) => user._id.toString() === id); // Ensure id comparison as string

  if (!data) {
    return res.status(404).send({ message: "User not found" });
  }

  res.send(data);
};
