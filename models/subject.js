var mongoose = require('mongoose');

var subjectSchema = mongoose.Schema({
	name : {
		type : String,
		trim : true,
		minlength : 1,
		required : [true, 'Subject name is required'],
		unique: true
	}
}, {strict: true});

var Subject = mongoose.model('Subject', subjectSchema);


module.exports = {
  Subject
};
