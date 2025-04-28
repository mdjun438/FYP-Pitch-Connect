// docusign.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { sendDocuSignEnvelope } = require("../docusignService");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/send", upload.single("file"), async (req, res) => {
  const file = req.file;
  const { senderEmail, receiverEmail, receiverName, fileName } = req.body;

  if (!file || !receiverEmail || !receiverName) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const result = await sendDocuSignEnvelope({
      filePath: file.path,
      fileName: fileName || file.originalname,
      senderEmail,
      receiverEmail,
      receiverName,
    });
    res.json({ success: true, envelope: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    fs.unlinkSync(file.path); // delete after sending
  }
});

module.exports = router;
