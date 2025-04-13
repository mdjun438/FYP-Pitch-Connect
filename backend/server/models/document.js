// models/passenger.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const additionalDocSchema = new mongoose.Schema({
    companyId: {
        type: ObjectId,
        ref: 'Company',
        required: [true, 'Company is required'],
    },
    title: {
        type: String,
        required: [true, "title is required"],
        unique: true,
    },
    documents: [String],
}, { timestamps: true });

module.exports = mongoose.model('Document', additionalDocSchema);
