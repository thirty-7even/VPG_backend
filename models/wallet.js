import mongoose from 'mongoose';
var ObjectId = mongoose.Schema.Types.ObjectId;

var walletSchema = mongoose.Schema({
  user: {
		type: ObjectId,
		required: true,
		ref: 'User'
	},
  mangoPayUser: {
    type: String,
		required: true
  },
  mangoPayWallet: {
    type: String,
		required: true
  }
});


var Wallet = mongoose.model('Wallet', walletSchema);

module.exports = {
	Wallet
};
