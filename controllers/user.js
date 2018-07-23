const { ObjectID } = require('mongodb');
import moment from 'moment';
import {pick} from 'lodash';
var bcrypt = require('bcrypt-nodejs');

import utils from '../utils/index';


const { PrivateMessage } = require('./../models/private-message');
const { User } = require('./../models/user');
const { Course } = require('../models/course');


// LIST ALL USERS
exports.list = (req, res) => {
	User.find()
		.populate('subjects')
		.then((users) => {
			if (!users) {
				return res.status(404).send();
			}
			res.send({ users });
		}).catch((e) => {
			res.status(400).send();
		});
};


exports.getCourseNotifications = (req, res) => {
	if (req.user.__t == 'Customer') {
		// return unseen courses and unpaid courses
		let notSeenNotPaid = [];
		let notPaid = [];


		// find all courses by customer id
		Course.find({ "customer._id": req.user._id }).then(result => {
			for (let i = 0; i < result.length; i++) {
				let course = result[i];
				if (!course.seenByCustomer) notSeenNotPaid.push(course);
				if (course.seenByCustomer && !course.paid) notPaid.push(course);
			}
			return res.send({ newCourses: notSeenNotPaid, unpaidCourses: notPaid });
		}).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
	} else if (req.user.__t == 'Tutor') {
		// return awaiting payment and paid but unseen
		let notPaid = [];
		let paidNotSeen = [];


		Course.find({ "tutor._id": req.user._id }).then(result => {
			for (let i = 0; i < result.length; i++) {
				let course = result[i];
				if (!course.paid) notPaid.push(course);
				if (course.paid && !course.seenByTutor) paidNotSeen.push(course);
			}
			return res.send({ awaitingPayment: notPaid, newPaid: paidNotSeen });
		}).catch(err => { console.log(err); return res.status(400).send({ error: err }); });

	} else {
		return res.status(404).send();
	}
};

exports.listAdmins = (req, res) => {
	User.find({ role: "admin" })
		.then((users) => {
			if (!users) {
				return res.status(404).send();
			}
			res.send({ users });
		}).catch((e) => {
			res.status(400).send();
		});
};

// READ USER
exports.read = (req, res) => {
	var id = req.params.id;
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}
	User.findById(id)
		.then((user) => {
			if (!user) {
				return res.status(404).send();
			}
			res.send({ user });
		}).catch((e) => {
			res.status(400).send();
		});
};

exports.update = (req, res) => {
	var id = req.params.id;
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}
	var body = pick(req.body, ['fullName', 'dob', 'telephoneNumber', 'profilePicture', 'backgroundPicture']);
	User.findByIdAndUpdate(id, {
		$set: body
	}, {
			new: true,
			runValidators: true
		}).then((user) => {
			if (!user) {
				return res.status(404).send();
			}
			res.send({ user });
		}).catch((e) => {
			res.status(400).send();
		});
};

exports.delete = (req, res) => {
	var id = req.params.id;

	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}
	User.findByIdAndRemove(id).then((user) => {
		if (!user) {
			return res.status(404).send();
		}
		res.send({ user });
	}).catch((e) => {
		res.status(400).send();
	});
};

exports.listMessages = (req, res) => {
	var id = req.params.id;
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}
	PrivateMessage.find({ fromUser: id })
		.populate('fromUser')
		.populate('toUser')
		.then((messages) => {
			if (!messages) {
				return res.status(404).send();
			}
			res.send({ messages });
		}).catch((e) => {
			res.status(400).send();
		});
};

exports.activate = (req, res) => {
	var activationCode = req.params.activationCode;
	var userId = req.params.id;
	var email = req.params.email;
	var newDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
	var body = { activated: true, activationCode: 'activated', createdAt: newDate.toISOString() };
	User.findOneAndUpdate({ activationCode: activationCode }, {
		$set: body
	}, {
			new: true
		}).then((user) => {
			if (!user) {
				return res.status(404).send();
			}

			res.redirect(`${userId ? `/connexion?email=${email}&id=${userId}` : `/connexion?email=${email}`}`);
		}).catch((e) => {
			res.status(400).send();
		});
};

exports.changePassword = (req, res) => {
	let oldPwd = req.body.oldPwd;
	let newPwd = req.body.newPwd;
	let id = req.user._id;

	User.findById(id)
		.then((user) => {
			if (!user) {
				return res.status(404).send();
			}
			bcrypt.compare(oldPwd, user.local.password, function (err, result) {
				let passwordsMatch = result;
				if (!passwordsMatch) {
					return res.status(401).send();
				}
				user.local.password = bcrypt.hashSync(newPwd, bcrypt.genSaltSync(8), null);
				user.$__save({}, (error, doc) => {
					if(error){
					  return res.status(400).send({ error });
					}
					  return res.send({ user });
					})
				  })
		}).catch((e) => {
			res.status(400).send();
		});
};

exports.forgotPassword = (req, res) => {
	let email = req.body.email;
	let tempPwd = ""
	var chars = 'qwertyuiopasdfghjklzxcvbnm12345667890QWERTYUIOPASDFGHJKLZXCVBNM';
	for (var i = 0; i < 8; i++) {
		tempPwd += chars[Math.floor(Math.random() * (chars.length))];
	}

	User
		.findOne({ "local.email": email })
		.then(user => {
			if (!user) res.status(400).send("Cette adresse mail ne correspond à aucun compte. Veuillez réessayer avec une adresse email existante.");
			utils.sendEmail(
				user.local.email,
				'Very Good Prof, mot de passe oublié',
				`Bonjour, \nIl semble que vous ayez oublié votre mot de passe. \nVotre nouveau mot de passe temporaire pour vous connecter : \n \n${tempPwd}\n \nNous vous conseillons de changer de mot de passe dès votre connexion pour des raisons de sécurité.\nA bientôt sur Very Good Prof, \nL'équipe VGP`,
				null,
				null,
				(sendError, sendResult) => {
					if (sendError) return res.status(400).send(sendError);
					user.local.password = bcrypt.hashSync(tempPwd, bcrypt.genSaltSync(8), null);
					user.$__save({}, (error, doc) => {
						if(error){
						  return res.status(400).send({ error });
						}
						  return res.send({ user });
						})
					  })
		})
		.catch(error => {
			return res.status(400).send("Cette adresse mail ne correspond à aucun compte. Veuillez réessayer avec une adresse email existante.");

		})
};
