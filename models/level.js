import mongoose from 'mongoose';
import validate from 'mongoose-validator';
import {uniq} from 'lodash';

var ObjectId = mongoose.Schema.Types.ObjectId;

var subjectsValidator = [
	validate({
		validator: (arr) => {
			return arr.length > 0;
		},
		message: 'Add at least one subject to this level.'
	}),
	validate({
		validator: (arr) => {
			let arrStr = arr.map((a) => {
				return a.toString();
			});
			let arrStrUniq = uniq(arrStr);
			return arrStr.length == arrStrUniq.length;
		},
		message: 'Request contains duplicate subjects.'
	})
];

var levelSchema = mongoose.Schema({
	name : {
		type : String,
		trim : true,
		minlength : 1,
		required : [true, 'Level name is required'],
		unique: true
	},
	subjects : {
		type: [{
			type: ObjectId,
			// check if subject exists in subjects collection
			validate: [
				{
					validator: (value) => {
						var Subject = mongoose.model('Subject');
						return Subject.findOne({_id: value}, (err, doc) => {
							if (err || !doc) {
								return false;
							} else {
								return true;
							}
						});
					},
					message: `{VALUE} - subject does not exist`
				}
			],
			ref: 'Subject'
		}],
		validate: subjectsValidator
	}
}, {strict: true});

var Level = mongoose.model('Level', levelSchema);

module.exports = {
  Level
};
