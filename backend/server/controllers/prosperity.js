const stripe = require("stripe")(
  "sk_test_51MycIqD2171rDQ1bM2Vo43LraZJVqjoKBvTbP7yl52C5ShEqWmsSrT7kktdyrtUAuRwrOD8HRmqXnfFOXPULc7Xr00A9NYeUOU"
);
const Donation = require("../models/prosperity");

exports.donate = async (req, res) => {
  const { name, description, amount, user } = req.body;

  try {
    // Validate amount
    if (isNaN(amount)) {
      return res.status(400).json({ error: "Invalid donation amount" });
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: name,
              description: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      allow_promotion_codes: false,
      success_url: `http://localhost:3000/social-prosperity`,
      cancel_url: `http://localhost:3000/social-prosperity`,
      metadata: {
        userId: user?._id || "anonymous",
        organizationName: name,
        organizationDescription: description,
      },
    });

    // Save donation record to database (status: pending)
    const donation = new Donation({
      donor: user,
      organization: { name, description },
      amount,
      stripeSessionId: session.id,
      status: "pending",
    });

    await donation.save();

    return res.json({ url: session.url, donationId: donation._id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error creating checkout session",
      details: error.message,
    });
  }
};

// Add this new endpoint to check payment status
exports.Donations = async (req, res) => {
  const donation = await Donation.find();
  res.send(donation);
};
