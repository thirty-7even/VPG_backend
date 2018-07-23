import payments_api from '../../config/payments';
const {Wallet} = require('../../models/wallet');

exports.createCartPreAuthorization = (req, res) => {
  let uId = req.user._id;
  Wallet.find({user: uId})
    .then(wlt => {
      mangoUser = wlt.mangoPayUser;
      mangoWallet = wlt.mangoPayWallet;
      let newCPA = new payments_api.models.CardPreAuthorization({
        Tag: `VGP owner : ${uId}`,
        AuthorId: mangoUser,
        DebitedFunds: req.body.DebitedFunds,
        CardId: req.body.CardId,
        SecureModeReturnURL: req.body.SecureModeReturnURL});
    }).catch(err => {return res.status(400).send(error: err);});
};
