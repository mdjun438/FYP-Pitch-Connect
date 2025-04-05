const mongoose = require('mongoose');
const Admin = require("../models/admin");
const User = require("../models/user");
const upload = require("../../utils/multer");
const { Response } = require("../../utils/response");
const fs = require("fs");
const path = require("path");

// Add a new document
exports.upload = (req, res, next) => {
    upload.array("profilePicture", 5)(req, res, async (err) => {
        if (err) {
            Response(res, 400, "Something went wrong during profile picture upload...", err.message);
        }
        const { adminId } = req.body;
        try {
            const profilePicture = req.files.profilePicture.map(file => `/uploads/${file.filename}`);
            const admin = new Admin({ adminId, profilePicture, });
            await admin.save();
            Response(res, 201, "Admin Registered Successfully", admin);
        } catch (error) {
            Response(res, 500, "Server Error during Admin Registration", error.message);
        }
    });
};

// Get all documents
exports.getAll = async (req, res) => {
    try {
        const admins = await Admin.find();
        Response(res, 200, "Admins Fetched Successfully", admins);
    } catch (error) {
        Response(res, 500, "Server Error during Admin Fetch", error.message);
    }
};

// Update media by ID
exports.updateById = (req, res) => {
    upload.fields([
        { name: "profilePicture", maxCount: 1 },  // For profile image upload
    ])(req, res, async (err) => {
        if (err) {
            Response(res, 400, err.message, {});
            return;
        }
        const { fullName, status } = req.body;
        const updateData = { fullName, status };

        try {
            const { id } = req.params;
            const user = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!user || !id) {
                Response(res, 404, "Admin ID Not Found", {});
                return;
            }

            const objectId = mongoose.Types.ObjectId(id);
            let admin = await Admin.findOne({ adminId: objectId });

            // Store new admin profile picture if not exist
            if (!admin) {
                admin = new Admin({
                    adminId: objectId,
                    profilePicture: req.files['profilePicture'].map(file => `/uploads/${file.filename}`)
                });
                await admin.save();
            }
            else {
                // Remove old admin files from disk if new ones are uploaded
                if (req.files.profilePicture) {
                    admin.profilePicture.forEach((image) => {
                        const imagePath = path.join(__dirname, '../../uploads', path.basename(image));
                        fs.unlink(imagePath, (err) => {
                            if (err) console.error('Failed to delete image:', err);
                        });
                    });
                    admin.profilePicture = req.files['profilePicture'].map(file => `/uploads/${file.filename}`)
                }
            }

            await user.save();
            await admin.save();

            const data = {
                '_id': user._id,
                'fullName': user.fullName,
                'email': user.email,
                'role': user.role,
                'profilePicture': admin.profilePicture[0],
                // 'status': user.status,
                'status': status,
                'createdAt': user.createdAt,
                'updateAt': user.updatedAt,
            }

            Response(res, 201, "Admin profile successfully stored.", data);
        } catch (error) {
            Response(res, 500, error.message, {});
        }
    });
};

// Delete a document by ID
exports.deleteById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            Response(res, 404, "Admin Not Found", {});
            return;
        }

        // Remove documents from disk
        admin.profilePicture.forEach((docPath) => {
            const fileName = path.basename(docPath);
            const docFilePath = path.join(__dirname, '../../uploads', fileName);

            // Check if file exists before attempting to delete
            fs.access(docFilePath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error("File does not exist:", docFilePath);
                } else {
                    // Async file deletion
                    fs.unlink(docFilePath, (err) => {
                        if (err) {
                            console.error("Failed to delete admin:", err);
                        } else {
                            console.log("Successfully deleted admin:", docFilePath);
                        }
                    });
                }
            });
        });

        await admin.remove();
        Response(res, 200, "Admin Removed Successfully", admin);
    } catch (error) {
        Response(res, 500, "Error during Admin Removal", error.message);
    }
};