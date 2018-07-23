import payments_api from '../../config/payments';

const {Wallet} = require('../../models/wallet');

exports.createPayOut = (req, res) => {
  let uId = req.user._id;
  let mangoPayUser;
  let mangoPayWallet;

  Wallet.findOne({user: uId})
    .then(walletDB => {
      if(!walletDB) return res.status(400).send({ error: 'You don\'t have a wallet yet.'});
      mangoPayUser = walletDB.mangoPayUser;
      mangoPayWallet = walletDB.mangoPayWallet;

      let newPayOut = new payments_api.models.PayOut({
        Tag:JSON.stringify({email:req.user.local.email, fullName:req.user.fullName}),
        AuthorId: mangoPayUser,
        DebitedFunds: req.body.DebitedFunds,
        Fees: {
          Currency: req.body.DebitedFunds.Currency,
          Amount: 0
        },
        BankAccountId: req.body.BankAccountId,
        DebitedWalletId: mangoPayWallet,
        PaymentType: 'BANK_WIRE'
      });


      payments_api
        .PayOuts
        .create(newPayOut)
        .then(result => {
          return res.send(result);
        }).catch(err => { console.log(err); return res.status(400).send({error: err}); });
    }).catch(err => { console.log(err); return res.status(400).send({error: err}); });

};


// Get payout
exports.getPayOut = (req, res) => {
  let pId = req.body.payOutId;
  payments_api
    .PayOuts
    .get(pId)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};
