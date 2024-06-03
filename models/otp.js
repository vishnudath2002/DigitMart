const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    otp: { type: Number, required: true },
    timestamp: { type: Date,default:Date.now,required: true,expires:60 }
});

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp; 
