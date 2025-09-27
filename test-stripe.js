require("dotenv").config({ path: "node.env" });
const Stripe = require("stripe");

console.log("Testing Stripe configuration...");
console.log("Stripe key:", process.env.STRIPE_SECRET_KEY);

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Test creating a simple checkout session
async function testStripe() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Test Product',
            description: 'Test description',
          },
          unit_amount: 1000, // $10.00 in cents
        },
        quantity: 1,
      }],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    });
    
    console.log("✅ Stripe test successful!");
    console.log("Session ID:", session.id);
    console.log("Checkout URL:", session.url);
  } catch (error) {
    console.log("❌ Stripe test failed:");
    console.log("Error:", error.message);
  }
}

testStripe();
