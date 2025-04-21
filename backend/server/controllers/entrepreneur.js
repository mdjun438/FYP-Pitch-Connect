const User = require("../models/user");
const Entrepreneur = require("../models/entrepreneur");
const upload = require("../../utils/multer");
const { Response } = require("../../utils/response");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(
  "sk_test_51MycIqD2171rDQ1bM2Vo43LraZJVqjoKBvTbP7yl52C5ShEqWmsSrT7kktdyrtUAuRwrOD8HRmqXnfFOXPULc7Xr00A9NYeUOU"
);
// Add a new investor
exports.create = (req, res, next) => {
  upload.single("profilePicture")(req, res, async (err) => {
    if (err) {
      return Response(
        res,
        400,
        "Error during profile picture upload",
        err.message
      );
    }
    let {
      fullName,
      email,
      phoneNumber,
      profilePicture,
      location,
      industry,
      Bios,
      skills,
    } = req.body;

    try {
      const { role, status, _id } = await User.findOne(
        { email },
        { role: 1, status: 1, _id: 1 }
      );
      const entrepreneurEXist = await Entrepreneur.findOne({ email });
      if (entrepreneurEXist) {
        return Response(
          res,
          403,
          "Entrepreneur with this email already exists",
          {}
        );
      }
      profilePicture = `/uploads/${req.file.filename}`;
      let entrepreneur = new Entrepreneur({
        fullName,
        email,
        phoneNumber,
        profilePicture,
        location,
        industry,
        Bios,
        skills,
        time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      entrepreneur = await entrepreneur.save();
      entrepreneur = entrepreneur.toObject(); // Convert to plain object
      entrepreneur.role = role;
      entrepreneur.status = status;
      entrepreneur.authId = _id;
      return Response(
        res,
        201,
        "Entrepreneur Registered Successfully",
        entrepreneur
      );
    } catch (error) {
      return Response(
        res,
        500,
        "Server Error during Entrepreneur Registration",
        error.message
      );
    }
  });
};

// Get all investors
exports.getAll = async (req, res) => {
  try {
    const entrepreneur = await Entrepreneur.find();
    return Response(
      res,
      200,
      "Entrepreneurs Fetched Successfully",
      entrepreneur
    );
  } catch (error) {
    return Response(
      res,
      500,
      "Server Error during Entrepreneur Fetch",
      error.message
    );
  }
};

exports.getEntrepreneur = async (req, res) => {
  try {
    const entrepreneurs = await Entrepreneur.find({}, { _id: 1, email: 1 });
    Response(res, 200, "Entrepreneur Fetched Successfully", entrepreneurs);
  } catch (error) {
    Response(
      res,
      500,
      "Something went wrong during Entrepreneur data fetch",
      error.message
    );
  }
};

// Update investor by ID
exports.updateById = (req, res) => {
  upload.fields([
    { name: "profilePicture", maxCount: 1 }, // For image upload
  ])(req, res, async (err) => {
    if (err) {
      return Response(res, 400, "Error during profile picture upload", {});
    }
    const { fullName, email, phoneNumber, location, industry, Bios, skills } =
      req.body;
    try {
      let entrepreneur = await Entrepreneur.findById(req.params.id);
      if (!entrepreneur) {
        return Response(res, 404, "Entrepreneur Not Found", {});
      }
      const user = await User.findOne({ email }).select("+password");
      // Remove old profile picture from disk if new ones are uploaded
      if (req.files.profilePicture) {
        entrepreneur.profilePicture.forEach((image) => {
          const imagePath = path.join(
            __dirname,
            "../../uploads",
            path.basename(image)
          );
          fs.unlink(imagePath, (err) => {
            if (err) console.error("Failed to delete image:", err);
          });
        });
        // Storing new medial files
        entrepreneur.profilePicture = req.files.profilePicture.map(
          (file) => `/uploads/${file.filename}`
        );
      }

      entrepreneur.fullName = fullName || entrepreneur.fullName;
      entrepreneur.phoneNumber = phoneNumber || entrepreneur.phoneNumber;
      entrepreneur.location = location || entrepreneur.location;
      entrepreneur.industry = industry || entrepreneur.industry;
      entrepreneur.Bios = Bios || entrepreneur.Bios;
      entrepreneur.skills = skills || entrepreneur.skills;

      entrepreneur = await entrepreneur.save();
      entrepreneur = entrepreneur.toObject(); // Convert to plain object
      entrepreneur.role = user.role;
      entrepreneur.status = user.status;
      entrepreneur.authId = user._id;
      return Response(
        res,
        200,
        "Entrepreneur Updated Successfully",
        entrepreneur
      );
    } catch (error) {
      return Response(
        res,
        500,
        "Server Error during Entrepreneur Update",
        error.message
      );
    }
  });
};

// Delete a document by ID
exports.deleteById = async (req, res) => {
  try {
    const entrepreneur = await Entrepreneur.findById(req.params.id);
    if (!entrepreneur) {
      Response(res, 404, "Entrepreneur Not Found", {});
      return;
    }
    // Remove documents from disk
    entrepreneur.profilePicture.forEach((docPath) => {
      const fileName = path.basename(docPath);
      const profilePicPath = path.join(__dirname, "../../uploads", fileName);

      // Check if file exists before attempting to delete
      fs.access(profilePicPath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error("File does not exist:", profilePicPath);
        } else {
          // Async file deletion
          fs.unlink(profilePicPath, (err) => {
            if (err) {
              console.error("Failed to delete entrepreneur:", err);
            } else {
              console.log("Successfully deleted entrepreneur:", profilePicPath);
            }
          });
        }
      });
    });
    await entrepreneur.remove();
    Response(res, 200, "Document Removed Successfully", entrepreneur);
  } catch (error) {
    Response(res, 500, "Error during Document Removal", error.message);
  }
};

