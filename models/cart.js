const mongoose = require('mongoose');
const { Schema, ObjectId } = mongoose;

const CartSchema = new Schema({

    User_id: { type: Schema.Types.ObjectId },
    Coupon: { type: Schema.Types.ObjectId },
    TotalAmount: {
      type: Number, required: true
    },
    Items: [{
       Product: { type: Schema.Types.ObjectId,required: true,ref:"Product" },
       Quantity: { type: Number, required: true },
       Amount:{ type: Number, required: true }
    }]
    
  });
  
  const Cart = mongoose.model('Cart', CartSchema);

  module.exports = Cart;