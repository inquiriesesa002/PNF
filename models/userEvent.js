const mongoose = require("mongoose");

const userEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a User model
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  eventType: { type: String, enum: ["login", "logout", "purchase", "custom"], default: "custom" },
  metadata: { type: Object, default: {} },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserEvent", userEventSchema);
