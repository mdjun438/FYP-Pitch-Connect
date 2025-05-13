// routes/docusignWebhook.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const downloadDocument = require("../../services/docusignService");

// Webhook endpoint
router.post("/docusign/callback", async (req, res) => {
  try {
    const { event, envelopeId } = req.body;

    if (event === "envelope-completed") {
      // 1. Download the signed document
      const documentBuffer = await downloadDocument(envelopeId);

      // 2. Save to your database or filesystem
      const filePath = path.join(
        __dirname,
        "../contracts",
        `${envelopeId}.pdf`
      );
      fs.writeFileSync(filePath, documentBuffer);

      // 3. Update your database (example using Mongoose)
      await Contract.findOneAndUpdate(
        { envelopeId },
        {
          status: "completed",
          signedDocument: filePath,
          completedAt: new Date(),
        }
      );

      // 4. Notify users via chat
      await notifyUsers(envelopeId);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error processing webhook");
  }
});

module.exports = router;
