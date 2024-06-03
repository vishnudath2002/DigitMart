const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    PhoneNumber: { type: Number, required: true, unique: true },
    Name: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    Email: { type: String, required: true, unique: true }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
