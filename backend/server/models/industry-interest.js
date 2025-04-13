const mongoose = require('mongoose');

const IndustryInterestSchema = new mongoose.Schema({
    industries: {
        type: [String], // Array of selected industries
        required: true,
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: 'At least one keyword must be selected.',
        },
        unique: [true, 'Keyword already exist insert different one.'],
    },
}, { timestamps: true });

module.exports = mongoose.model('IndustryInterest', IndustryInterestSchema);
