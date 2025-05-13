const express = require("express");
const { donate, Donations } = require("../controllers/prosperity");
const router = express.Router();

router.post("/donate", donate);
router.get("/history", Donations);

module.exports = router;
