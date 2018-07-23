import mongoose from 'mongoose';
import validate from 'mongoose-validator';
import bcrypt from 'bcrypt-nodejs';

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

var userRoles = {
	roles: {
		values: ['public', 'user', 'admin', 'super-admin'],
		message: 'Invalid user role'
	},
	accessLevels: {
		'public':      ['super-admin', 'admin', 'user', 'public'],
		'user':        ['super-admin', 'admin', 'user'],
		'admin':       ['super-admin', 'admin'],
		'super-admin': ['super-admin']
	}
};

var userSchema = mongoose.Schema({
	activationCode : {
		type: String
	},
	fullName : {
		type: String
	},
	activated : {
		type: Boolean,
		required: true,
		default: false
	},
	local : {
        email        : String,
        password     : String
  },
	role: {
		type: String,
		required: true,
		default: 'public',
		enum: userRoles.roles
	},
	profilePicture: {
		type: String,
		validate: urlValidator
	},
	backgroundPicture: {
		type: String,
		validate: urlValidator
	}
});



userSchema.methods.hasAccessLevel = function(level){
	let accessAllowedFor = userRoles.accessLevels[level];
	return accessAllowedFor.includes(this.role);
};

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

userSchema.methods.generateActvationCode = () => {
		var code = new mongoose.mongo.ObjectId();
		var chars = 'qwertyuiopasdfghjklzxcvbnm12345667890QWERTYUIOPASDFGHJKLZXCVBNM';
		for(var i=0; i<10; i++){
			code += chars[Math.floor(Math.random() * (chars.length))];
		}
		return code;
};

var User = mongoose.model('User', userSchema);

module.exports = {
	User
};
