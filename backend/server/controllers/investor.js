const Investor = require("../models/investor");
const User = require('../models/user');
const upload = require("../../utils/multer");
const { Response } = require("../../utils/response");
const fs = require("fs");
const path = require("path");

// Add a new investor
exports.create = (req, res, next) => {
    upload.single("profilePicture")(req, res, async (err) => {
        if (err) {
            return Response(res, 400, "Error during profile picture upload", err.message);
        }

        const { fullName, email, phoneNumber, companyName, industryInterest, Bios, skills, location, startupStagePreference, investmentAmountRange, geographicalPreference, typeOfInvestment, investmentGoals, investmentHistory } = req.body;
        try {
            const { role, status, _id } = await User.findOne({ email }, { role: 1, status: 1, _id: 1 });
            const investorExists = await Investor.findOne({ email });
            if (investorExists) {
                return Response(res, 403, "Investor with this email already exists", {});
            }
            const profilePicture = `/uploads/${req.file.filename}`;
            let investor = new Investor({ fullName, email, phoneNumber, profilePicture, companyName, industryInterest, Bios, skills, location, startupStagePreference, investmentAmountRange, geographicalPreference, typeOfInvestment, investmentGoals, investmentHistory });

            investor = await investor.save();
            investor = investor.toObject(); // Convert to plain object
            investor.role = role;
            investor.status = status;
            investor.authId = _id;
            return Response(res, 201, "Investor Registered Successfully", investor);
        } catch (error) {
            return Response(res, 500, "Server Error during Investor Registration", error.message);
        }
    });
};

// Get all investors
exports.getAll = async (req, res) => {
    try {
        const investors = await Investor.find();
        return Response(res, 200, "Investors Fetched Successfully", investors);
    } catch (error) {
        return Response(res, 500, "Server Error during Investor Fetch", error.message);
    }
};

// Update investor by ID
exports.updateById = (req, res) => {
    upload.fields([
        { name: "profilePicture", maxCount: 1 },  // For image upload
    ])(req, res, async (err) => {
        if (err) {
            return Response(res, 400, "Error during profile picture upload", {});
        }

        const { fullName, email, phoneNumber, companyName, industryInterest, Bios, skills, location,
            startupStagePreference, investmentAmountRange, geographicalPreference, typeOfInvestment, investmentGoals, investmentHistory } = req.body;

        try {
            let investor = await Investor.findById(req.params.id);
            if (!investor) {
                return Response(res, 404, "Investor Not Found", {});
            }
            const user = await User.findOne({ email }).select("+password");

            // Remove old profile picture from disk if new ones are uploaded
            if (req.files.profilePicture) {
                investor.profilePicture.forEach((image) => {
                    const imagePath = path.join(__dirname, '../../uploads', path.basename(image));
                    fs.unlink(imagePath, (err) => {
                        if (err) console.error('Failed to delete image:', err);
                    });
                });
                // Storing new medial files
                investor.profilePicture = req.files.profilePicture.map(file => `/uploads${file.path.split('/uploads')[1]}`);
                investor.profilePicture = req.files.profilePicture.map(file => `/uploads/${file.filename}`);
            }

            investor.fullName = fullName || investor.fullName;
            investor.phoneNumber = phoneNumber || investor.phoneNumber;
            investor.companyName = companyName || investor.companyName;
            investor.industryInterest = industryInterest || investor.industryInterest;
            investor.Bios = Bios || investor.Bios;
            investor.skills = skills || investor.skills;
            investor.location = location || investor.location;
            investor.startupStagePreference = startupStagePreference || investor.startupStagePreference;
            investor.investmentAmountRange = investmentAmountRange || investor.investmentAmountRange;
            investor.geographicalPreference = geographicalPreference || investor.geographicalPreference;
            investor.typeOfInvestment = typeOfInvestment || investor.typeOfInvestment;
            investor.investmentGoals = investmentGoals || investor.investmentGoals;
            investor.investmentHistory = investmentHistory || investor.investmentHistory;

            await investor.save();
            investor = investor.toObject(); // Convert to plain object
            investor.role = user.role;
            investor.status = user.status;
            investor.authId = user._id;
            Response(res, 200, "Investor Updated Successfully", investor);
        } catch (error) {
            return Response(res, 500, "Server Error during Investor Update", error.message);
        }
    });
};

// Delete a document by ID
exports.deleteById = async (req, res) => {
    try {
        const investor = await Investor.findById(req.params.id);
        if (!investor) {
            Response(res, 404, "Investor Not Found", {});
            return;
        }
        const user = await User.findOne({ email: investor.email }).select("+password");

        // Remove documents from disk
        investor.profilePicture.forEach((docPath) => {
            const fileName = path.basename(docPath);
            const profilePicPath = path.join(__dirname, '../../uploads', fileName);

            // Check if file exists before attempting to delete
            fs.access(profilePicPath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error("File does not exist:", profilePicPath);
                } else {
                    // Async file deletion
                    fs.unlink(profilePicPath, (err) => {
                        if (err) {
                            console.error("Failed to delete investor:", err);
                        } else {
                            console.log("Successfully deleted investor:", profilePicPath);
                        }
                    });
                }
            });
        });
        await investor.remove();
        return res.status(200).json({
            message: "Investor Removed Successfully",
            data: investor
        });
    } catch (error) {
        Response(res, 500, "Error during Document Removal", error.message);
    }
};
