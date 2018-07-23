const mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var PrivateMessage = mongoose.model('PrivateMessage', {
	title: {
		type:String,
		required: true,
		minlength: 1,
		trim: true
	},
	body: {
		type:String,
		required:true,
		minlength:1,
		trim:true
	},
	fromUser: {
		type: ObjectId,
		required: true,
		ref: 'User'
	},
	toUser: {
		type: ObjectId,
		required: true,
		ref: 'User'
	}
});

module.exports = {
	PrivateMessage
};
