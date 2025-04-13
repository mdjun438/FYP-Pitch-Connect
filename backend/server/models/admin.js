// models/passenger.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const adminSchema = new mongoose.Schema({
    adminId: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'admin id is required'],
    },
    profilePicture: {
        type: [String],
        requierd: [true, 'Profile picture is required'],
    },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
