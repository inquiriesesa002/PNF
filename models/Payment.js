// models/Payment.js
const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },       // Stripe session ID
  userId: { type: String }, // User ID (can be ObjectId string or temp user ID)
  productId: { type: String },                       // Product ID
  amount: { type: Number, required: true },          // Amount in cents
  currency: { type: String, default: "usd" },        // Currency code
  isPaid: { type: Boolean, default: false },         // Payment status
  zipCode: { type: String },                         // Zip code
  city: { type: String },                            // City
  expired: { type: Boolean, default: false },        // Expiration status
  paymentMethod: { type: String, default: "card" },  // Payment method
  dateAdded: { type: Date, default: Date.now },      // Timestamp
});

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;