exports.findEntrepreneurs = async (req, res) => {
  try {
    const entrepreneurs = await Entrepreneur.aggregate([
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "entrepreneurId",
          as: "companies",
        },
      },
      {
        $unwind: {
          path: "$companies",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "documents",
          localField: "companies._id",
          foreignField: "companyId",
          as: "companies.documents",
        },
      },
      {
        $lookup: {
          from: "videoimages",
          localField: "companies._id",
          foreignField: "companyId",
          as: "companies.videoImages",
        },
      },
      {
        $group: {
          _id: "$_id",
          fullName: { $first: "$fullName" },
          email: { $first: "$email" },
          phoneNumber: { $first: "$phoneNumber" },
          profilePicture: { $first: "$profilePicture" },
          location: { $first: "$location" },
          industry: { $first: "$industry" },
          Bios: { $first: "$Bios" },
          skills: { $first: "$skills" },
          featured: { $first: "$featured" },
          featureTime: { $first: "$featureTime" },
          companies: { $push: "$companies" },
          bid: { $first: "$bid" },
        },
      },
      {
        $sort: { featured: -1, featureTime: -1 }, // Sorting: featured first, then most recent featureTime
      },
    ]);

    Response(res, 200, "Entrepreneur Fetch Successfully", entrepreneurs);
  } catch (error) {
    Response(res, 500, "Error during find Entrepreneur", error.message);
  }
};

exports.createFeatureCheckout = async (req, res) => {
  try {
    const id = req.params.id;
    const findIdea = await Entrepreneur.findById(id);

    if (!findIdea) {
      return Response(res, 404, "Entrepreneur not found");
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Feature Your Idea",
              description: "Feature your idea for 7 days on the platform",
            },
            unit_amount: 1000, // $10 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      allow_promotion_codes: false, // Prevent discount codes (sometimes tied to Link)
      success_url: `http://localhost:3000/payment-success/${id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/feature-cancel`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return Response(res, 500, "Error creating checkout session", error.message);
  }
};

// Handle successful payment and feature the idea
exports.featureSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    const id = req.params.id;

    if (!session_id) {
      return Response(res, 400, "Invalid request, no session ID found");
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return Response(res, 400, "Payment not successful");
    }

    // Find and update the idea
    const findIdea = await Entrepreneur.findById(id);
    if (!findIdea) {
      return Response(res, 404, "Entrepreneur not found");
    }

    findIdea.featured = true;
    findIdea.featureTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await findIdea.save();

    // return res.redirect(`http://localhost:3000/entrepreneur-business`); // Redirect to a confirmation page
  } catch (error) {
    console.error(error);
    return Response(
      res,
      500,
      "Error processing payment success",
      error.message
    );
  }
};

