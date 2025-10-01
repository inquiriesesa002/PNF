const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: false },
    image: { type: String, required: false },
    startDate: { type: Date, required: true },   // new field
    endDate: { type: Date, required: true },     // new field
    time: { type: String, required: true },
    venue: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["pending", "verified", "rejected", "expired"], default: "pending" },
    message: { type: String, default: "" },
    sellerId: { type: String, required: false }, // For seller events
    userId: { type: String, required: false },   // For buyer events
    expiresAt: { type: Date },
    // Admin approval and paid registration
    registrationPrice: { type: Number, default: 0 }, // amount in cents
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    isFeatured: { type: Boolean, default: false },
    maxRegistrations: { type: Number, default: 0 }, // 0 = unlimited
    registrationsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
