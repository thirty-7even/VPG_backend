import {pick} from 'lodash';

const {Subject} = require('./../models/subject');
const {ObjectID} = require('mongodb');

exports.list = (req, res) => {
	Subject.find()
		.then((subjects) => {
			if(!subjects){
				return res.status(404).send();
			}
			res.send({subjects});
		}).catch((e) => {
			res.status(400).send(e);
		});
};

exports.read = (req, res) => {
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Subject.findById(id)
		.then((subject) => {
			if(!subject){
				return res.status(404).send();
			}
			res.send({subject});
		}).catch((e) => {
			res.status(400).send(e);
		});
};

exports.update = (req, res) =>{
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	var body = pick(req.body, ['name']);
	Subject.findByIdAndUpdate(id, {
		$set:body
	},{
		new:true,
		runValidators: true
	}).then((subject) => {
		if(!subject){
			return res.status(404).send();
		}
		res.send({subject});
	}).catch((e) => {
		res.status(400).send();
	});
};

exports.delete = (req, res) => {
	var id = req.params.id;

	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Subject.findByIdAndRemove(id).then((subject) =>{
		if(!subject) {
			return res.status(404).send();
		}
		res.send({subject});
	}).catch((e) => {
		res.status(400).send();
	});
};

exports.create = (req, res) => {
	var subject = new Subject({
		name: req.body.name
	});
	subject
		.save()
		.then(
			(doc) => {res.send(doc);},
			(err) => {res.status(400).send(err);});
};
