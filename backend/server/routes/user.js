const express = require('express');
const {
    protect,
    restrict,
    signin,
    create,
    getAll,
    updateById,
    deleteById
} = require('../controllers/user');

const router = express.Router();
const permissions = ['Admin', 'Investor', 'Entrepreneur'];

router.route('/sign-in').post(signin);
router.route('/create').post(create);
router.route('/').get(protect, restrict('Admin'), getAll);  // restrict to Admin
router.route('/update/:id').put(protect, restrict(permissions), updateById);
router.route('/remove/:id').delete(protect, restrict(permissions), deleteById);

module.exports = router;