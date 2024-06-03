const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({

    Coupons: { type: String, required: true, unique: true },
    Discount_amount: { type: Number, required: true },
    Minimum_amount:{ type: Number, required: true },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true }
    
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;