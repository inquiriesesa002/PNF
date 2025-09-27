const mongoose = require('mongoose');

const sellerRatingSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
sellerRatingSchema.index({ sellerId: 1, userId: 1 }, { unique: true });
sellerRatingSchema.index({ sellerId: 1 });
sellerRatingSchema.index({ userId: 1 });

// Update the updatedAt field before saving
sellerRatingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SellerRating', sellerRatingSchema);