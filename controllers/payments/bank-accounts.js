import payments_api from '../../config/payments';
import { Wallet } from '../../models/wallet';


exports.getMyBankAccounts = (req, res) => {
  let uId = req.user._id;
  let mangoPayUser;
  let mangoPayWallet;

  Wallet.findOne({ user: uId })
    .then(walletDB => {
      if (!walletDB) return res.status(400).send({ error: 'You don\'t have a wallet yet.' });
      mangoPayUser = walletDB.mangoPayUser;
      mangoPayWallet = walletDB.mangoPayWallet;

      payments_api
        .Users
        .getBankAccounts(mangoPayUser)
        .then(response => {
          // console.log(response);
          return res.send(response);
        }).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
    }).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
};


exports.createIBANBankAccount = (req, res) => {
  let uId = req.user._id;
  let mangoPayUser;
  let mangoPayWallet;


  Wallet.findOne({ user: uId })
    .then(walletDB => {
      if (!walletDB) return res.status(400).send({ error: 'You don\'t have a wallet yet.' });
      mangoPayUser = walletDB.mangoPayUser;
      mangoPayWallet = walletDB.mangoPayWallet;

      let newBankAccount = new payments_api.models.BankAccount({
        Tag: `VGP owner: ${uId}`,
        UserId: mangoPayUser,
        Type: 'IBAN',
        OwnerAddress: req.body.OwnerAddress,
        OwnerName: req.body.OwnerName,
        IBAN: req.body.IBAN,
        BIC: req.body.BIC
      });
      payments_api
        .Users
        .createBankAccount(mangoPayUser, newBankAccount)
        .then(createdBankAccount => {
          return res.send(createdBankAccount);
        }).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
    }).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
};

// 
// exports.createUKBankAccount = (req, res) => {
//
// };
//
//
// exports.createUSBankAccount = (req, res) => {
//
// };
//
//
// exports.createCABankAccount = (req, res) => {
//
// };
//
//
// exports.createOtherBankAccount = (req, res) => {
//
// };
