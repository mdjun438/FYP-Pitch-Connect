const express = require('express');
const {
    create,
    getAll,
} = require('../controllers/industry-interest');

const router = express.Router();
router.route('/create').post(create);
router.route('/').get(getAll);

module.exports = router;