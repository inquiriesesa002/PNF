const mongoose = require('mongoose');
const Stripe = require('stripe');
require('dotenv').config({ path: './node.env' });

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sufikhan122nb:123456789@cluster0.8qjqj.mongodb.net/ASSP?retryWrites=true&w=majority');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Test payment intent creation
async function testPaymentIntent() {
  try {
    console.log('=== TESTING PAYMENT INTENT CREATION ===');
    console.log('Stripe secret key available:', !!process.env.STRIPE_SECRET_KEY);
    
    // Connect to database
    await connectDB();
    
    // Test creating a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'usd',
      payment_method: 'pm_card_visa', // This will fail but we can see the error
      confirmation_method: 'manual',
      confirm: false,
      metadata: {
        type: 'test',
        email: 'test@example.com',
        name: 'Test User',
        userId: 'test123'
      }
    });
    
    console.log('Payment intent created successfully:', paymentIntent.id);
    
  } catch (error) {
    console.error('Error creating payment intent:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testPaymentIntent().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
