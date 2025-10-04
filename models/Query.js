const mongoose = require("mongoose");

const querySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: false },
    message: { type: String, required: true },
    type: { type: String, enum: ["general", "event_query"], default: "general" },
    eventName: { type: String, required: false }, // For event-specific queries
    status: { type: String, enum: ["pending", "replied", "resolved"], default: "pending" },
    adminReply: { type: String, default: "" },
    repliedAt: { type: Date, default: null },
    repliedBy: { type: String, default: null }, // Admin user ID who replied
  },
  { timestamps: true }
);

module.exports = mongoose.model("Query", querySchema);
