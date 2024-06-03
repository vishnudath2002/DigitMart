const mongoose = require('mongoose');

const { Schema, ObjectId } = mongoose;

const WalletSchema = new Schema({
  User_id: { type: Schema.Types.ObjectId, required: true,ref:"User", unique: true },
  Balance: { type: Number, required: true },
  History: [{
    amount: { type: Number },
    status: { type: String, enum: ['Deposit', 'Withdrawal'] },
    oldBalance: { type: Number },
    createdAt: { type: Date, default: Date.now } 
  }]
});

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports= Wallet;