const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    experience: String,
    country: String,
    city: String,
    zipCode: String,
    category: String,
    product: String,
    subproduct: String,
    details: String,
    description: String,
    image: String, // file path
  },
  { timestamps: true }
);

// ✅ Model ka naam change karke "SellerPost"
module.exports =
  mongoose.models.SellerPost || mongoose.model("SellerPost", sellerSchema);
