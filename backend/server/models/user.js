// models/passenger.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full Name is required']
    },
    email: {
        type: String,
        unique: [true, 'Email already exists'],
        required: [true, 'Email is required'],
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    role: {
        type: String,
        required: [true, "Role is required"],
        enum: ['Admin', 'Investor', 'Entrepreneur']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requestApproval: {
        type: Boolean,
        default: false
    },
    // passwordChangeAt: Date,
    // passwordResetToken: String,
    // passwordResetTokenExpires: Date,
}, { timestamps: true });

//===================== Password hash middleware =================//

userSchema.statics.hashing = async function (password) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        return hash; // Return the hashed password
    } catch (err) {
        throw err; // Handle the error appropriately
    }
};

//===================== Helper method for validating user's password =================//
userSchema.methods.comparePassword = async function comparePassword(
    reqPassword, dbPassword
) {
    try {
        const isMatch = await bcrypt.compare(reqPassword, dbPassword);
        return isMatch;
    } catch (error) {
        console.log("=========== Error in Comparing Password", error);
        return false;
    }
};

//===================== Helper method for password change verification =================//
// userSchema.methods.isPasswordChange = async function (JWTTimestamp) {
//     if (this.passwordChangeAt) {
//       const pswdChangeTimestamp = parseInt(
//         this.passwordChangeAt.getTime() / 1000,
//         10
//       );
//       return JWTTimestamp < pswdChangeTimestamp;
//     }
//     return false;
//   };

module.exports = mongoose.model('User', userSchema);
