const mongoose = require("mongoose");

const appSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true }, // Cloudinary URL
  link: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model("App", appSchema);
