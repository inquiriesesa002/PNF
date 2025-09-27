const express = require('express');
const mongoose = require('mongoose');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sufikhan122nb:123456789@cluster0.8qjqj.mongodb.net/ASSP?retryWrites=true&w=majority');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// DeltaPayment model
const DeltaPaymentSchema = new mongoose.Schema({
  sessionId: String,
  email: String,
  userId: String,
  amount: Number,
  status: String,
  type: String,
  createdAt: { type: Date, default: Date.now }
});

const DeltaPayment = mongoose.model('DeltaPayment', DeltaPaymentSchema);

// Monthly subscription checkout endpoint
app.post('/create-monthly-subscription-checkout-session', async (req, res) => {
  try {
    // Connect to database
    await connectDB();
    
    const { userId, email, amount = 1000 } = req.body; // $10.00 in cents
    
    console.log('Creating monthly subscription checkout session for:', { userId, email, amount });
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Monthly Seller Subscription',
            description: 'Full access to seller dashboard for 1 month',
          },
          unit_amount: amount, // Amount in cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'https://asap-nine-pi.vercel.app'}?payment_success=true&type=monthly_subscription`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://asap-nine-pi.vercel.app'}/payment-cancel`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId: userId,
        type: 'monthly_subscription',
        duration: '1month'
      }
    });

    // Save session in DB
    await DeltaPayment.create({
      sessionId: session.id,
      email: email,
      userId: userId,
      amount: amount,
      status: 'pending',
      type: 'monthly_subscription'
    });

    console.log('Checkout session created successfully:', session.id);
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe monthly subscription checkout error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Export the app for Vercel
module.exports = app;
