// sellerdetailsmodel.js
const mongoose = require("mongoose");

// Sub-schemas
const educationSchema = new mongoose.Schema({
  degree: { type: String, required: false },
  university: { type: String, required: false },
});

const skillSchema = new mongoose.Schema({
  skill: { type: String, required: false },
});

const hobbySchema = new mongoose.Schema({
  hobby: { type: String, required: false },
});

const experienceSchema = new mongoose.Schema({
  experience: { type: String, required: false },
});

const adSchema = new mongoose.Schema({
  image: {
    url: String,
    public_id: String,
  },
  description: String,
});

const personalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String },
  address: { type: String },
  profileImage: {
    url: String,
    public_id: String,
  },
});

// Main seller schema
const sellerDetailsSchema = new mongoose.Schema(
  {
    personal: { type: personalSchema, required: true },
    education: [educationSchema],
    skills: [skillSchema],
    hobbies: [hobbySchema],
    experience: [experienceSchema],
    about: { description: String },
    ads: [adSchema],
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Export the model with the requested name
module.exports =
  mongoose.models.SellerModelProfile ||
  mongoose.model("SellerModelProfile", sellerDetailsSchema);
