import payments_api from '../../config/payments';

const { Wallet } = require('../../models/wallet');



// Create a pay-in
exports.createWebPayIn = (req, res) => {
  // build payin object
  let newPayIn = new payments_api.models.PayIn({
    Tag: req.body.Tag,
    AuthorId: req.body.AuthorId,
    DebitedFunds: req.body.DebitedFunds,
    CreditedFunds: req.body.CreditedFunds,
    Fees: req.body.Fees,
    ReturnURL: req.body.ReturnURL,
    CreditedWalletId: req.body.CreditedWalletId,
    CardType: req.body.CardType,
    Culture: req.body.Culture,
    PaymentType: req.body.PaymentType,
    ExecutionType: 'WEB'
  });
  payments_api
    .PayIns
    .create(newPayIn)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};

exports.createDirectPayIn = (req, res) => {
  let uId = req.user._id;
  let mangoPayUser;
  let mangoPayWallet;


  Wallet.findOne({ user: uId })
    .then(walletDB => {
      if (!walletDB) return res.status(400).send({ error: 'You don\'t have a wallet yet.' });
      mangoPayUser = walletDB.mangoPayUser;
      mangoPayWallet = walletDB.mangoPayWallet;
      // build payin object
      let newPayIn = new payments_api.models.PayIn({
        Tag: req.body.Tag,
        AuthorId: mangoPayUser,
        CreditedWalletId: req.body.CreditedWalletId,
        DebitedFunds: req.body.DebitedFunds,
        CreditedFunds: req.body.CreditedFunds,
        Fees: req.body.Fees,
        SecureModeReturnURL: req.body.SecureModeReturnURL,
        CardId: req.body.CardId,
        PaymentType: req.body.PaymentType,
        ExecutionType: 'DIRECT'
      });
      // console.log(newPayIn);
      payments_api
        .PayIns
        .create(newPayIn)
        .then(result => { return res.send(result); })
        .catch(err => { return res.status(400).send({ error: err, where: 'payins create' }); });
    }).catch(err => { console.log(err); return res.status(400).send({ error: err, where: 'wallets findone' }); });
};






// Get payin
exports.getPayIn = (req, res) => {
  let pId = req.body.payInId;
  payments_api
    .PayIns
    .get(pId)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};


exports.refundPayIn = (req, res) => {
  res.send('-');
};
