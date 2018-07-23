import payments_api from '../../config/payments';
import axios from 'axios';
const { Wallet } = require('../../models/wallet');
const { User } = require('../../models/user');
const { Course } = require('../../models/course');


exports.createCardRegistration = (req, res) => {
  let uId = req.user._id;
  let mangoPayUser;
  let mangoPayWallet;


  Wallet.findOne({ user: uId })
    .then(walletDB => {
      if (!walletDB) return res.status(400).send({ error: 'You don\'t have a wallet yet.' });
      mangoPayUser = walletDB.mangoPayUser;
      mangoPayWallet = walletDB.mangoPayWallet;


      // build card registration object
      let newCardRegistration = new payments_api.models.CardRegistration({
        Tag: "" + mangoPayUser + " card registratoion",
        UserId: mangoPayUser,
        Currency: req.body.Currency,
        CardType: req.body.CardType
      });

      // console.log(newCardRegistration);

      payments_api.CardRegistrations.create(newCardRegistration)
        .then(createResponse => {
          res.send({
            cardRegistrationResponse: createResponse
          });
        }).catch(err => { res.status(400).send({ err }); });
    }).catch(err => { res.status(400).send({ err }); });

};
