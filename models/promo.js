import mongoose  from 'mongoose';
import validate from 'mongoose-validator';

var ObjectId = mongoose.Schema.Types.ObjectId;

var discountTypes = {
	types: {
		values: ['flat', 'percentage'],
		message: 'Invalid discount type'
	}
};

var promoSchema = mongoose.Schema({
  name: {
    type: String,
		trim: true,
		required: [true, 'Promo name is required']
  },
  discountType: {
    type: String,
    required : [true, 'Discount type is required'],
    default: 'percentage',
    enum: discountTypes.types
  },
  rate: {
    type: Number,
    required: [true, 'Discount rate is required'],
    default: 0
  },
  restricted: {
    type: Boolean,
    default: true
  },
  limit: {
    type: Number,
    default: 1
  },
  code: {
    type: String,
    trim: true,
    required: [true, 'Promo code is required'],
    unique: [true, 'Promotion with this code already exists']
  },
  redeemed: [
    {
      user: {type: ObjectId, ref: 'User', required: true},
      count: {type: Number, default: 0}
    }
  ],
  assigned: [
    {
      user: {type: ObjectId, ref: 'User', required: true}
    }
  ]
});

var Promo = mongoose.model('Promo', promoSchema);


module.exports = {
	Promo
};
