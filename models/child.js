var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
import validate from 'mongoose-validator';

var {User} = require('./user');

var customerValidator = [
	validate({
		validator: (id) => {
      let Customer = mongoose.model('Customer');
      return Customer.findOne({_id: id}, (err, doc) => {
        if (err || !doc) {
          return false;
        } else {
          return true;
        }
      });
		},
		message: 'Parent doesn\'t exist.'
	})
];

var childSchema = mongoose.Schema({
	fullName : {
		type : String,
		trim : true,
    required: true
	},
  parent : {
		fullName: String,
		_id:{
			type: ObjectId,
			validate: customerValidator,
			ref: 'Customers',
			required: true
		}
	}
});

var Child = User.discriminator('Child', childSchema);


module.exports = {
	Child
};
