var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var {User} = require('./user');

var customerSchema = mongoose.Schema({
	fullName : {
		type : String,
		trim : true
	},
	telephoneNumber : {
	  type : String,
		trim : true
	},
	parrain : {
	  type : String,
		trim : true
	},
	dob : {
	  type : Date
	},
	children : [
		{
			fullName: String,
			_id: {
				type: ObjectId,
				ref: 'User'
			}
		}
	]
}, {strict: true});

var Customer = User.discriminator('Customer', customerSchema);


module.exports = {
	Customer
};
