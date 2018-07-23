import payments_api from '../../config/payments';

const {Wallet} = require('../../models/wallet');
const {User} = require('../../models/user');
const {Course} = require('../../models/course');


exports.createTransfer = (req, res) => {
  // build transfer object
  let newTransfer = new payments_api.models.Transfer({
    Tag: req.body.Tag,
    AuthorId: req.body.AuthorId,
    CreditedUserId: req.body.CreditedUserId,
    DebitedFunds: req.body.DebitedFunds,
    Fees: req.body.Fees,
    DebitedWalletId: req.body.DebitedWalletId,
    CreditedWalletId: req.body.CreditedWalletId
  });
  payments_api
    .Transfers
    .create(newTransfer)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};


// Get transfer
exports.getTransfer = (req, res) => {
  let tId = req.body.transferId;
  payments_api
    .Transfers
    .get(pId)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};


exports.refundTransfer = (req, res) => {
  res.send('-');
};
