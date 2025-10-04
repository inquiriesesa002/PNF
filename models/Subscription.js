import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["trialing", "active", "canceled", "incomplete", "past_due", "unpaid", "none"],
      default: "none",
    },
    plan: { type: String, enum: ["trial-6mo", "monthly-10"], default: "trial-6mo" },
    trialEndsAt: { type: Date },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", SubscriptionSchema);
