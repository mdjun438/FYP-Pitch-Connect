const crypto = require("crypto");

// // Validate environment variable
// if ("oDGlCjQ11pcOwkHD5+xEnxgdyM8/QjeIL+TzO4Hfy18=") {
//   console.error("❌ Error: DOCUSIGN_HMAC_KEY is missing from .env file");
//   console.log("💡 Solution: Add this to your .env file:");
//   console.log("DOCUSIGN_HMAC_KEY=your_secret_key_from_docusign_console");
//   process.exit(1);
// }

// Sample payload (modify as needed)
const payload = JSON.stringify({
  event: "envelope-completed",
  envelopeId: "12345",
  status: "completed",
  timestamp: new Date().toISOString(),
});

// Generate signature
const hmac = crypto.createHmac(
  "sha256",
  "oDGlCjQ11pcOwkHD5+xEnxgdyM8/QjeIL+TzO4Hfy18="
);
hmac.update(payload);
const signature = hmac.digest("base64");
console.log(signature); // Output just the signature

console.log("✅ Test Signature Generated\n");
console.log("HTTP Headers to Use:");
console.log(`x-docusign-signature: ${signature}`);
console.log(`content-type: application/json\n`);
console.log("Sample Request Body:");
console.log(payload);

// Generate curl command
console.log("\n📋 Curl Test Command:");
console.log(`curl -X POST http://localhost:8080/api/docusign/callback \\
  -H "Content-Type: application/json" \\
  -H "x-docusign-signature: ${signature}" \\
  -d '${payload}'`);
