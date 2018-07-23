
const { Course } = require('./../models/course');
const { Child } = require('../models/child');
const { Customer } = require('../models/customer');
const { Promo } = require('../models/promo');
const { ObjectID } = require('mongodb');
const { Wallet } = require('../models/wallet');

import { logDev, logAlways, sendEmail } from '../utils/index';
import mailbox from './mailbox';
import payments_api from '../config/payments';


// Find course
var findCourse = function(courseId, data, key) {
  return new Promise((resolve, reject) => {
    Course.findById(courseId).then(course => {
        if(!course) reject({error: 'course not found'});
        data[key] = course;
        resolve(course);
      }).catch(err =>{reject({error: err});});
  });
};


// Find a wallet
var findWallet = function(usr, data, key) {
  return new Promise((resolve, reject) => {
    Wallet.findOne({user: usr}).then(wallet => {
        if(!wallet) reject({error: 'wallet not found'});
        data[key] = wallet;
        resolve(wallet);
      }).catch(err =>{reject({error: err});});
  });
};



// Calclate how much to goes to charity, tutor and and vgp
var priceBreakDown = function(data) {
  return new Promise((resolve, reject) => {
    let toCharity = 0;
    let toTutor = 18 * data.course.duration;
    let vgpFee = 0;
    let toPay = data.priceBreakDown.full - data.priceBreakDown.discount;

    let giving = (data.course.givingToAsso != undefined && data.course.givingToAsso != null);
    if(giving) {
      toCharity = 2 * data.course.duration;;
      toTutor = 17 * data.course.duration;;
    }
    vgpFee = toPay - toCharity - toTutor;
    if(vgpFee < 0) reject({error: 'fee can not be a negative value'});
    data.priceBreakDown.toPay = toPay;
    data.priceBreakDown.charity = toCharity;
    data.priceBreakDown.tutor = toTutor;
    data.priceBreakDown.fee = vgpFee;
    resolve();
  });
};


// Work out the price
var applyDiscount = function(data) {
  return new Promise((resolve, reject) => {
    let full = 29 * data.course.duration;
    let discount = 0;
    if(data.promo){


      Promo.find({'code': data.promo}).then(result => {
        if(result.length>0){
          let promo = result[0];
          let canUse = true;
          let exceededLimit = false;
          let usedBefore = -1;
          if (promo.restricted){
            canUse = false;
            for (let i = 0; i < promo.assigned.length; i++) {
              if (promo.assigned[i].user.toString() == data.customerId) {
                canUse = true;
                break;
              }
            }
          }

          if(promo.redeemed){
            for(let i = 0; i < promo.redeemed.length; i++){
              if(promo.redeemed[i].user.toString() == data.customerId){
                usedBefore = i;
                if(promo.limit<=promo.redeemed[i].count){
                  exceededLimit = true;
                }
                break;
              }
            }
          }

          if(canUse && !exceededLimit){
            if(promo.discountType == 'percentage'){
              discount = full / 100 * promo.rate;
            }
            else if(promo.discountType == 'flat'){
              discount = promo.rate;
            }
          } else {
            delete data.promo;
          }
        }
        // this is the final price
        discount = Math.round(discount * 100) / 100;
        data.priceBreakDown = {
          full,
          discount,
          currency: data.currency
        };
        resolve('' + full + data.currency);
      }).catch(err =>{reject({error: err});});


    }else{
      data.priceBreakDown = {
        full,
        discount,
        currency: data.currency
      };
      resolve('' + full + data.currency);
    }
  });
};


// Create payment object
var buildPaymentObject = function(data) {
  return new Promise((resolve, reject) => {
    let Currency = data.priceBreakDown.currency;
    let DebitedFunds = {
      Currency,
      Amount: data.priceBreakDown.toPay * 100
    };
    let CreditedFunds = {
      Currency,
      Amount: (data.priceBreakDown.tutor + data.priceBreakDown.charity) * 100
    };
    let Fees = {
      Currency,
      Amount: data.priceBreakDown.fee * 100
    };

    let tagObject = data.priceBreakDown;
    tagObject.courseId = data.course._id;

    if(data.promo){
      tagObject.promo = data.promo;
    }

    let newPayIn;
    if (data.paymentMethod == 'WEB') {
      newPayIn =  new payments_api.models.PayIn({
        Tag: JSON.stringify(tagObject),
        AuthorId: data.customerWallet.mangoPayUser,
        CreditedWalletId: data.tutorWallet.mangoPayWallet,
        DebitedFunds,
        CreditedFunds,
        Fees,
        ReturnURL: 'https://' + data.host + '/mon-espace',
        CardType: data.CardType,
        Culture: data.Culture,
        PaymentType: 'CARD',
        ExecutionType: 'WEB'
      });
    } else if (data.paymentMethod == 'DIRECT') {
      newPayIn = new payments_api.models.PayIn({
        Tag: JSON.stringify(tagObject),
        AuthorId: data.customerWallet.mangoPayUser,
        CreditedWalletId: data.tutorWallet.mangoPayWallet,
        DebitedFunds,
        CreditedFunds,
        Fees,
        SecureModeReturnURL: data.SecureModeReturnURL,
        CardId: data.CardId,
        PaymentType: 'CARD',
        ExecutionType: 'DIRECT'
      });
    }
    data.newPayIn = newPayIn;
    resolve(newPayIn);
  });
};


