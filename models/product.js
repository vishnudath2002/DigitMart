const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    Discount: { type: Number },
    Price: { type: Number, required: true },
    Rating:{type: Number},
    Product_name: { type: String, required: true, unique: true },
    Tax: { type: String },
    Quantity: { type: Number, required: true },
    Category_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' }, 
    Description: { type: String, required: true },
    Image: [{ type: String, required: true }],
    Review: [{ type: String }],
    Feature: [{ type: String }],
    Deleted: { type: Boolean, default: false } ,
    Popularity: { type: Number, default: 0 },
    Featured: { type: Boolean, default: false }, 
    createdAt: { type: Date, default: Date.now } 
});


const Product = mongoose.model('Product', productSchema);

module.exports = Product;
