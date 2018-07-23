import mongoose  from 'mongoose';
import validate from 'mongoose-validator';

var ObjectId = mongoose.Schema.Types.ObjectId;

var urlValidator = [
	validate({
		validator: 'isLength',
		arguments: [10, 2100],
		message: 'URL should be between {ARGS[0]} and {ARGS[1]} characters long.'
	}),
	validate({
		validator: 'isURL',
		message: 'Wrong URL format.'
	})
];

var assoSchema = mongoose.Schema({
	amount: {
		type: Number,
		default: 0
	},
	name: {
		type : String,
		trim : true,
		minlength : 1,
		required : [true, 'Asso name is required'],
		unique: true
	},
  description: {
		type : String,
		trim : true,
		minlength : 1,
		required : [true, 'Asso description is required']
	},
  url: {
    type: String,
    validate: urlValidator
  },
  imageUrl: {
    type: String,
    validate: urlValidator
  },
  mangoPayWallet: {
    type: String
  }
});

var Asso = mongoose.model('Asso', assoSchema);


module.exports = {
	Asso
};
