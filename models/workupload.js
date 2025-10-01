const mongoose = require("mongoose");

const workUploadSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    samples: [
      {
        imageUrl: { type: String, required: true }, // Cloudinary URL
        description: { type: String, required: true },
        publicId: { type: String }, // Cloudinary se delete/edit ke liye
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkUpload", workUploadSchema);
