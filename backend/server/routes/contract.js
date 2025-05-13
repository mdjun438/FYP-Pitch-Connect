const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getContractsByEmail,
  createMultiContracts,
} = require("../controllers/contract");

// Define custom storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../contracts")); // Ensure full path
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Save with original name
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Multi-recipient contract endpoint
router.post("/multi", upload.single("contractFile"), createMultiContracts);

router.get("/by-email", getContractsByEmail);

module.exports = router;
