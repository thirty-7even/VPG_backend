import mongoose from 'mongoose';
import validate from 'mongoose-validator';
import { User } from './user';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate';

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

var telephoneNumberValidator = [
	validate({
		validator: (v) => {
			return /\d*/.test(v);
		},
		message: '{VALUE} is not a valid phone number'
	})
];

var levelValidator = [
	validate({
		validator: (v) => {
			var Level = mongoose.model('Level');
			return Level.findOne({ _id: v }, (err, doc) => {
				if (err || !doc) {
					return false;
				} else {
					return true;
				}
			});
		},
		message: 'Level {VALUE} does not exist'
	})
];

var subjectValidator = [
	validate({
		validator: (value) => {
			var Subject = mongoose.model('Subject');
			return Subject.findOne({ _id: value }, (err, doc) => {
				if (err || !doc) {
					return false;
				} else {
					return true;
				}
			});
		},
		message: `{VALUE} - subject does not exist`
	})
];

var rangeValidator = [
	validate({
		validator: (v) => {
			v.isInteger && v >= 0 && v <= 100;
		},
		message: '{VALUE} is a wrong value for range'
	})
];



var tutorSchema = mongoose.Schema({
	fullName: {
		type: String,
		trim: true,
		minlength: [1, 'Full name can not be empty'],
		required: [true, 'Full name is required']
	},
	location: {
		address_components: [
			{
				long_name: String,
				short_name: String,
				types: String
			}
		],
		description: String,
		lat: Number,
		lng: Number

	},
	loc: {
		type: { type: String },
		coordinates: []
	},
	telephoneNumber: {
		type: String,
		trim: true,
		validate: telephoneNumberValidator,
		required: [true, 'Phone number is required']
	},
	dob: {
		type: Date,
		required: [true, 'Date of birth is required']
	},
	createdAt: {
		type: Date,
		required: [true, 'Account creation date is required'],
		default: Date.now
	},
	updatedDate: {
		type: Date,
		required: [true, 'Account updated date is required'],
		default: Date.now
	},
	expireAt: {
		type: Date,
		default: undefined
	},
	levels: [
		{
			type: ObjectId,
			ref: 'Level',
			required: [true, 'Level is required'],
			validate: levelValidator
		}
	],
	profileOnline: {
		type: Boolean,
		default: true
	},
	range: {
		type: Number,
		default: 5,
		validate: rangeValidator
	},
	bio: String,
	hobbies: [String],
	profileActivated: {
		type: Boolean,
		default: false
	},
	experiences: [
		{
			intitule: String,
			from: Date,
			to: Date,
			title: String,
			description: String
		}
	],
	cv: [
		{
			intitule: String,
			from: Date,
			to: Date,
			title: String,
			description: String
		}
	],
	majorDescription: {
		type: String
	},
	profilePicture: {
		type: String,
		validate: urlValidator
	},
	backgroundPicture: {
		type: String,
		validate: urlValidator
	},
	rating: {
		totalRating: { type: Number, default: 0 },
		ponctualiteRating: { type: Number, default: 0 },
		communicationRating: { type: Number, default: 0 },
		competencesRating: { type: Number, default: 0 },
		count: { type: Number, default: 0 }
	},
	rated: [
		{
			type: ObjectId,
			ref: 'User'
		}
	],
	comments: [
		{
			title: String,
			body: String,
			totalRating: Number,
			author: {
				fullName: String,
				_id: {
					type: ObjectId,
					ref: 'User',
				}
			}
		}
	],
	subjects: [
		{
			type: ObjectId,
			ref: 'Subject',
			validate: subjectValidator
		}
	],
	asso: {
		type: ObjectId,
		ref: "Asso"
	},
	givenToAsso: [
		{
			asso: {
				type: ObjectId,
				ref: "Asso"
			},
			totalAmount: {
				type: Number,
				default: 0
			}
		}
	],
	siretNumber: String,
	companyAddress: String,
	schedule: [
		{
			day: Number,
			periods: [[String]]
		}
	]
});
// Delete expited documents
// tutorSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });
// tutorSchema.index({ "expireAt": 1 }, { expireAfterSeconds: 0 });
tutorSchema.plugin(mongooseAggregatePaginate);
tutorSchema.index({ "loc": "2dsphere" });
var Tutor = User.discriminator('Tutor', tutorSchema);
// mongoose.model('Tutor').ensureIndexes(function(err) {
//     console.log('ensure tutor index', err)
// })

module.exports = {
	Tutor
};
