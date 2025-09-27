const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  
  Title: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  dateAdded: { type: Date, default: Date.now },
  image: { type: String } // Assuming the image is stored as a URL or file path
});
const Category = mongoose.model("Category", userSchema);

module.exports = Category;
