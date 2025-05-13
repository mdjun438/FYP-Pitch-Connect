const docusign = require("docusign-esign");
const fs = require("fs");

async function getApiClient() {
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

  return apiClient;
}

async function sendDocuSignEnvelopeUsingTemplate({
  receiverEmail,
  receiverName,
  templateId,
}) {
  const apiClient = await getApiClient();
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.templateId = templateId;
  envelopeDefinition.status = "sent";
  envelopeDefinition.brandId = process.env.DOCUSIGN_BRAND_ID;

  envelopeDefinition.templateRoles = [
    {
      email: receiverEmail,
      name: receiverName,
      roleName: "Signer",
      recipientId: "1",
      clientUserId: "1234", // Required for embedded signing
    },
  ];

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

async function generateRecipientViewUrl({
  envelopeId,
  receiverEmail,
  receiverName,
}) {
  const apiClient = await getApiClient();
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  const viewRequest = new docusign.RecipientViewRequest();
  viewRequest.returnUrl = "http://localhost:3000/social-prosperity"; // ✅ Your local dev redirect
  viewRequest.authenticationMethod = "none";
  viewRequest.email = receiverEmail;
  viewRequest.userName = receiverName;
  viewRequest.recipientId = "1";
  viewRequest.clientUserId = "1234"; // ✅ Must match templateRoles

  try {
    const result = await envelopesApi.createRecipientView(
      process.env.DOCUSIGN_ACCOUNT_ID,
      envelopeId,
      { recipientViewRequest: viewRequest }
    );
    return result;
  } catch (error) {
    console.error("Error generating signing URL:", error);
    throw new Error("Failed to generate signing URL.");
  }
}

module.exports = {
  sendDocuSignEnvelopeUsingTemplate,
  generateRecipientViewUrl,
};
