const mongoose = require("mongoose");

const adSchema = new mongoose.Schema({
  userId: { type: String }, // Optional: for ads posted by regular users
  sellerId: { type: String }, // Optional: for ads posted by sellers
  description: { type: String, required: true },
  image: { type: String },
  status: { type: String, enum: ["pending", "verified", "rejected", "expired"], default: "pending" },
  message: { type: String, default: "" },
  expiresAt: { type: Date },
  expiredAt: { type: Date }, // When the ad actually expired
  isAdminPost: { type: Boolean, default: false }, // Flag to identify admin posts
}, { timestamps: true }); // adds createdAt and updatedAt automatically

// Add validation to ensure at least one of userId or sellerId is provided (except for admin posts)
adSchema.pre('validate', function(next) {
  if (!this.userId && !this.sellerId && !this.isAdminPost) {
    return next(new Error('Either userId or sellerId must be provided'));
  }
  next();
});


module.exports = mongoose.model("Ad", adSchema);
``