exports.findEntrepreneursFeatured = async (req, res) => {
  try {
    const entrepreneurs = await Entrepreneur.aggregate([
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "entrepreneurId",
          as: "companies",
        },
      },
      {
        $unwind: {
          path: "$companies",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "documents",
          localField: "companies._id",
          foreignField: "companyId",
          as: "companies.documents",
        },
      },
      {
        $lookup: {
          from: "videoimages",
          localField: "companies._id",
          foreignField: "companyId",
          as: "companies.videoImages",
        },
      },
      {
        $group: {
          _id: "$_id",
          fullName: { $first: "$fullName" },
          email: { $first: "$email" },
          phoneNumber: { $first: "$phoneNumber" },
          profilePicture: { $first: "$profilePicture" },
          location: { $first: "$location" },
          industry: { $first: "$industry" },
          Bios: { $first: "$Bios" },
          skills: { $first: "$skills" },
          featured: { $first: "$featured" },
          featureTime: { $first: "$featureTime" },
          companies: { $push: "$companies" },
        },
      },
      {
        $match: { featured: true }, // Only include entrepreneurs where featured is true
      },
      {
        $sort: { featured: -1, featureTime: -1 }, // Sorting: featured first, then most recent featureTime
      },
    ]);

    Response(res, 200, "Entrepreneur Fetch Successfully", entrepreneurs);
  } catch (error) {
    Response(res, 500, "Error during find Entrepreneur", error.message);
  }
};

exports.removeFeatured = async (req, res) => {
  const { id } = req.params;
  const find = await Entrepreneur.findById(id);

  if (!find) {
    res.status(404);
    throw new Error("Entrepreneur Not found");
  }

  find.featured = false;
  find.featureTime = null;
  await find.save();
};

exports.bid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { investor_id, bid_amount } = req.body;

    // Validate input
    if (!investor_id || !bid_amount) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter the values" });
    }

    // Find the entrepreneur
    const find = await Entrepreneur.findById(id);
    if (!find) {
      return res
        .status(404)
        .json({ success: false, message: "Entrepreneur not found" });
    }

    // Check if a previous bid exists and compare amounts
    if (find.bid && parseInt(find.bid.bid_amount) > parseInt(bid_amount)) {
      return res.status(401).json({
        success: false,
        message: `Bid Amount should be greater than $${find.bid.bid_amount}`,
      });
    }

    // Save new bid
    find.bid = { investor_id, bid_amount };
    await find.save();

    res.json({ success: true, message: "Bid placed successfully!" });
  } catch (error) {
    next(error); // Pass error to the error handler middleware
  }
};

exports.getBidAmount = async (req, res) => {
  const { id } = req.params;
  const findBid = await Entrepreneur.findById(id);
  if (!findBid) {
    res.status(404).json({ message: "Entrepreneur Not Found" });
  }

  res.send(findBid?.bid?.bid_amount);
};

exports.acceptBid = async (req, res) => {
  const { id } = req.params;
  const { investor_id } = req.body;
  const findBid = await Entrepreneur.findById(id);
  if (!findBid) {
    res.status(404).json({ message: "Entrepreneur Not Found" });
  }

  findBid.bid = {
    ...findBid.bid,
    investor: investor_id,
    entrepreneur: id,
  };

  await findBid.save();

  res.send(findBid);
};

exports.getMyBids = async (req, res) => {
  const { id } = req.params;

  const findBid = await Entrepreneur.findById(id);

  if (!findBid) {
    res.send({});
  } else if (findBid?.bid?.entrepreneur == id) {
    res.send({});
  } else {
    res.send(findBid?.bid);
  }
};

