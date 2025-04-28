const docusign = require("docusign-esign");
const fs = require("fs");

async function sendDocuSignEnvelope({
  filePath,
  fileName,
  receiverEmail,
  receiverName,
}) {
  const apiClient = new docusign.ApiClient();
  apiClient.setOAuthBasePath(
    process.env.DOCUSIGN_AUTH_BASE.replace("https://", "")
  );

  const results = await apiClient.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATOR_KEY,
    process.env.DOCUSIGN_IMPERSONATED_USER_ID,
    "signature",
    fs.readFileSync(process.env.DOCUSIGN_PRIVATE_KEY_PATH),
    3600
  );

  const accessToken = results.body.access_token;
  apiClient.addDefaultHeader("Authorization", `Bearer ${accessToken}`);
  apiClient.setBasePath(process.env.DOCUSIGN_API_BASE);

  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  const fileBase64 = fs.readFileSync(filePath).toString("base64");

  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = "Please sign this document";
  envelopeDefinition.documents = [
    {
      documentBase64: fileBase64,
      name: fileName,
      fileExtension: fileName.split(".").pop(),
      documentId: "1",
    },
  ];

  envelopeDefinition.recipients = {
    signers: [
      {
        email: receiverEmail,
        name: receiverName,
        recipientId: "1",
        routingOrder: "1",
        tabs: {
          signHereTabs: [
            {
              anchorString: "/sig/",
              anchorYOffset: "10",
              anchorUnits: "pixels",
              anchorXOffset: "20",
            },
          ],
        },
      },
    ],
  };

  envelopeDefinition.status = "sent";

  try {
    const result = await envelopesApi.createEnvelope(
      process.env.DOCUSIGN_ACCOUNT_ID,
      { envelopeDefinition }
    );
    return result;
  } catch (error) {
    console.error("Error sending document to DocuSign:", error);
    throw new Error("Failed to send document to DocuSign.");
  }
}

module.exports = { sendDocuSignEnvelope };
