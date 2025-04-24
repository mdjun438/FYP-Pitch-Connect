const express = require("express");
const { protect, restrict } = require("../controllers/user");
const {
  create,
  getAll,
  getEntrepreneur,
  updateById,
  deleteById,
  findEntrepreneurs,
  featureIdea,
  createFeatureCheckout,
  featureSuccess,
  removeFeatured,
  findEntrepreneursFeatured,
  bid,
  getBidAmount,
  getMyBids,
  sendExtendMail,
  extendBid,
  acceptBid,
  deleteExpiredIdeas,
} = require("../controllers/entrepreneur");

const router = express.Router();
const permissions = ["Admin", "Entrepreneur"];
router.route("/create").post(protect, restrict(permissions), create);
router.route("/").get(protect, restrict(permissions), getAll);
router.route("/get-entrepreneur").get(getEntrepreneur);
router.route("/update/:id").put(protect, restrict(permissions), updateById);
router.route("/remove/:id").delete(protect, restrict(permissions), deleteById);
router
  .route("/find")
  .get(
    protect,
    restrict(["Admin", "Investor", "Entrepreneur"]),
    findEntrepreneurs
  );
router
  .route("/find-featured")
  .get(
    protect,
    restrict(["Admin", "Investor", "Entrepreneur"]),
    findEntrepreneursFeatured
  );
router.post("/feature-idea/:id", createFeatureCheckout); // Initiate payment and redirect to Stripe
router.get("/feature-success/:id", featureSuccess); // Handle payment success and update the idea

router.delete("/remove-featured/:id", removeFeatured);
router.post("/bid/:id", bid);
router.get("/get-bid-amount/:id", getBidAmount);
router.get("/get-my-bids/:id", getMyBids);
router.post("/send-mail", sendExtendMail);
router.post("/delete-idea", deleteExpiredIdeas);
router.post("/update-time/:id", extendBid);
router.post("/accept-bid/:id", acceptBid);

module.exports = router;
