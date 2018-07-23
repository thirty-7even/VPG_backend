const {Wallet} = require('../models/wallet');

exports.addWallet = (req, res) => {
  if (req.params.id) {
    let uId = req.params.id;
  }
  else {
    return res.status(401).send({error: 'Please log in'});
  }
  Wallet
    .find({user: uId})
    .then(result => {
      if (result) return res.send('you already have a wallet');
      else return res.send('creating a wallet');
    })
    .catch(err => {
      res.status(400).send(err);
    });
};
