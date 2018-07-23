var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var {User} = require('./user');

var adminSchema = mongoose.Schema({
	fullName : {
		type : String,
		trim : true
	}
});

var Admin = User.discriminator('Admin', adminSchema);


module.exports = {
	Admin
};
