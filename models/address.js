const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const AddressSchema = new Schema({
  User_id: { type: Schema.Types.ObjectId , required: true , unique: true , ref:"User" },
  Home_address: {
     Street: { type: String },
     City: { type: String},
     Pincode: { type: String},
     State: { type: String},
  },
  Office_address: {
     Street: { type: String},
     City: { type: String},
     Pincode: { type: String},
     State: { type: String},
  },
  New_address: {
   Street: { type: String },
   City: { type: String },
   Pincode: { type: String },
   State: { type: String },
},
  
});

const Address = mongoose.model('Address', AddressSchema);

module.exports = Address;