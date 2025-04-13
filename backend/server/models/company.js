// models/passenger.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const companySchema = new mongoose.Schema({
    entrepreneurId: {
        type: ObjectId,
        ref: 'Entrepreneur',
        required: [true, 'Entrepreneur is required'],
    },
    pitchTitle: {
        type: String,
        required: [true, 'Pitch title is required'],
        unique: true,
    },
    shortSummary: {
        type: String,
        required: [true, 'Short summary is required'],
    },
    website: {
        type: String,
        default: null,
    },
    companyBased: {
        type: String,
        required: [true, 'Where company based is required'],
    },
    industry: {
        type: [String],
        required: [true, 'Industry is required'],
    },
    stage: {
        type: String,
        required: [true, 'Stage is required']
    },
    ideaInvestorRole: {
        type: String,
        required: [true, 'Idea investor role is required']
    },
    investmentRange: {
        type: String,
        required: [true, "Investment range is required"]
    },
    previousRoundRaise: {
        type: String,
        required: [true, 'Previous round raise is required']
    }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
