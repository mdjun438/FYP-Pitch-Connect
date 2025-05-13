// services/docusignService.js
const docusign = require("docusign-esign");

async function downloadDocument(envelopeId) {
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(process.env.DOCUSIGN_API_BASE);
  apiClient.addDefaultHeader(
    "Authorization",
    `Bearer ${await getAccessToken()}`
  );

  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  // 1. Get document list
  const docs = await envelopesApi.listDocuments(
    process.env.DOCUSIGN_ACCOUNT_ID,
    envelopeId
  );

  // 2. Download the signed PDF (assuming first document)
  const documentId = docs.envelopeDocuments[0].documentId;
  return await envelopesApi.getDocument(
    process.env.DOCUSIGN_ACCOUNT_ID,
    envelopeId,
    documentId
  );
}

module.exports = downloadDocument;
