const express = require("express");
const {
  sendDocuSignEnvelopeUsingTemplate,
  generateRecipientViewUrl,
} = require("../docusignService");

const router = express.Router();

router.post("/send", async (req, res) => {
  const { receiverEmail, receiverName, templateId } = req.body;

  if (!receiverEmail || !receiverName || !templateId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // Step 1: Send envelope (DocuSign will automatically email the user)
    const envelopeResult = await sendDocuSignEnvelopeUsingTemplate({
      receiverEmail,
      receiverName,
      templateId,
    });

    // Step 2: Generate the signing link manually
    const signingView = await generateRecipientViewUrl({
      envelopeId: envelopeResult.envelopeId,
      receiverEmail,
      receiverName,
    });

    // Step 3: Return both envelope info and signing URL
    res.json({
      success: true,
      envelope: envelopeResult,
      signingUrl: signingView.url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/download/:envelopeId", async (req, res) => {
  try {
    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    // 1. Get document list
    const docs = await envelopesApi.listDocuments(
      process.env.DOCUSIGN_ACCOUNT_ID,
      req.params.envelopeId
    );

    // 2. Download the first document (usually the signed PDF)
    const documentId = docs.envelopeDocuments[0].documentId;
    const document = await envelopesApi.getDocument(
      process.env.DOCUSIGN_ACCOUNT_ID,
      req.params.envelopeId,
      documentId
    );

    // 3. Send to client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=signed_${req.params.envelopeId}.pdf`
    );
    res.send(document);
  } catch (err) {
    console.error("Download failed:", err);
    res.status(500).json({ error: "Failed to download document" });
  }
});

module.exports = router;
