const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the Category model
    isDeleted: { type: Boolean, default: false },
    dateAdded: { type: Date, default: Date.now },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Reference to the Category model    
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' }, // Reference to the Category model
    ordered: { type: Boolean, default: false },
    notificationShown: { type: Boolean, default: false }, // Track if notification was shown
}, { timestamps: true });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