// Pay for course
exports.pay = (req, res) => {
	// Object to pass data arond between promises
	var myData = {};
	// myData.customerId = '5a95b2c3dbfb7623b547946c';
  // console.log("############################################");
  // console.log('Paying for course');
  // console.log(req.body);
	myData.customerId = req.user._id;
	myData.CardType = req.body.CardType || "CB_VISA_MASTERCARD";
	myData.CardId = req.body.CardId;
	myData.Culture = req.body.Culture || "FR";
	myData.promo = req.body.promo;
	myData.currency = req.body.Currency || 'EUR';
	myData.SecureModeReturnURL = req.body.SecureModeReturnURL;
	myData.host = req.headers.host;
	myData.paymentMethod = req.body.paymentMethod || 'WEB';
	myData.course = {};
	myData.customerWallet = {};
	myData.tutorWallet = {};

	findCourse(req.body.courseId, myData, 'course')
	// find customer's wallet
	.then(function(){return findWallet(myData.course.customer._id, myData, 'customerWallet');})
	// find tutor's wallet
	.then(function(){return findWallet(myData.course.tutor._id, myData, 'tutorWallet');})
	// Calculate prices, build payment objects
	.then(function(){return applyDiscount(myData);})
	.then(function(){return priceBreakDown(myData);})
	.then(function(){return buildPaymentObject(myData);})
	// return results
	.then(newPayIn => {
		payments_api.PayIns.create(newPayIn)
			.then(result => {
        // console.log('User redirected to MangoPay');
				return res.send(result);
			})
			.catch(err => { console.log(err); return res.status(400).send({ error: err }); });
	}).catch(err =>{ return res.status(400).send(err); });
};


exports.create = (req, res) => {
	var isFree = req.body.free || false;
	var date = new Date(req.body.date);
	var childName, customerName, customerObject;


	Customer.findById(req.body.customer)
		.then(db_customer => {
			customerName = db_customer.fullName;
			customerObject = db_customer;
			Child.findById(req.body.child)
				.then(db_child => {
					childName = db_child.fullName;
					var course = new Course({
						tutor: { fullName: req.user.fullName, _id: req.user._id },
						customer: { fullName: customerName, _id: req.body.customer },
						child: { fullName: childName, _id: req.body.child },
						positive: req.body.positive,
						negative: req.body.negative,
						description: req.body.description,
						paid: false,
						date,
						free: isFree,
						duration: req.body.duration,
						givingToAsso: req.user.asso
					});
					course
						.save()
						.then(
						(doc) => {

							const values = { customer: `${doc.customer.fullName}`, tutor: doc.tutor.fullName, date: new Date(doc.date).toLocaleDateString('fr-FR') }

							// Send email to customer
							sendEmail(customerObject.local.email,
								`Very Good Prof - Nouveau cours donné à ${childName}`,
								`${doc.tutor.fullName} a donné un nouveau cours particulier à votre enfant le ${new Date(doc.date).toLocaleDateString('fr-FR')}.\n` +
								`Pour voir le rapport et régler le Very Good Prof, rendez vous sur votre espace personnel:\n` +
								`http://verygoodprof.fr/mon-espace\n` +
								`A bientôt sur Very Good Prof !`,
								'./email_templates/courses_notifications_email.html',
								values,
								function (result, err) {
									if (err) {
										logAlways('Email sent to ' + customerObject.local.email, 2);
									} else {
										logAlways('Cound\'n send email to ' + customerObject.local.email, 2);
									}
								});

							// Send PM  to a child
							const content = doc.isFree ? `Salut ${childName ? childName.split(" ")[0] : ""} ! Suite à notre premier cours, nous pouvons maintenant discuter via la plateforme Very Good Prof. Si tu as besoin d'aide, des questions ou quoi que ce soit, je suis là ! N'hésites surtout pas :) ` : `Si tu as besoin d'aide, des questions ou quoi que ce soit à propos de notre dernier cours le ${ new Date(doc.date).toLocaleDateString('fr-FR')}, n'hésites pas !`;
							mailbox
								.sendSocket(req.user._id, req.body.child, req.body.child, content, response => {
									if (response.error) return res.status(400).send(response)
									else return res.send(doc);
								})
						},
						(err) => {
							res.status(400).send(err);
						})
						.catch(err => {
							res.status(400).send(err);
						});
				})
				.catch(err => {
					res.status(400).send(err);
				});
		})
		.catch(err => {
			res.status(400).send(err);
		});
};

