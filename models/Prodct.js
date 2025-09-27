  const mongoose = require("mongoose");

  const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    dateAdded: { type: Date, default: Date.now },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Reference to the Category model
    image: { type: String } // Assuming the image is stored as a URL or file path

  });

  const Product = mongoose.model("Product", productSchema);

  module.exports = Product;
