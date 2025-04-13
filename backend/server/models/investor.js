// models/passenger.js
const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true
    },
    profilePicture: {
        type: [String],
        requierd: [true, 'Profile picture is required'],
    },
    companyName: {
        type: String,
        required: [true, 'Company name is required']
    },
    industryInterest: {
        type: [String],
        required: [true, 'Industires of interest is required']
    },
    Bios: {
        type: String,
        required: [true, 'Bios is required']
    },
    skills: {
        type: String,
        required: [true, 'Skills/Expertise is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required']
    },
    startupStagePreference: {
        type: String,
        required: [true, "Startup preference is required"],
        enum: ['Idea', 'Seed', 'Growth', 'Established']
    },
    investmentAmountRange: {
        type: String,
        required: [true, 'Investment amount range is required']
    },
    geographicalPreference: {
        type: String,
        required: [true, 'Geographical  preference is required']
    },
    typeOfInvestment: {
        type: String,
        required: [true, 'Type of investment is required'],
        enum: ['Equity', 'Convertible Debt', 'Loans', 'Grants']
    },
    investmentGoals: {
        type: String,
        required: [true, 'Investment goals is required'],
    },
    investmentHistory: {
        type: String,
        required: [true, 'Investment history is required'],
    },

}, { timestamps: true });

module.exports = mongoose.model('Investor', investorSchema);