exports.cancel = (req, res) => {
	var courseId = req.params.id;
	var tutorId = req.user._id;
	Course
		.findById(courseId)
		.then(course => {
			if (!course)
				return res.status(404).send({ error: 'Course not found' });
			if (course.paid)
				return res.status(400).send({ error: 'Can not cancel a course that has been paid for' });
			if (course.tutor._id.toString() != tutorId)
				return res.status(400).send({ error: 'Tutor can only cancelled his own courses' });
			course
				.remove()
				.then(course => {
					return res.send(course._id);
				});
		})
		.catch(err => {
			console.log(err);
			res.status(400).send(err);
		});
};

exports.read = (req, res) => {
	var courseId = req.params.id;
	let isTutor = (req.user.__t == 'Tutor');
	var uId = req.user._id;
	Course
		.findById(courseId)
		.then(course => {
			if (!course) return res.status(404).send({ error: 'Not found' });
			if (isTutor && course.tutor._id.toString() == uId.toString()) {
				if (course.paid && !course.seenByTutor) {
					course.seenByTutor = true;
					course.save().then(newCrs => {
						return res.send({ course: newCrs });
					}).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
				}
				return res.send({ course: course });
			} else if (!isTutor && course.customer._id.toString() == uId.toString()) {
				if (!course.seenByCustomer) {
					course.seenByCustomer = true;
					course.save().then(newCrs => {
						return res.send({ course: newCrs });
					}).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
				}
				return res.send({ course: course });
			} else return res.status(400).send({ error: 'Not your course' });
		}).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
};

exports.isFirstCourse = (req, res) => {
	var customerId = req.body.customer;
	var tutorId = req.body.tutor;
	Course
		.find({ 'tutor._id': tutorId, 'customer._id': customerId, active: true })
		.then(courses => {
			if (courses.length > 0) return res.send({ tutor: tutorId, customer: customerId, isFirstCourse: false });
			return res.send({ tutor: tutorId, customer: customerId, isFirstCourse: true });
		})
		.catch(err => {
			res.status(400).send(err);
		});
};

exports.listUser = (req, res) => {
	var userId = req.user._id;
	let query = {};
	if (req.user.__t == 'Customer') query = { 'customer._id': userId };
	else if (req.user.__t == 'Tutor') query = { 'tutor._id': userId };
	else if (req.user.__t == 'Child') query = { 'child._id': userId };
	else return res.status(400).send();
	Course
		.find(query)
		.then(courses => {
			return res.send({ courses });
		})
		.catch(err => {
			return res.status(400).send(err);
		});
};

exports.tutorChildCourses = (req, res) => {
	let query = {};
	if (req.body.tutor) query.tutor._id = req.body.tutor;
	if (req.body.child) query.child._id = req.body.child;
	if (req.body.from) query.date = { $gte: req.body.from };
	if (req.body.to) {
		if (query.date) query.date.$lte = req.body.to;
		else query.date = { $lte: req.body.to };
	}
	Course
		.find(
		query
		)
		.then(courses => {
			res.send({ courses });
		})
		.catch(err => {
			res.status(400).send(err);
		});
};

exports.coursesSummary = (req, res) => {
	let user = req.user;
	if (user.__t != 'Customer')
		return res.status(401).send({ error: 'Restricted to customers only' });
	if (!user.children || user.children.length < 1)
		return res.status(404).send({ error: 'You don\'t have any children registered on your account' });
	let children = user.children;
	let query = { 'child._id': { $in: children } };
	if (req.body.from) query.date = { $gte: req.body.from };
	if (req.body.to) {
		if (query.date) query.date.$lte = req.body.to;
		else query.date = { $lte: req.body.to };
	}
	Course
		.find(query)
		.then(courses => {
			res.send({ courses });
		})
		.catch(err => {
			res.status(400).send(err)
		})
};
