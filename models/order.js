const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const OrderSchema = new Schema({
  User_id: { type: Schema.Types.ObjectId, ref: 'User', required: true},
  Delivery_date: { type: Date, required: true },
  Address: {
  },
  Products: [{
    Product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    Quantity: { type: Number, required: true },
    Amount:{ type: Number, required: true },
    Status:{ type: String, enum: [ 'Pending', 'Delivered', 'Returned' ,'Cancelled' , 'Processing' ], default:'Pending'},
 }],
  Coupon_id: { type: Schema.Types.ObjectId, ref: 'Coupon' },
  Total_amount: { type: Number, required: true },
  Status: { type: String, enum: [ 'Pending', 'Delivered', 'Returned' ,'Cancelled' , 'Processing', ], required: true },
  Paid: { type: String, default:"Pending" }, 
  Payment_method: { type: String } 
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;