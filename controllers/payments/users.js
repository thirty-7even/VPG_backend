import payments_api from '../../config/payments';
import {Wallet} from '../../models/wallet';


// Create Natural User - legal user not provided
exports.createUser = (req, res) => {
  let newUser = new payments_api.models.UserNatural({
    Tag: req.body.Tag,
    FirstName: req.body.FirstName,
    LastName: req.body.LastName,
    Address: req.body.Address,
    Birthday: req.body.Birthday,
    Nationality: req.body.Nationality,
    CountryOfResidence: req.body.CountryOfResidence,
    Occupation: req.body.Occupation,
    IncomeRange: req.body.IncomeRange,
    Email: req.body.Email,
    Capacity: req.body.Capacity
  });
  payments_api
  .Users
  .create(newUser)
  .then(result => { res.send(result); })
  .catch(err => { res.status(400).send(err); });
};


exports.getAllUsers = (req, res) => {
  payments_api
    .Users
    .getAll()
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};


exports.getUser = (req, res) => {
  let uId = req.body.userId;
  payments_api
    .Users
    .get(uId)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};


exports.getNatural = (req, res) => {
  let uId = req.body.userId;
  payments_api
    .Users
    .getNatural(uId)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};


exports.getLegal = (req, res) => {
  let uId = req.body.userId;
  payments_api
    .Users
    .getLegal(uId)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};


exports.updateUser = (req, res) => {
  let uId = req.body.userId;
  payments_api
    .Users
    .get(uId)
    .then(user => {
      if (req.body.Tag) user.Tag = req.body.Tag;
      if (req.body.FirstName) user.FirstName = req.body.FirstName;
      if (req.body.LastName) user.LastName = req.body.LastName;
      if (req.body.Address) user.Address = req.body.Address;
      if (req.body.Birthday) user.Birthday = req.body.Birthday;
      if (req.body.Nationality) user.Nationality = req.body.Nationality;
      if (req.body.CountryOfResidence) user.CountryOfResidence = req.body.CountryOfResidence;
      if (req.body.Occupation) user.Occupation = req.body.Occupation;
      if (req.body.IncomeRange) user.IncomeRange = req.body.IncomeRange;
      if (req.body.Email) user.Email = req.body.Email;
      payments_api
      .Users
      .update(user)
      .then(result => { res.send(result); })
      .catch(err => { res.status(400).send(err); });
    })
    .catch(err => { res.status(400).send(err); });
};


exports.getMyWallets = (req, res) => {

  let uId = req.user._id;
  let mangoPayUser;
  let mangoPayWallet;


  Wallet.findOne({user: uId})
    .then(walletDB => {
      if(!walletDB) return res.status(400).send({ error: 'You don\'t have a wallet yet.'});
      mangoPayUser = walletDB.mangoPayUser;
      mangoPayWallet = walletDB.mangoPayWallet;
      payments_api
        .Users
        .getWallets(mangoPayUser)
        .then(result => { return res.send(result); })
        .catch(err => { return res.status(400).send(err); });
    }).catch(err => { return res.status(400).send({error: err}); });
};


exports.getMyTransactions = (req, res) => {
  let uId = req.user._id;
  let mangoPayUser;
  let mangoPayWallet;


  Wallet.findOne({user: uId})
    .then(walletDB => {
      if(!walletDB) return res.status(400).send({ error: 'You don\'t have a wallet yet.'});
      mangoPayUser = walletDB.mangoPayUser;
      mangoPayWallet = walletDB.mangoPayWallet;
      payments_api
        .Users
        .getTransactions(mangoPayUser)
        .then(result => { return res.send(result); })
        .catch(err => { return res.status(400).send(err); });
    }).catch(err => { return res.status(400).send({error: err}); });
};


exports.getMyCards = (req, res) => {
  Wallet.findOne({user: req.user._id})
    .then(walletDB => {
      let uId = walletDB.mangoPayUser;
      payments_api
      .Users
      .getCards(uId)
      .then(result => { res.send(result); })
      .catch(err => { res.status(400).send(err); });
    }).catch(err => {res.status(400).send(err);});
};


exports.getKycDocuments = (req, res) => {
  let uId = req.body.userId;
  // console.log('get user');
  payments_api
    .Users
    .getKycDocuments(uId)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};


exports.getKycDocument = (req, res) => {
  let uId = req.body.userId;
  let dId = req.body.documentId;
  // console.log('get user');
  payments_api
    .Users
    .getKycDocument(uId, dId)
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};
