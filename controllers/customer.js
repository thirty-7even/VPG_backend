const {ObjectID} = require('mongodb');
import {pick} from 'lodash';

const {Customer} = require('./../models/customer');

exports.list = (req, res) => {
	Customer.find()
		.populate('children', 'fullName _id')
    .then((customers) =>{
		if(!customers) {
			return res.status(404).send();
		}
		res.send({customers});
	}).catch((e) => {
		res.status(400).send();
	});
};

exports.read = (req, res) => {
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Customer.findById(id)
		.populate('children', 'fullName _id')
    .then((customer) =>{
		if(!customer) {
			return res.status(404).send();
		}
		res.send({user: customer})
	}).catch((e) => {
		res.status(400).send();
	});
};

exports.update = (req, res) =>{
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	var body = pick(req.body, ['fullName','dob','telephoneNumber']);
	Customer.findByIdAndUpdate(id, {
		$set:body
	},{
		new:true,
		runValidators: true
	}).then((customer) => {
		if(!customer){
			return res.status(404).send();
		}
		res.send({user: customer})
	}).catch((e) => {
		res.status(400).send();
	});
};

exports.delete = (req, res) => {
	var id = req.params.id;

	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Customer.findByIdAndRemove(id).then((customer) =>{
		if(!customer) {
			return res.status(404).send();
		}
		res.send({user: customer})
	}).catch((e) => {
		res.status(400).send();
	});
};
