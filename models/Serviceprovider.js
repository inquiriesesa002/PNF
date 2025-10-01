const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  city: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  location: { type: String, required: true },
  distance: { type: String, required: true },
  availability: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  dateAdded: { type: Date, default: Date.now },
});

const Serviceprovider = mongoose.model("Serviceprovider", userSchema);

module.exports = Serviceprovider;
