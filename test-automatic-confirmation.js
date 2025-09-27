const Stripe = require('stripe');
require('dotenv').config({ path: './node.env' });

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Test payment intent creation with automatic confirmation
async function testAutomaticConfirmation() {
  try {
    console.log('=== TESTING AUTOMATIC CONFIRMATION PAYMENT INTENT ===');
    console.log('Stripe secret key available:', !!process.env.STRIPE_SECRET_KEY);
    
    // Test creating a payment intent with automatic confirmation
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'usd',
      confirmation_method: 'automatic', // This should work with frontend confirmation
      confirm: false, // Don't auto-confirm, let frontend handle it
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
    console.log('Confirmation Method:', paymentIntent.confirmation_method);
    console.log('Client Secret:', paymentIntent.client_secret);
    console.log('');
    console.log('This PaymentIntent can now be confirmed using the frontend (publishable key)');
    
  } catch (error) {
    console.error('❌ Error creating payment intent:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testAutomaticConfirmation().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
