const nodemailer = require('nodemailer');
const sparkPostTransport = require('nodemailer-sparkpost-transport');
const handlebars = require('handlebars');
const fs = require('fs');

exports.loginCheck = function (level) {
  return function (req,res,next) {
     // not authenticated
    if(!req.isAuthenticated())
      return res.status(401).send({error: 'Access denied, please log in.'});
     // wrong access level
    if(!req.user.hasAccessLevel(level))
      return res.status(401).send({error: `Access denied. User level: ${user.role}, level required: ${level}`});
    // access granted
    return next();
  };
};

exports.logDev = function (messageIn, indentIn) {
  let indent = indentIn || 0;
  let message = '';
  for (let i = 0; i < indent; i++) {
    message += '  ';
  }
  message += messageIn;
  var env = process.env.NODE_ENV || 'development';
  var deb = process.env.DEBUG || 2;
  if (env === 'development' && deb === 2) {
    console.log(message);
  }
};

exports.logAlways = function (messageIn, indentIn) {
  let indent = indentIn || 0;
  let message = '';
  for (let i = 0; i < indent; i++) {
    message += '  ';
  }
  message += messageIn;
  console.log(message);
};

exports.sendEmail = (to, subject, text, htmlFilePath, replacements, callback) => {

	// SPARK
	const transporter = nodemailer.createTransport(sparkPostTransport({
	  'sparkPostApiKey': '',
	  'options': {
	    'open_tracking': true,
	    'click_tracking': true,
	    'transactional': true
	  }
	}));


	if (htmlFilePath) {
		sendHtmlEmail(transporter, to, subject, text, htmlFilePath, replacements, callback);
	} else {
		var message = {
			from: 'no-reply@smail.verygoodprof.fr',
			to,
			subject,
			text
		};

		transporter.sendMail(message, callback);
	}
};

var sendHtmlEmail = function (transporter, to, subject, text, htmlFilePath, replacements, callback) {
	readHTMLFile(htmlFilePath, function (error, html) {
		var template = handlebars.compile(html);
		var htmlToSend = template(replacements);
		var mailOptions = {
			from: '',
			to,
			subject,
			text,
			html: htmlToSend
		};

		transporter.sendMail(mailOptions, callback);
	});

};

var readHTMLFile = function (path, callback) {
	fs.readFile(path, { encoding: 'utf-8' }, function (error, html) {
		if (error) {
			throw error;
			callback(error, null);
		}
		else {
			callback(null, html);
		}
	});
};
