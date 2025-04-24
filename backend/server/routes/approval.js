const express = require('express');
const {
    sendRequest,
    updateStatus,
    getAllRequestUsers
} = require('../controllers/approval');
const { protect, restrict } = require('../controllers/user');

const router = express.Router();

router.route('/send/:id').post(protect, restrict(['Investor', 'Entrepreneur']), sendRequest);
router.route('/update-status/:id').put(protect, restrict(['Admin']), updateStatus);
router.route('/').get(protect, restrict(['Admin']), getAllRequestUsers);

module.exports = router;