exports.sendExtendMail = async (req, res) => {
  try {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find entrepreneurs whose time is within the next 24 hours
    const entrepreneurs = await Entrepreneur.find({
      time: { $lte: oneDayLater, $gte: now },
    });

    if (!entrepreneurs || entrepreneurs.length === 0) {
      return res.send(
        "No entrepreneurs found with expiring services in the next 24 hours"
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "hsuntariq@gmail.com",
        pass: "aucimlcaycvckbnf",
      },
    });

    // Send emails to all matching entrepreneurs
    for (const entrepreneur of entrepreneurs) {
      const mailOptions = {
        from: "hsuntariq@gmail.com",
        to: entrepreneur.email,
        subject: "Reminder: The Time is Almost Up!",
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Extension Notification</title>
    <style type="text/css">
        /* Base styles */
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f7f9fc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #6e8efb, #a777e3);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        
        .content {
            padding: 30px;
        }
        
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #444444;
        }
        
        .message {
            margin-bottom: 25px;
            font-size: 16px;
        }
        
        .highlight-box {
            background-color: #f3f6ff;
            border-left: 4px solid #6e8efb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 4px 4px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #6e8efb, #a777e3);
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 4px;
            font-weight: 600;
            margin: 15px 0;
            text-align: center;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #777777;
            background-color: #f5f5f5;
        }
        
        .signature {
            margin-top: 30px;
            border-top: 1px solid #eeeeee;
            padding-top: 20px;
        }
        
        .company-logo {
            max-width: 180px;
            height: auto;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <!-- Replace with your logo or company name -->
            <h1>Premium Service Extension</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Dear ${entrepreneur?.fullName},</p>
            
            <p class="message">We're delighted to inform you that your current bid with us is eligible for extension. As a valued customer, we want to ensure you continue enjoying the exceptional quality and benefits you've experienced so far.</p>
            
                  <div class="highlight-box">
          <p><strong>Service Details:</strong></p>
          <p>• Current Service: Basic Package</p>
          <p>• Expiration Date: ${new Date(
            Date.now() + 1 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
      </div>
            
            <p class="message">By extending your service, you'll continue to benefit from:</p>
            <ul>
                <li>More Visibility</li>
                <li>Better chances for an offer</li>
                <li>Boost for your business</li>
            </ul>
            
            <p class="message">To proceed with the extension, simply click the button below:</p>
            
            <div style="text-align: center;">
                <a href="http://localhost:3000/extend/${
                  entrepreneur._id
                }" class="cta-button">Extend Bid</a>
            </div>
            
            <p class="message">If you have any questions or need assistance, please don't hesitate to contact our support team at junaid@gmail.com or call us at +92 316 4729597.</p>
            
            <div class="signature">
                <p>Warm regards,</p>
                <p><strong>Pitch Connect®</strong></p>
                <p>Pitch Connect Support Team</p>
            </div>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Pitch Connect. All rights reserved.</p>
            <p>
                <a href="[Privacy Policy Link]" style="color: #6e8efb; text-decoration: none;">Privacy Policy</a> | 
                <a href="[Terms Link]" style="color: #6e8efb; text-decoration: none;">Terms of Service</a>
            </p>
        </div>
    </div>
</body>
                   </html>`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${entrepreneur.email}`);
    }

    return res.status(200).json({
      message: "Reminder emails sent successfully",
      count: entrepreneurs.length,
    });
  } catch (error) {
    console.error("Error in sendExtendMail:", error);
    return res.status(500).json({
      error: "An error occurred while processing your request",
    });
  }
};

exports.deleteExpiredIdeas = async (req, res) => {
  try {
    const now = new Date();

    // Find and delete ideas whose time has passed
    const result = await Entrepreneur.deleteMany({
      time: { $lt: now },
    });

    if (result.deletedCount === 0) {
      return res.send("No expired ideas found to delete");
    }

    return res.status(200).json({
      message: "Expired ideas deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error in deleteExpiredIdeas:", error);
    return res.status(500).json({
      error: "An error occurred while processing your request",
    });
  }
};

exports.extendBid = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entrepreneur ID format",
      });
    }

    const findEntrepreneur = await Entrepreneur.findById(id);

    if (!findEntrepreneur) {
      return res.status(404).json({
        success: false,
        message: "Entrepreneur not found",
      });
    }

    // Extend by 7 days from current time
    const newExpirationTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    findEntrepreneur.time = newExpirationTime;
    await findEntrepreneur.save();

    return res.status(200).json({
      success: true,
      message: "Service time extended successfully",
      data: {
        extendedUntil: new Date(newExpirationTime).toISOString(),
        entrepreneurId: id,
      },
    });
  } catch (error) {
    console.error("Error extending bid:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
