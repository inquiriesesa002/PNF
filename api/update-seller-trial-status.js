const express = require('express');
const mongoose = require('mongoose');
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

// Seller model
const SellerSchema = new mongoose.Schema({
  Name: String,
  email: String,
  password: String,
  hasUsedTrial: { type: Boolean, default: false },
  trialCompleted: { type: Boolean, default: false },
  hasActiveSubscription: { type: Boolean, default: false },
  subscriptionStartDate: Date,
  // Add other fields as needed
});

const Seller = mongoose.model('Seller', SellerSchema);

// Update seller trial status endpoint
app.post('/update-seller-trial-status', async (req, res) => {
  try {
    // Connect to database
    await connectDB();
    
    const { sellerId, hasUsedTrial, trialCompleted, hasActiveSubscription, subscriptionStartDate } = req.body;

    console.log('Updating seller trial status for:', { sellerId, hasUsedTrial, trialCompleted, hasActiveSubscription, subscriptionStartDate });

    const updateData = {};
    if (hasUsedTrial !== undefined) updateData.hasUsedTrial = hasUsedTrial;
    if (trialCompleted !== undefined) updateData.trialCompleted = trialCompleted;
    if (hasActiveSubscription !== undefined) updateData.hasActiveSubscription = hasActiveSubscription;
    if (subscriptionStartDate !== undefined) updateData.subscriptionStartDate = subscriptionStartDate;

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      updateData,
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    console.log('Seller trial status updated successfully');

    res.json({
      success: true,
      message: "Trial status updated successfully",
      seller: {
        hasUsedTrial: seller.hasUsedTrial,
        trialCompleted: seller.trialCompleted,
        hasActiveSubscription: seller.hasActiveSubscription,
        subscriptionStartDate: seller.subscriptionStartDate
      }
    });
  } catch (error) {
    console.error('Update trial status error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Export the app for Vercel
module.exports = app;
