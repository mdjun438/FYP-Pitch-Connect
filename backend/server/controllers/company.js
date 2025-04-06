const mongoose = require('mongoose');
const Company = require('../models/company');
const User = require('../models/user');
const { Response } = require("../../utils/response");

// Create a new company
exports.create = async (req, res) => {
    const { entrepreneurId, email, pitchTitle, shortSummary, website, companyBased, industry, stage, ideaInvestorRole, investmentRange, previousRoundRaise } = req.body;

    try {
        let company = new Company({ entrepreneurId, pitchTitle, shortSummary, website, companyBased, industry, stage, ideaInvestorRole, investmentRange, previousRoundRaise, });
        company = await company.save();
        company = company.toObject();
        const user = await User.findOne({ email }).select("+password");
        company.role = user.role;
        Response(res, 201, "Your pitch has been successfully uploaded and is now live on the platform!", company);
    } catch (error) {
        Response(res, 500, "Company registration failed, Try Again!", error.message);
    }
};

// Get all companies
exports.getAll = async (req, res) => {
    try {
        const companies = await Company.find().populate({
            path: 'entrepreneurId',
            select: ['email', 'fullName'],
        });
        Response(res, 200, "Companies Fetched Successfully", companies);
    } catch (error) {
        Response(res, 500, "Something went wrong during company data fetch", error.message);
    }
};

exports.getCompanies = async (req, res) => {
    try {
        const { id } = req.params;
        const entrepreneurObjectId = new mongoose.Types.ObjectId(id);
        const companies = await Company.find({ entrepreneurId: entrepreneurObjectId }, { _id: 1, pitchTitle: 1 });
        Response(res, 200, "Company Fetched Successfully", companies);
    } catch (error) {
        Response(res, 500, "Something went wrong during Company data fetch", error.message);
    }
}

// Update a company by ID
exports.updateById = async (req, res) => {
    const { entrepreneurId, pitchTitle, shortSummary, website, companyBased, industry, stage, ideaInvestorRole, investmentRange, previousRoundRaise } = req.body;

    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            Response(res, 404, "Company not found", {});
            return;
        }

        company.entrepreneurId = entrepreneurId || company.entrepreneurId;
        company.pitchTitle = pitchTitle || company.pitchTitle;
        company.shortSummary = shortSummary || company.shortSummary;
        company.website = website || company.website;
        company.companyBased = companyBased || company.companyBased;
        company.industry = industry || company.industry;
        company.stage = stage || company.stage;
        company.ideaInvestorRole = ideaInvestorRole || company.ideaInvestorRole;
        company.investmentRange = investmentRange || company.investmentRange;
        company.previousRoundRaise = previousRoundRaise || company.previousRoundRaise;

        await company.save();
        Response(res, 200, "Company Updated Successfully", company);
    } catch (error) {
        Response(res, 500, "Server Error during company update", error.message);
    }
};

// Delete a company by ID
exports.deleteById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            Response(res, 404, "Company not found", {});
            return;
        }
        await company.remove();
        Response(res, 200, "Company Deleted Successfully", company);
    } catch (error) {
        Response(res, 500, "Server Error during company deletion", error.message);
    }
};
