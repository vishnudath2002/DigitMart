const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true , unique: true },
    description: { type: String },
    sellcount:{ type : Number },
    Deleted: { type: Boolean, default: false } 
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
