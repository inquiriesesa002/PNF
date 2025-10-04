const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String },
  zipCode: { type: String },
  country: { type: String, required: true },
  city: { type: String, required: true },
  heardFrom: { 
    type: String, 
    enum: ["Facebook", "Instagram", "YouTube", "TikTok", "Influencers", "Other"],
    default: "Other"
  },
  referenceName: { type: String, default: "" }, 
  image: { type: String, default: "" },
  userType: { type: String, default: "USER" },
  isDeleted: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  canPostAds: { type: Boolean, default: false },
  canPostEvents: { type: Boolean, default: false },
  postCredits: { type: Number, default: 0 },
  freeTrialUsed: { type: Boolean, default: false },
  freeTrialStartTime: { type: Date },
  freeTrialEndTime: { type: Date },
  dateAdded: { type: Date, default: Date.now },
  resetTokens: [
    {
      token: { type: String },
      expires: { type: Date },
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
