// controllers/contractController.js
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const MyContract = require("../models/MyContract");

// Configure email transporter (example using Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "junaid17chk@gmail.com",
    pass: "cgtyxnjtxducuamy",
  },
});

// Upload directory
const uploadDir = path.join(__dirname, "../../contracts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.createMultiContracts = async (req, res) => {
  try {
    const { investorEmails, entrepreneurEmails, contractName, terms } =
      req.body;

    // Parse email arrays
    const investors = JSON.parse(investorEmails || "[]");
    const entrepreneurs = JSON.parse(entrepreneurEmails || "[]");

    // Validate at least one recipient exists
    if (investors.length === 0 && entrepreneurs.length === 0) {
      return res.status(400).json({
        message: "At least one investor or entrepreneur email is required",
      });
    }

    // Process file upload if exists
    let fileData = {};
    if (req.file) {
      fileData = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      };
    }

    // Create contracts for all recipients
    const contracts = [];
    let sentCount = 0;

    // Process investors
    for (const email of investors) {
      const contract = new MyContract({
        email,
        userType: "investor",
        contractName,
        terms,
        ...fileData,
      });
      contracts.push(contract.save());
      sentCount++;
    }

    // Process entrepreneurs
    for (const email of entrepreneurs) {
      const contract = new MyContract({
        email,
        userType: "entrepreneur",
        contractName,
        terms,
        ...fileData,
      });
      contracts.push(contract.save());
      sentCount++;
    }

    await Promise.all(contracts);

    // Send emails to all recipients
    if (req.file) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        subject: `New Contract: ${contractName}`,
        text: `You have received a new contract.\n\nTerms: ${terms}\n\nPlease find the attached document.`,
        attachments: [
          {
            filename: req.file.originalname,
            path: req.file.path,
          },
        ],
      };

      const allRecipients = [...investors, ...entrepreneurs];
      for (const recipient of allRecipients) {
        try {
          await transporter.sendMail({
            ...mailOptions,
            to: recipient,
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${recipient}:`, emailError);
        }
      }
    }

    res.status(201).json({
      message: "Contracts created and sent successfully",
      sentCount,
    });
  } catch (error) {
    console.error("Error creating multiple contracts:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getContractsByEmail = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email query is required" });
  }

  try {
    const contracts = await MyContract.find({ email });

    // Clean up file paths for frontend use
    const sanitizedContracts = contracts.map((contract) => {
      const fileName = path.basename(contract.filePath); // extract just the filename
      return {
        ...contract._doc,
        filePath: `contracts/${fileName}`, // public path
      };
    });

    res.status(200).json({ contracts: sanitizedContracts });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({ message: "Server error" });
  }
};
