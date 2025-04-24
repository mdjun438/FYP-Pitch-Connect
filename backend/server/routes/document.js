const express = require("express");
const { protect, restrict } = require("../controllers/user");
const {
  upload,
  getAll,
  updateById,
  deleteById,
  getEntrepreneurDocs,
} = require("../controllers/document");

const router = express.Router();
const permissions = ["Admin", "Entrepreneur"];

router.route("/create").post(protect, restrict(permissions), upload);
router.route("/").get(protect, restrict(permissions), getAll);
router.route("/entrepreneur-documents/:id?").get(getEntrepreneurDocs);
router.route("/update/:id").put(protect, restrict(permissions), updateById);
router.route("/remove/:id").delete(protect, restrict(permissions), deleteById);

module.exports = router;
