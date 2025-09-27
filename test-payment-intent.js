const Stripe = require('stripe');
require('dotenv').config({ path: './node.env' });

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Test payment intent creation without payment method (just to test the endpoint)
async function testPaymentIntentCreation() {
  try {
    console.log('=== TESTING PAYMENT INTENT CREATION (NO PAYMENT METHOD) ===');
    console.log('Stripe secret key available:', !!process.env.STRIPE_SECRET_KEY);
    
    // Test creating a payment intent without payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'usd',
      confirmation_method: 'manual',
      confirm: false,
      metadata: {
        type: 'test',
        email: 'test@example.com',
        name: 'Test User',
        userId: 'test123'
      }
    });
    
    console.log('✅ Payment intent created successfully!');
    console.log('Payment Intent ID:', paymentIntent.id);
    console.log('Status:', paymentIntent.status);
    console.log('Client Secret:', paymentIntent.client_secret);
    
  } catch (error) {
    console.error('❌ Error creating payment intent:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testPaymentIntentCreation().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
