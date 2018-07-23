import {Asso} from './../models/asso';
import {ObjectID} from 'mongodb';
import {pick} from 'lodash';
import payments_api from './../config/payments';


// MANGOPAY USER WHO HAS WALLETS OF ALL THE CHARITIES
let mangoPayUser = {
  // ...
  // ...
  // ...
};


exports.create = (req, res) => {
    // Create mangopay wallet for this charity
  let newWallet = new payments_api.models.Wallet({
    Owners: [mangoPayUser.Id],
    Description: req.body.name + " asso wallet",
    Currency: req.body.currency
  });


  // Save wallen in mango db
  payments_api.Wallets.create(newWallet)
    .then(newMangopayWallet => {
      // console.log("wallet saved");
      // Create new asso
      let asso = new Asso({
        name: req.body.name,
        description: req.body.description,
        url: req.body.url,
        imageUrl: req.body.imageUrl,
        mangoPayWallet: newMangopayWallet.Id
      });


      // Save asso.
      asso
        .save()
        .then(newAsso => {
          // console.log('asso saved');
          return res.send({asso: newAsso});
        }).catch(err => { console.log("5",err);return res.status(400).send({error:err, message:"could not save asso"}) });
      }).catch(err => { console.log("3",err); return res.status(400).send({error:err, message:"could not save wallet"}) });
};


exports.list = (req, res) => {
  Asso
    .find({})
    .then( results => {
      if(!results){
        return res.status(404).send();
      } else {
        res.send({ asso: results });
      }
    })
    .catch( err => {
      res.status(400).send(err);
    });
};


exports.read = (req, res) => {
  var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	Asso
    .findById(id)
  	.then( results => {
  		if(!results){
  			return res.status(404).send();
  		} else {
        res.send({ asso: results });
      }
  	}).catch( err => {
  		res.status(400).send(err);
  	});
};


exports.update = (req, res) => {
  var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}
	var body = pick(req.body, ['name', 'description', 'url', 'imageUrl']);
  Asso
    .findByIdAndUpdate(id, {
  		$set:body
  	},{
  		new:true,
  		runValidators: true
  	})
    .then( result => {
  		if(!result){
  			return res.status(404).send();
  		}
  		res.send({ asso: result});
  	})
    .catch(err => {
  		res.status(400).send(err);
  	});
};


exports.delete = (req, res) => {
  var id = req.params.id;
  if(!ObjectID.isValid(id)){
    return res.status(404).send();
  }
  Asso
    .findByIdAndRemove(id)
    .then(result =>{
      if(!result) {
        return res.status(404).send();
      }
      res.send({ asso: result });
    })
    .catch(err => {
      res.status(400).send(err);
    });
};
