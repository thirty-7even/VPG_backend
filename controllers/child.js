const {ObjectID} = require('mongodb');
import {pick} from 'lodash';

const {Child} = require('./../models/child');
const {Customer} = require('./../models/customer');


exports.read = (req, res) => {
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Child.findById(id)
    .then((child) =>{
		if(!child) {
			return res.status(404).send();
		}
		res.send({user: child})
	}).catch((e) => {
		res.status(400).send();
	});
};

exports.update = (req, res) =>{
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	var body = pick(req.body, ['fullName', 'profilePicture', 'backgroundPicture']);
	Child.findByIdAndUpdate(id, {
		$set:body
	},{
		new:true,
		runValidators: true
	}).then((child) => {
		if(!child){
			return res.status(404).send();
		}
		res.send({user: child})
	}).catch((e) => {
		res.status(400).send();
	});
};

exports.delete = (req, res) => {
	if(req.user.__t != 'Customer')
		return res.status(401).send({ error : 'Restricted to customers only' });
	let customer = req.user;
	var child = req.params.id;
	let children = customer.children.map(c => c._id.toString());
	let childrenObjects = customer.children;
	if(!children.includes(child)) return res.send({ error : 'refused, it\'s NOT your child' });
	Customer.findById(customer._id).then(customerFromDb => {
		Child.findByIdAndRemove(child).then(childFromDb =>{
			if(!childFromDb) return res.status(404).send();
			customerFromDb.children = [];
			for(let i=0; i<children.length; i++){
				if(children[i]!=child) customerFromDb.children.push(childrenObjects[i]);
			}
			customerFromDb.save().then(result =>{
				res.send({ message : `child ${child} of customer ${customer._id} was deleted` })
			});
		})
	})
	.catch(err => {
		res.status(400).send({error: err});
	});


};
