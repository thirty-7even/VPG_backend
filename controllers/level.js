const {Level} = require('./../models/level');
const {ObjectID} = require('mongodb');
import {pick} from 'lodash';

// create new level
exports.create = (req, res) => {
	var level = new Level({
		name: req.body.name,
		subjects: req.body.subjects
	});
	level
		.save()
		.then(
			(doc) => {res.send(doc);},
			(err) => {res.status(400).send(err);});
};

// list all levels
exports.list = (req, res) => {
	Level.find()
		.populate('subjects')
		.then((levels) => {
			if(!levels){
				return res.status(404).send();
			}
			res.send({levels});
		}).catch((e) => {
			res.status(400).send(e);
		});
};

exports.read = (req, res) => {
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Level.findById(id)
	.populate('subjects')
	.then((level) => {
		if(!level){
			return res.status(404).send();
		}
		res.send({level});
	}).catch((e) => {
		res.status(400).send(e);
	});
};

exports.update = (req, res) =>{
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	var body = pick(req.body, ['name', 'subjects']);
	Level.findByIdAndUpdate(id, {
		$set:body
	},{
		new:true,
		runValidators: true
	}).then((level) => {
		if(!level){
			return res.status(404).send();
		}
		res.send({level});
	}).catch((e) => {
		res.status(400).send();
	});
};

exports.delete = (req, res) => {
	var id = req.params.id;

	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Level.findByIdAndRemove(id).then((level) =>{
		if(!level) {
			return res.status(404).send();
		}
		res.send({level});
	}).catch((e) => {
		res.status(400).send();
	});
};
