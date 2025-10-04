const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
  image: { type: String, default: "" },
  Name: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  experience: { type: String },
  zipCode: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  subproduct: { type: mongoose.Schema.Types.ObjectId, ref: "Subproduct", required: true },
  details: { type: String },
  userType: { type: String, default: "SELLER" },
  isActive: { type: Boolean, default: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  documentationURL: { type: String },
  demoURL: { type: String },
  isDeleted: { type: Boolean, default: false },
  canPostAds: { type: Boolean, default: false },
  canPostEvents: { type: Boolean, default: false },
  postCredits: { type: Number, default: 0 },
  freeTrialUsed: { type: Boolean, default: false },
  freeTrialStartTime: { type: Date },
  freeTrialEndTime: { type: Date },
  dateAdded: { type: Date, default: Date.now },
  
  // 6-month trial system
  trialStartDate: { type: Date },
  trialEndDate: { type: Date },
  hasUsedTrial: { type: Boolean, default: false },
  trialCompleted: { type: Boolean, default: false },
  trialSelected: { type: Boolean, default: false },
  accountActive: { type: Boolean, default: true },
  
  // Monthly subscription system
  hasActiveSubscription: { type: Boolean, default: false },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
heardFrom: { 
  type: String, 
  enum: ["Facebook", "Instagram", "YouTube", "TikTok", "Influencers", "Other"], 
  default: "Other" 
},
referenceName: { type: String, default: "" }, 
  // ✅ Reset password tokens
  resetTokens: [
    {
      token: { type: String },
      expires: { type: Date },
    },
  ],
});

const Seller = mongoose.model("Seller", sellerSchema);

module.exports = Seller;
