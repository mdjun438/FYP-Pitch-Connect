const { Response } = require('../../utils/response');
const User = require('../models/user');

exports.sendRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const acceptApproval = await User.findByIdAndUpdate(
            id,
            { $set: { requestApproval: true } },
            { new: true } // Option to return the updated document
        );
        if (!acceptApproval) {
            Response(res, 500, "Your Approval was not send to Admin. Try Again!", {});
        }
        Response(res, 201, "Your Approval Sent to Admin", acceptApproval);
    }
    catch (error) {
        Response(res, 500, "Server Error during user Updation...", error.message);
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updateStatus = await User.findByIdAndUpdate(
            id,
            { $set: { status: 'approved' } },
            { new: true } // Option to return the updated document
        );
        if (!updateStatus) {
            Response(res, 500, "Status not update. Try Again!", {});
        }
        Response(res, 201, "Status Successfully Updated.", { updateStatus });
    }
    catch (err) {
        Response(res, 500, "Server Error during user Updation...", err.message);
    }
};

exports.getAllRequestUsers = async (req, res) => {
    const getAll = await User.find({
        $and: [
            { requestApproval: true },
            { $or: [{ status: 'pending' }, { status: 'rejected' }] }
        ]
    }, { password: 0, createdAt: 0, updatedAt: 0, __v: 0 });

    if (!getAll) {
        Response(res, 500, "Something went wrong during request approval user. Try Again!", {});
    }
    Response(res, 200, "", getAll);
}