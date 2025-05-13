const express = require("express");
const router = express.Router();
const crypto = require("crypto");
router.post("/callback", (req, res) => {
  try {
    // 1. Get exact raw body
    const exactRawBody = req.rawBody;

    // 2. Calculate expected signature
    const hmac = crypto.createHmac("sha256", process.env.DOCUSIGN_HMAC_KEY);
    const expectedSig = hmac.update(exactRawBody).digest("base64");

    // 3. Compare signatures
    if (req.headers["x-docusign-signature"] !== expectedSig) {
      console.log("=== SIGNATURE MISMATCH DETAILS ===");
      console.log("Received:", req.headers["x-docusign-signature"]);
      console.log("Expected:", expectedSig);
      console.log("Raw Body:", exactRawBody);
      throw new Error(
        `Signature verification failed. Expected: ${expectedSig}`
      );
    }

    // 4. Process valid webhook
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({
      error: err.message,
      solution: [
        "1. Copy the EXACT payload from test/sign.js output",
        "2. Use the EXACT signature generated",
        "3. Ensure no trailing spaces/characters in request",
      ],
    });
  }
});
module.exports = router;
