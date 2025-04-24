const express = require('express');
const { protect, restrict } = require('../controllers/user');
const {
    create,
    getAll,
    getCompanies,
    getEntrepreneur,
    updateById,
    deleteById
} = require('../controllers/company');

const router = express.Router();
const permissions = ['Admin', 'Entrepreneur'];

router.route('/create').post(protect, restrict(permissions), create);
router.route('/').get(protect, restrict(permissions), getAll);
router.route('/get-companies/:id').get(getCompanies),
router.route('/update/:id').put(protect, restrict(permissions), updateById);
router.route('/remove/:id').delete(protect, restrict(permissions), deleteById);

module.exports = router;
