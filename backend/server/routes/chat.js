const express = require("express");
const {
  sendMessage,
  getMessages,
  getAllChats,
  approveMessage,
  getUserChats,
  getUserData,
} = require("../controllers/chat");
const chatRouter = express.Router();

chatRouter.post("/send-message/:sender/:receiver", sendMessage);
chatRouter.get("/messages/:sender/:receiver", getMessages);
chatRouter.get("/get-all-chats", getAllChats);
chatRouter.post("/moderate-message/:chatId", approveMessage);
chatRouter.get("/get-my-chats/:userId", getUserChats);
chatRouter.get("/get-user-data/:id", getUserData);

module.exports = chatRouter;
