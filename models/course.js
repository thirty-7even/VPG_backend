import mongoose from 'mongoose';
import validate from 'mongoose-validator';

var ObjectId = mongoose.Schema.Types.ObjectId;

// id
// tutor
// customer
// child
// description
// positive
// negative
// paid
// date
// free
// duration
var tutorValidator = [
  validate({
    validator: (id) => {
      let Tutor = mongoose.model('Tutor');
      return Tutor.findOne({ _id: id }, (err, doc) => {
        if (err || !doc) {
          return false;
        } else {
          return true;
        }
      });
    },
    message: 'Tutor doesn\'t exist.'
  })
];

var customerValidator = [
  validate({
    validator: (id) => {
      let Customer = mongoose.model('Customer');
      return Customer.findOne({ _id: id }, (err, doc) => {
        if (err || !doc) {
          return false;
        } else {
          return true;
        }
      });
    },
    message: 'Customer doesn\'t exist.'
  })
];

var childValidator = [
  validate({
    validator: (id) => {
      let Child = mongoose.model('Child');
      return Child.findOne({ _id: id }, (err, doc) => {
        if (err || !doc) {
          return false;
        } else {
          return true;
        }
      });
    },
    message: 'Child doesn\'t exist.'
  })
];

let courseSchema = mongoose.Schema({
  seenByTutor: { type: Boolean, default: false },
  seenByCustomer: { type: Boolean, default: false },
  tutor: {
    fullName: String,
    _id: {
      type: ObjectId,
      validate: tutorValidator,
      ref: 'Tutors',
      required: true
    }
  },
  customer: {
    fullName: String,
    _id: {
      type: ObjectId,
      validate: customerValidator,
      ref: 'Customers',
      required: true
    }
  },
  paymentStatus: String,
  child: {
    fullName: String,
    _id: {
      type: ObjectId,
      validate: childValidator,
      ref: 'Child',
      required: true
    }
  },
  description: {
    type: String
  },
  positive: String,
  negative: String,
  paid: Boolean,
  amount: {
    parentPaid: { type: Number, default: 0 },
    tutorReceived: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }
  },
  givingToAsso: {
    type: String
  },
  date: Date,
  free: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    min: [0.5, 'Duration is too short'],
    max: [4, 'Duration is too long'],
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { strict: true });

var Course = mongoose.model('Course', courseSchema);

module.exports = {
  Course
};
