const mongoose = require('mongoose');

const { Schema } = mongoose;

const OfferSchema = new Schema({
    name: { type:String,require: true,unique:true},
    type: { type: String, enum: ['product', 'category', 'referral'], required: true },
    value: { type: Number, required: true },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
}, { timestamps: true });


const Offer = mongoose.model('Offer', OfferSchema);

module.exports = Offer