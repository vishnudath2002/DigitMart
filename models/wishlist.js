const mongoose = require('mongoose');
const { Schema, ObjectId } = mongoose;

const WishlistSchema = new Schema({

    User_id: { type: Schema.Types.ObjectId },
    Items: [{
       Product: { type: Schema.Types.ObjectId,ref:"Product",required: true },
    }] 
  });
  
  const Wishlist = mongoose.model('Wishlist', WishlistSchema);

  module.exports = Wishlist;