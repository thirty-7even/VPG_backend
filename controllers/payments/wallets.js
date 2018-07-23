import payments_api from '../../config/payments';
const {Wallet} = require('../../models/wallet');
const {User} = require('../../models/user');


exports.createWallet = (req, res) => {
  // Get user ID from session
  let uId = req.user._id;
  let user;
  let mangoPayUser;
  let mangoPayWallet;

  // Find user in database
  User.findById(uId)
    .then(userFromDB => {
      // Remember user
      user = userFromDB;
      // Create new mangopay user and wallet
      // Check is user already has a wallet
      Wallet.find({user: uId})
      .then(walletsFromDB => {
        if (walletsFromDB.length > 0) return res.status(400).send({error:'You already have a wallet'});

        // console.log("Creating User !")

        // If not, create new mangopay user fisrt
        let newUser = new payments_api.models.UserNatural({
          FirstName: req.body.FirstName,
          LastName: req.body.LastName,
          Address: req.body.Address,
          Birthday: req.body.Birthday,
          Nationality: req.body.Nationality,
          CountryOfResidence: req.body.CountryOfResidence,
          Occupation: req.body.Occupation,
          IncomeRange: req.body.IncomeRange,
          Email: user.local.email,
          Capacity: req.body.Capacity
        });


        // Call to MangoPay API
        payments_api.Users.create(newUser)
          .then(newMangopayUser => {
            // Remember new mangopay user id
            mangoPayUser = newMangopayUser;

            // Create new wallet for this user
            let Description = "VGP owner: " + user._id;
            let newWallet = new payments_api.models.Wallet({
              Owners: [mangoPayUser.Id],
              Description: Description,
              Currency: req.body.Currency
            });


            // Call to MangoPay API
            payments_api.Wallets.create(newWallet)
              .then(newMangopayWallet => {


                // Remember new mangopay wallet id
                mangoPayWallet = newMangopayWallet;


                // Put new mangopay user id in Wallets database
                // Create new wallet object
                var wallet = new Wallet({
                		user: uId,
                		mangoPayUser: mangoPayUser.Id,
                    mangoPayWallet: mangoPayWallet.Id
                	});


                // Save wallet in DB
                wallet.save()
                  .then(newWalletSaved =>{


                      // Send response to client with new mangopay user
                      // and wallet and a new entry in Wattels collection in DB
                			res.send({
                        mangoPayUser: mangoPayUser,
                        mangoPayWallet: mangoPayWallet,
                        savedInDatabase: newWalletSaved
                      });
                    }).catch(err => { console.log("5",err);return res.status(400).send({error:err, message:"could not save wallet"}) });
                	}).catch(err => { console.log("4",err);return res.status(400).send({error:err, message:"could not create wallet"}) });
              }).catch(err => { console.log("3",err); return res.status(400).send({error:err, message:"could not create user"}) });
          }).catch(err => { console.log("2",err);return res.status(400).send({error:err, message:"wallet not found in db"}) });
      }).catch(err => { console.log("1",err);return res.status(400).send({error:err, message:"user not found in db"}) });
};

// Get user's wallet
exports.getWallet = (req, res) => {

  let vgpUserID = req.user._id;
  let mangoUserID;
  let mangoWalletID;


  // Find user's wallet in local DB
  Wallet.find({user: vgpUserID})
    .then(usersFromDB => {
      if(usersFromDB.length < 1) return res.send({});

      // If found, get wallet object from MangoPay API
      mangoUserID = usersFromDB[0].mangoPayUser;
      mangoWalletID = usersFromDB[0].mangoPayWallet;

      // API call
      payments_api.Wallets.get(mangoWalletID)
        .then(result => {
          res.send(result);
        }).catch(err => { return res.status(400).send({error:err}) });
    }).catch(err => { return res.status(400).send({error:err}) });

};


// Get all wallet transactions
exports.getWalletTransactions = (req, res) => {
  let wId = req.body.walletId;
  payments_api
    .Wallets
    .getTransactions()
    .then(result => { res.send(result); })
    .catch(err => { res.status(400).send(err); });
};


// Update walled tag or description
exports.updateWallet = (req, res) => {
  let wId = req.body.walletId;
  payments_api
    .Wallets
    .get(wId)
    .then(wallet => {
      if (req.body.Tag) wallet.Tag = req.body.Tag;
      if (req.body.Description) wallet.Description = req.body.Description;
      payments_api
        .Wallets
        .update(wallet)
        .then(result => { res.send(result); })
        .catch(err => { res.status(400).send(err); });
    })
    .catch(err => { res.status(400).send(err); });
};
