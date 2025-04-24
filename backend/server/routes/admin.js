const express = require('express');
const { protect, restrict } = require('../controllers/user');
const {
    upload,
    getAll,
    updateById,
    deleteById
} = require('../controllers/admin');

const router = express.Router();
router.route('/create').post(protect, restrict('Admin'), upload);
router.route('/').get(protect, restrict('Admin'), getAll);
router.route('/update/:id').put(protect, restrict('Admin'), updateById);
router.route('/remove/:id').delete(protect, restrict('Admin'), deleteById);

module.exports = router;
