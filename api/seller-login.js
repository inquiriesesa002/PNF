const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
  trialStartDate: Date, // Trial starts only when selected
  trialSelected: { type: Boolean, default: false }, // Whether seller selected free trial
  accountActive: { type: Boolean, default: true }, // Account status
  accountDeactivatedAt: Date, // When account was deactivated
  // Add other fields as needed
});

const Seller = mongoose.model('Seller', SellerSchema);

// Check if monthly subscription has expired
const checkMonthlySubscriptionExpiry = (subscriptionStartDate) => {
  if (!subscriptionStartDate) return true;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return new Date(subscriptionStartDate) < oneMonthAgo;
};

// Seller login endpoint
app.post('/seller-login', async (req, res) => {
  try {
    // Connect to database
    await connectDB();
    
    const { email, password } = req.body;
    const seller = await Seller.findOne({ email });
    
    if (!seller) {
      return res.status(400).json({ success: false, message: "Seller not found" });
    }
    
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // Check trial and subscription status
    const hasUsedTrial = seller.hasUsedTrial || false;
    const trialCompleted = seller.trialCompleted || false;
    const hasActiveSubscription = seller.hasActiveSubscription || false;
    const subscriptionStartDate = seller.subscriptionStartDate;
    const trialStartDate = seller.trialStartDate;
    const trialSelected = seller.trialSelected || false;

    // Check if monthly subscription has expired
    const isSubscriptionExpired = checkMonthlySubscriptionExpiry(subscriptionStartDate);

    // Check if 6-month trial has expired (only if trial was selected and started)
    const isTrialExpired = (() => {
      if (!trialSelected || !trialStartDate) return false; // No trial selected yet
      
      const trialStart = new Date(trialStartDate);
      const sixMonthsFromStart = new Date(trialStart);
      sixMonthsFromStart.setMonth(sixMonthsFromStart.getMonth() + 6); // Add 6 months to start date
      
      const now = new Date();
      return now > sixMonthsFromStart; // Trial expired if current time is past 6 months from start
    })();

    // Check account status and deactivate if trial expired
    let accountActive = seller.accountActive;
    let updatedHasUsedTrial = hasUsedTrial;
    let updatedTrialCompleted = trialCompleted;
    
    if (isTrialExpired && !hasActiveSubscription && accountActive && trialSelected) {
      // Deactivate account after 6 months if no subscription and trial was selected
      await Seller.findByIdAndUpdate(seller._id, {
        accountActive: false,
        accountDeactivatedAt: new Date(),
        trialCompleted: true,
        hasUsedTrial: true
      });
      accountActive = false;
      updatedHasUsedTrial = true;
      updatedTrialCompleted = true;
      console.log('Account deactivated due to expired trial:', seller._id);
    } else if (!accountActive && !hasActiveSubscription && !hasUsedTrial) {
      // Account is deactivated but trial was never used - this shouldn't happen
      // Fix the data inconsistency
      console.log('Data inconsistency detected: account deactivated but trial never used');
      console.log('Seller data:', {
        accountActive: seller.accountActive,
        hasUsedTrial: seller.hasUsedTrial,
        trialSelected: seller.trialSelected,
        trialStartDate: seller.trialStartDate
      });
    }

    console.log('Seller login successful:', { 
      sellerId: seller._id, 
      hasUsedTrial, 
      trialCompleted, 
      hasActiveSubscription, 
      isSubscriptionExpired,
      trialStartDate,
      isTrialExpired,
      accountActive
    });

    res.json({
      success: true,
      message: "Login successful",
      sellerId: seller._id,
      name: seller.Name,
      userType: "SELLER",
      hasUsedTrial: updatedHasUsedTrial,
      trialCompleted: updatedTrialCompleted,
      hasActiveSubscription: hasActiveSubscription && !isSubscriptionExpired,
      subscriptionStartDate: subscriptionStartDate,
      isSubscriptionExpired: isSubscriptionExpired,
      trialStartDate: trialStartDate,
      isTrialExpired: isTrialExpired,
      accountActive: accountActive,
      trialSelected: trialSelected
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start free trial for seller
// Data repair endpoint to fix inconsistent seller data
app.post('/repair-seller-data', async (req, res) => {
  try {
    await connectDB();
    
    const { sellerId } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Seller ID is required" });
    }
    
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }
    
    console.log('Repairing seller data for:', sellerId);
    console.log('Current data:', {
      accountActive: seller.accountActive,
      hasUsedTrial: seller.hasUsedTrial,
      trialSelected: seller.trialSelected,
      trialStartDate: seller.trialStartDate,
      trialCompleted: seller.trialCompleted
    });
    
    // Fix data inconsistencies
    let updates = {};
    
    // If account is deactivated but trial was never used, mark trial as used
    if (!seller.accountActive && !seller.hasUsedTrial && !seller.hasActiveSubscription) {
      updates.hasUsedTrial = true;
      updates.trialCompleted = true;
      console.log('Fixed: Marked trial as used for deactivated account');
    }
    
    // If trial was selected but no start date, set a default start date
    if (seller.trialSelected && !seller.trialStartDate) {
      updates.trialStartDate = new Date();
      console.log('Fixed: Set trial start date');
    }
    
    if (Object.keys(updates).length > 0) {
      const updatedSeller = await Seller.findByIdAndUpdate(sellerId, updates, { new: true });
      console.log('Seller data repaired:', updates);
      
      res.json({
        success: true,
        message: "Seller data repaired successfully",
        updates: updates,
        seller: {
          accountActive: updatedSeller.accountActive,
          hasUsedTrial: updatedSeller.hasUsedTrial,
          trialSelected: updatedSeller.trialSelected,
          trialStartDate: updatedSeller.trialStartDate,
          trialCompleted: updatedSeller.trialCompleted
        }
      });
    } else {
      res.json({
        success: true,
        message: "No data inconsistencies found",
        seller: {
          accountActive: seller.accountActive,
          hasUsedTrial: seller.hasUsedTrial,
          trialSelected: seller.trialSelected,
          trialStartDate: seller.trialStartDate,
          trialCompleted: seller.trialCompleted
        }
      });
    }
  } catch (error) {
    console.error("Repair seller data error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post('/start-free-trial', async (req, res) => {
  try {
    await connectDB();
    
    const { sellerId } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Seller ID is required" });
    }
    
    // Check if seller already selected trial
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }
    
    if (seller.trialSelected) {
      return res.status(400).json({ success: false, message: "Free trial already started" });
    }
    
    // Start the free trial
    const updatedSeller = await Seller.findByIdAndUpdate(sellerId, {
      trialSelected: true,
      trialStartDate: new Date(),
      hasUsedTrial: true,
      trialCompleted: false,
      accountActive: true
    }, { new: true });
    
    console.log('Free trial started for seller:', sellerId);
    
    res.json({
      success: true,
      message: "Free trial started successfully",
      trialStartDate: updatedSeller.trialStartDate,
      trialSelected: updatedSeller.trialSelected
    });
  } catch (error) {
    console.error("Start free trial error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reactivate seller account after payment
app.post('/reactivate-seller-account', async (req, res) => {
  try {
    await connectDB();
    
    const { sellerId, subscriptionStartDate } = req.body;
    
    if (!sellerId) {
      return res.status(400).json({ success: false, message: "Seller ID is required" });
    }
    
    // Reactivate account and set subscription
    const updatedSeller = await Seller.findByIdAndUpdate(sellerId, {
      accountActive: true,
      hasActiveSubscription: true,
      subscriptionStartDate: subscriptionStartDate || new Date(),
      trialCompleted: true,
      hasUsedTrial: true
    }, { new: true });
    
    if (!updatedSeller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }
    
    console.log('Seller account reactivated:', sellerId);
    
    res.json({
      success: true,
      message: "Account reactivated successfully",
      seller: {
        sellerId: updatedSeller._id,
        accountActive: updatedSeller.accountActive,
        hasActiveSubscription: updatedSeller.hasActiveSubscription,
        subscriptionStartDate: updatedSeller.subscriptionStartDate
      }
    });
  } catch (error) {
    console.error("Account reactivation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Export the app for Vercel
module.exports = app;
