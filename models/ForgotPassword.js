const mongoose = require("mongoose");

const forgotPasswordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resetToken: { type: String, required: true },
  resetTokenExpiry: { type: Date, required: true },
});

module.exports = mongoose.model("ForgotPassword", forgotPasswordSchema);
