const User = require("../models/user");
const Entrepreneur = require("../models/entrepreneur");
const upload = require("../../utils/multer");
const { Response } = require("../../utils/response");
const fs = require("fs");
const path = require("path");
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
      payment_method_types: ["card"],
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
      success_url: `http://localhost:3000/payment-success/${id}?session_id={CHECKOUT_SESSION_ID}`, // Redirect on success
      cancel_url: `http://localhost:3000/feature-cancel`, // Redirect if canceled
    });

    return res.json({ url: session.url }); // Send URL to frontend to redirect user
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

exports.getMyBids = async (req, res) => {
  const { id } = req.params;

  const findBid = await Entrepreneur.findById(id);

  if (!findBid) {
    res.status(404).json({ message: "Entrepreneur not found" });
  }

  res.send(findBid?.bid);
};
