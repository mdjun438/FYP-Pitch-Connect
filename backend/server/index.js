const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: ["./.env"] });
require("./config/mongo.js");

const approvalRoutes = require("./routes/approval.js");
const adminRoutes = require("./routes/admin.js");
const userRoutes = require("./routes/user.js");
const investorRoutes = require("./routes/investor.js");
const industryInterestRoutes = require("./routes/industry-interest.js");
const entpreneurRoutes = require("./routes/entrepreneur.js");
const companyRoutes = require("./routes/company.js");
const videoImageRoutes = require("./routes/video-image.js");
const documentRoutes = require("./routes/document.js");
const { errorHandler } = require("../middlewares/errorMiddleware.js");

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/v1/pconnect-app/approval", approvalRoutes);
app.use("/api/v1/pconnect-app/admin", adminRoutes);
app.use("/api/v1/pconnect-app/user", userRoutes);
app.use("/api/v1/pconnect-app/investor", investorRoutes);
app.use("/api/v1/pconnect-app/industry-interest", industryInterestRoutes);
app.use("/api/v1/pconnect-app/entrepreneur", entpreneurRoutes);
app.use("/api/v1/pconnect-app/company", companyRoutes);
app.use("/api/v1/pconnect-app/video-image", videoImageRoutes);
app.use("/api/v1/pconnect-app/documents", documentRoutes);
app.use("/api/chat/", require("./routes/chat.js"));
app.use("*", (req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not exist",
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(errorHandler);

// Create HTTP server.
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Listening on port:: http://localhost:${port}/`);
});
