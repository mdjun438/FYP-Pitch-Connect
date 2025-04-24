const express = require('express');
const { protect, restrict } = require("../controllers/user");
const {
    create,
    getAll,
    updateById,
    deleteById
} = require('../controllers/investor');

const router = express.Router();
const permissions = ['Admin', 'Investor'];

router.route('/create').post(protect, restrict(permissions), create);
router.route('/').get(protect, restrict(permissions), getAll);
router.route('/update/:id').put(protect, restrict(permissions), updateById);
router.route('/remove/:id').delete(protect, restrict(permissions), deleteById);

module.exports = router;
