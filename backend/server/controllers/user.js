const mongoose = require('mongoose');
const User = require('../models/user');
const Admin = require('../models/admin');
const Investor = require('../models/investor');
const Entrepreneur = require('../models/entrepreneur');
const { Response } = require("../../utils/response");
const jwt = require('jsonwebtoken');
const Util = require('util');

// JWT method
const userToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.lOGIN_EXPIRES }
    )
}
// Create a new user
exports.create = async (req, res) => {
    const { fullName, email, password, role } = req.body;
    try {
        const isExist = await User.findOne({ email });
        if (isExist) {
            return Response(res, 409, "User Email already existed", null);
        }
        const hashedPassword = await User.hashing(password);
        // only admin add status field
        let user = new User({ fullName, email, password: hashedPassword, role });
        user = await user.save();
        let token = userToken(user._id);

        // only admin can change status
        let status = null;
        if (req?.user?.role === 'admin') {
            status = req?.user?.status;
        }
        else {
            status = 'pending';
        }

        // delete user.password;
        const data = {
            '_id': user._id,
            'fullName': user.fullName,
            'email': user.email,
            'role': user.role,
            'status': status,
            'token': token,
            'createdAt': user.createdAt,
            'updateAt': user.updatedAt,
        }
        Response(res, 201, "User Data Stored Successfully", data);
    } catch (error) {
        Response(res, 500, "User not register, Try Again!", null);
    }
};

// Get all users
exports.getAll = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        Response(res, 200, "User Fetch Successfully", users);
    } catch (error) {
        Response(res, 500, "Something went wrong during user data fetch", error.message);
    }
};

// Update a user by ID
// Noted: this controller is only for admin
exports.updateById = async (req, res) => {
    const { fullName, email, password, role } = req.body;
    const hashedPassword = await User.hashing(password);
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            Response(res, 404, "User not found", {});
        }

        // only admin can change status
        let status = null;
        if (req.user.role === 'Admin') {
            status = req.user.status;
        }
        else {
            status = 'pending';
        }
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.password = hashedPassword || user.password;
        user.role = role || user.role;
        // user.status = status || user.status;
        user.status = status;

        await user.save();
        const data = {
            '_id': user._id,
            'fullName': user.fullName,
            'email': user.email,
            'role': user.role,
            // 'status': user.status,
            'status': status,
            'createdAt': user.createdAt,
            'updateAt': user.updatedAt,
        }
        Response(res, 200, "User Data Updated Successfully", data);
    } catch (error) {
        Response(res, 500, "Server Error during user Updation...", error.message);
    }
};

// Delete a user by ID
exports.deleteById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const data = {
            '_id': user._id,
            'fullName': user.fullName,
            'email': user.email,
            'role': user.role,
            'status': user.status,
            'createdAt': user.createdAt,
            'updateAt': user.updatedAt,
        }
        if (!user) {
            Response(res, 404, 'User not found', user);
        }
        await user.remove();
        Response(res, 200, "User Data Removed Successfully", data);
    } catch (error) {
        Response(res, 500, "Server Error during user Removing...", error.message);
    }
};

// sign-in api handler
exports.signin = async (req, res, next) => {
    try {

        const { email, password } = req.body;
        if (!email || !password) {
            const err = new Error("email & password is not defined: 400");
            return next(err);
        }
        const user = await User.findOne({ email }).select("+password");
        // check if email or password exists or not
        if (!user || !(await user.comparePassword(password, user.password))) {
            return res.status(400).json({
                message: 'Incorrect  email or password',
            });
        }
        const token = userToken(user._id);

        // Fetch admin profile picture
        let profilePicture = null, profileExist = false, profile = null;
        if (user.role === 'Admin') {
            const objectId = mongoose.Types.ObjectId(user._id);
            const getAdmin = await Admin.findOne({ adminId: objectId });
            profilePicture = getAdmin?.profilePicture[0];
            profileExist = false;
        }
        else if (user.role === 'Investor') {
            profile = await Investor.findOne({ email: user.email });
            if (profile) profileExist = true;
        }
        else if (user.role === 'Entrepreneur') {
            profile = await Entrepreneur.findOne({ email: user.email });
            if (profile) profileExist = true;
        }

        const userData = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            authId: user._id,
            status: user.status,
            ...(profilePicture ? { profilePicture } : {}),
            ...(profileExist ? { profileExist } : {}),
            ...(profileExist ? { ...profile.toObject() } : {}), // Spread profile data if exists
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }

        return res.status(200).json({
            message: "Logged In Successfully.\nWelcome to PITCH-CONNECT Portal",
            token,
            data: userData
        });
    }
    catch (error) {
        Response(res, 500, "Server Error during user Signing...", error.message);
    }
};

// protect  middleware
exports.protect = async (req, res, next) => {
    try {
        const testToken = req.headers.authorization;
        let token;

        if (testToken && testToken.startsWith("Bearer")) {
            token = testToken.split(" ")[1];
        }
        if (!token) {
            next(new Error("You are not logged in!", 401));
        }
        const decodedToken = await Util.promisify(jwt.verify)(
            token,
            process.env.JWT_SECRET
        );

        // if users exists or not
        const users = await User.findById(decodedToken.id);

        if (!users) {
            const err = new Error("The user with the given token not exists");
            next(err);
        }
        req.user = users;
        next();
    }
    catch (error) {
        Response(res, 500, "Server Error during user Removing...", error.message);
    }
};

// check the role of user API after protect req.user set
exports.restrict = (role) => {
    return (req, res, next) => {
        const isPermit = role.includes(req.user.role);
        if (!isPermit) {
            const err = new Error(`You do not have permissions to perform this action: 403`);
            next(err);
        }
        next();
    };
};