const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: Number, required: true},
    password: { type: String, required: true },
    blocked: { type: Boolean, default: false },
    Otp_number: { type: Number }
});


const User = mongoose.model('User', userSchema);

module.exports = User;
