const mongoose = require("mongoose");

const informationBoxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["pending", "responded"], 
      default: "pending" 
    }
  },
  { timestamps: true }
);

const InformationBox = mongoose.model("InformationBox", informationBoxSchema);
module.exports = InformationBox;
