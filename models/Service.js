const mongoose = require("mongoose");



const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  experience: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  subProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Subproduct" },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
  image: { type: String },
  dateAdded: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false }, // important!
});

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;

