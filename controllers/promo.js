const {Promo} = require('./../models/promo');
const {ObjectID} = require('mongodb');
import {pick} from 'lodash';

// create new level
exports.create = (req, res) => {
	var promo = new Promo({
    name: req.body.name,
    discountType: req.body.discountType,
    rate: req.body.rate,
    restricted: req.body.restricted,
    code: req.body.code,
    limit: req.body.limit
	});
	promo
		.save()
		.then(
			(doc) => {return res.send(doc);},
			(err) => {return res.status(400).send(err);});
};

// list all levels
exports.list = (req, res) => {
	Promo.find()
		.then((promos) => {
			if(!promos){
				return res.status(404).send();
			}
			return res.send({promos});
		}).catch((e) => {
			return res.status(400).send(e);
		});
};

exports.read = (req, res) => {
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Promo.findById(id)
  	.then((promo) => {
  		if(!promo){
  			return res.status(404).send();
  		}
  		return res.send({promo});
  	}).catch((e) => {
  		return res.status(400).send(e);
  	});
};

exports.update = (req, res) =>{
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	var body = pick(req.body, ['name', 'discountType', 'rate', 'restricted', 'limit', 'code']);
	Promo.findByIdAndUpdate(id, {
		$set:body
	},{
		new:true,
		runValidators: true
	}).then((promo) => {
		if(!promo){
			return res.status(404).send();
		}
		return res.send({promo});
	}).catch((e) => {
		return res.status(400).send();
	});
};

exports.delete = (req, res) => {
	var id = req.params.id;

	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Promo.findByIdAndRemove(id).then((promo) =>{
		if(!promo) {
			return res.status(404).send();
		}
		return res.send({promo});
	}).catch((e) => {
		return res.status(400).send();
	});
};
