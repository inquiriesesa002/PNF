const mongoose = require("mongoose");

const subproductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  dateAdded: { type: Date, default: Date.now },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Reference to the Category model
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Reference to the Category model
  image: { type: String } // Assuming the image is stored as a URL or file path
});

const Subproduct = mongoose.model("Subproduct", subproductSchema);

module.exports = Subproduct;