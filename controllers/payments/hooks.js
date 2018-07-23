import payments_api from '../../config/payments';
import { logDev, logAlways, sendEmail } from '../../utils/index';
import { Tutor } from '../../models/tutor';
import { Customer } from '../../models/customer';
import { Course } from '../../models/course';
import { Asso } from '../../models/asso';
import { Wallet } from '../../models/wallet';
import { Promo } from '../../models/promo';




// Get resource from mangopay
var getResource = function(resourceId, data) {
  return new Promise((resolve, reject) => {

    // API call
    payments_api.PayIns.get(resourceId).then(result => {
      if(!result) {
        reject({error: 'Payin: resouce not found'});
      }
      data.resouce = result;
      data.tagObject = JSON.parse(result.Tag);

      // check it this is a course payment
      data.isCoursePayment = (data.tagObject.hasOwnProperty('courseId'));

      // if it is, also find a course object
      if(data.isCoursePayment){
        Course.findById(data.tagObject.courseId).then(course => {
            if(!course) {
              reject({error: 'course not found'});
            }
            data.course = course;
            resolve(result);
          }).catch(err =>{
            reject({error: err});
          });
      }

      // if not, just go on
      else{
        resolve(result);
      }
    }).catch(err =>{
      console.log(err);
      reject({error: err});
    });
  });
};




// Find tutor's wallet
var findTutorWallet = function(data) {
  return new Promise((resolve, reject) => {
    Wallet.findOne({user: data.course.tutor._id}).then(wallet => {
        if(!wallet) reject({error: 'wallet not found'});
        data.tutorWallet = wallet;
        resolve(wallet);
      }).catch(err =>{reject({error: err});});
  });
};




// Find asso
var findAsso = function(data) {
  return new Promise((resolve, reject) => {
    Asso.findById(data.course.givingToAsso).then(asso => {
        if(!asso) reject({error: 'asso not found'});
        data.asso = asso;
        resolve(asso);
      }).catch(err =>{reject({error: err});});
  });
};




// Transfer to charity from tutor's wallet
var transferFundsToCharity = function(data) {
  // Find tutor wallet
  findTutorWallet(data)
  // Find asso
  .then(function(){return findAsso(data);})
  // Transfer
  .then(result => {

    // Create transfer object
    let newAssoTransfer = new payments_api.models.Transfer({
      AuthorId: data.tutorWallet.mangoPayUser,
      DebitedFunds: {
        Amount: data.tagObject.charity * 100,
        Currency: data.tagObject.currency
      },
      Fees: {
        Amount: 0,
        Currency: data.tagObject.currency
      },
      DebitedWalletId: data.tutorWallet.mangoPayWallet,
      CreditedWalletId: data.asso.mangoPayWallet
    });

    // MangoPay tranfer API call
    payments_api.Transfers.create(newAssoTransfer).catch(err => {console.log(err);});

    // Update tutor's given to assos list
    Tutor
      .findById(data.course.tutor._id).then(tutor => {

        // Find asso in totor's list
        let asso = data.asso._id;
        let found = false;
        for (let i = 0; i < tutor.givenToAsso.length; i++){

          // If asso is found
          if (tutor.givenToAsso[i].asso.toString() ==  asso.toString()){

            // Incremet total abount of money donated and save
            tutor.givenToAsso[i].totalAmount += data.tagObject.charity/2;
            found = true;
            break;
          }
        }

        // If asso was not found, add this one to the list
        if(!found){
          let newAsso = { asso: asso, totalAmount: data.tagObject.charity/2 };
          tutor.givenToAsso.push(newAsso);
        }

        // Save in DB
        tutor.save().catch(err => { console.log(err);});
      }).catch(err => console.log(err));

      data.asso.amount = data.asso.amount + data.tagObject.charity;
      data.asso.save().catch(err => { console.log(err);});

  }).catch(err =>{ return console.log(err); });



};




// Register payment in out database
var markCourseAsPaid = function(data) {
  let course = data.course;
  course.paid = true;
  course.paymentStatus = `resolved`
  course.amount = {
    parentPaid: data.tagObject.toPay,
    tutorReceived: data.tagObject.tutor,
    discount: data.tagObject.discount
  }
  course.save().catch(err => { console.log(err); });
};




// Update dicounts
var registerDiscount = function(data) {
  // if(data.tagObject.promo){
    Promo.findOne({"code": data.tagObject.promo}).then(promo => {
      if(!promo){
      }else{
        let usedBefore = -1;
        if(promo.redeemed){
          for(let i = 0; i < promo.redeemed.length; i++){
            if(promo.redeemed[i].user.toString() == data.course.customer._id){
              usedBefore = i;
              break;
            }
          }
        } else {
          promo.redeemed = [];
        }


        if(usedBefore<0){
          let newEntry = {user: data.course.customer._id, count: 1};
          promo.redeemed.push(newEntry);
        } else {
          promo.redeemed[usedBefore].count = promo.redeemed[usedBefore].count+1;
        }

        promo.save().catch(err =>{
          console.log(err);
        });
      }
    }).catch(err =>{
      console.log(err);
    });

  // }
};




// Process course payment
// - give to charity
// - register discount
// - register payment
var processCoursePayment = function(data) {
  return new Promise((resolve, reject) => {
    // Transfers funds to charity if needed
    if(data.tagObject.charity > 0){
      transferFundsToCharity(data);
    }
    if(data.tagObject.discount > 0){
      registerDiscount(data);
    }
    markCourseAsPaid(data);
    resolve();
  });
};




// TODO: process normal top-up
// *not currently used
var processTopUp = function(resourceId, data) {
  return new Promise((resolve, reject) => {
    resolve();
  });
};




// Catching a successful payin hook
exports.catchPayinSucceeded = (req, res) => {
  // object to pass data around
  var myData = {};

  // Get payin info from mangopay
  getResource(req.query.RessourceId, myData)
  // Process payment
  .then(function(){
    // Course payment
    if(myData.isCoursePayment){
      return processCoursePayment(myData);
    }
    // Normal top-up
    else
      return processTopUp(myData);
  })
  .then(result => {

    res.send('ok');

    let tutorEmail = `Félicitations ${myData.course.tutor.fullName},\n`;
    tutorEmail += `Vous venez de recevoir ${myData.tagObject.tutor} ${myData.tagObject.currency} ${myData.course.customer.fullName ? `de la part de ${myData.course.customer.fullName}` : ``} pour avoir donné un cours particulier ${myData.course.child.fullName ? `à ${myData.course.child.fullName}` : ``}.\n\n`;
    tutorEmail += `Identifiant de la transaction : ${req.query.RessourceId}\n`;
    tutorEmail += `Date de la transaction : ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;

    const tutorEmail1 =`Félicitations ${myData.course.tutor.fullName},\n`;
    const tutorEmail2 = `Vous venez de recevoir ${myData.tagObject.tutor} ${myData.tagObject.currency} ${myData.course.customer.fullName ? `de la part de ${myData.course.customer.fullName}` : ``} pour avoir donné un cours particulier ${myData.course.child.fullName ? `à ${myData.course.child.fullName}` : ``}.\n\n`;
    const tutorEmail3 = ``;
    const tutorEmail4 = `Date de la transaction : ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;
    const tutorEmail5 = `Identifiant de la transaction : ${req.query.RessourceId}\n`;
    const tutorEmail6 = ``;

    let parentEmail = `Bonjour ${myData.course.customer.fullName}, \n`;
    parentEmail += `Vous venez d'effectuer un règlement sur Very Good Prof pour le cours particulier que ${myData.course.tutor.fullName} a donné à votre enfant ${myData.course.child.fullName}.\n\n`;
    parentEmail += `N'hésitez à laisser votre avis sur votre Very Good Prof, ${myData.course.tutor.fullName}, si vous ne l'avez pas déjà fait ! (Rendez vous dans Mon espace -> Mes Very Good Profs)\n`;
    parentEmail += `Identifiant de la transaction : ${req.query.RessourceId}\n`;
    parentEmail += `Montant de la transaction : ${myData.tagObject.toPay} ${myData.tagObject.currency}\n`;
    parentEmail += `Date de la transaction: ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;

    const parentEmail1 = `Bonjour ${myData.course.customer.fullName}, \n`;
    const parentEmail2 = `Vous venez d'effectuer un règlement sur Very Good Prof pour le cours particulier que ${myData.course.tutor.fullName} a donné à votre enfant ${myData.course.child.fullName}.\n\n`;
    const parentEmail3 = `N'hésitez à laisser votre avis sur votre Very Good Prof, ${myData.course.tutor.fullName}, si vous ne l'avez pas déjà fait ! (Rendez vous dans Mon espace -> Mes Very Good Profs)\n`;
    const parentEmail4 = `Identifiant de la transaction : ${req.query.RessourceId}\n`;
    const parentEmail5 = `Montant de la transaction : ${myData.tagObject.toPay} ${myData.tagObject.currency}\n`;
    const parentEmail6 = `Date de la transaction: ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;

    Tutor.findById(myData.course.tutor._id).then(tutor => {
      sendEmail(
        tutor.local.email,
        'Very Good Prof - Règlement du cours particulier',
        tutorEmail,
        './email_templates/payment_confirmation_email.html',
        { content1: tutorEmail1, content2: tutorEmail2, content3: tutorEmail3, content4: tutorEmail4, content5:tutorEmail5, content6:tutorEmail6 },
        function () {
          console.log('email sent', tutorEmail);
        });
    }).catch(err => { console.log(err); });

    Customer.findById(myData.course.customer._id).then(customer => {
      sendEmail(
        customer.local.email,
        'Very Good Prof -  Confirmation de paiement',
        parentEmail,
        './email_templates/payment_confirmation_email.html',
        { content1: parentEmail1, content2: parentEmail2, content3: parentEmail3, content4: parentEmail4, content5:parentEmail5, content6:parentEmail6 },
        function () {
          console.log('email sent', parentEmail);
        });
    }).catch(err => { console.log(err); });
  })
  .catch(err =>{ return res.status(400).send(err); });

}

exports.createHook = (req, res) => {
  let uId = req.user._id;

  let newHook = new payments_api.models.Hook({
    Tag: `Created by ${uId}`,
    EventType: req.body.EventType,
    Url: req.body.Url
  });

  payments_api
    .Hooks
    .create(newHook)
    .then(result => {
      return res.send(result);
    }).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
};

exports.catchPayinCreated = (req, res) => {
  // resource id = payin id
  let resourceId = req.query.RessourceId;

  //find payin
  payments_api.PayIns.get(resourceId).then(result => {
    // get json from tag
    let tagObject = JSON.parse(result.Tag);

    if (tagObject.courseId) {
      console.log(result);

      Course.findById(tagObject.courseId).then(course => {
        course.seenByTutor = false;
        course.seenByCustomer = true;
        course.paymentStatus = `pending`
        course.save().catch(err => { console.log(err); });

      }).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
    }
  }).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
}


// TODO: update this one to match successfull hook
exports.catchPayinFailed = (req, res) => {
  // object to pass data around
  var myData = {};

  // Get payin info from mangopay
  getResource(req.query.RessourceId, myData)
    .then(function(){
      let parentEmail = `Bonjour ${myData.course.customer.fullName}, \n`;
      parentEmail += `Un problème est survenu lors de votre règlement sur Very Good Prof pour le cours particulier que ${myData.course.tutor.fullName} a donné à votre enfant ${myData.course.child.fullName}.\n\n`;
      parentEmail += `Si vous persistez à rencontrer ce problème, veuillez contacter contact@verygoodprof.com\n\n`;
      parentEmail += `Identifiant de la transaction : ${req.query.RessourceId}\n`;
      parentEmail += `Montant de la transaction : ${myData.tagObject.toPay} ${myData.tagObject.currency}\n`;
      parentEmail += `Date de la transaction: ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;

      const content1 = `Bonjour ${myData.course.customer.fullName}, \n`;
      const content2 = `Un problème est survenu lors de votre règlement sur Very Good Prof pour le cours particulier que ${myData.course.tutor.fullName} a donné à votre enfant ${myData.course.child.fullName}.\n\n`;
      const content3 = `Si vous persistez à rencontrer ce problème, veuillez contacter contact@verygoodprof.com\n\n`;
      const content4 = `Identifiant de la transaction : ${req.query.RessourceId}\n`;
      const content5 = `Montant de la transaction : ${myData.tagObject.toPay} ${myData.tagObject.currency}\n`;
      const content6 = `Date de la transaction: ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;

      // Mark course as failed
      Course.findById(myData.course._id).then(course => {
        course.paymentStatus = `failed`
        course.save().catch(err => { console.log(err); });
      }).catch(err => { console.log(err); });


      Customer.findById(myData.course.customer._id).then(customer => {
        sendEmail(
          customer.local.email,
          'Very Good Prof -  Erreur lors du règlement',
          parentEmail,
          './email_templates/payment_confirmation_email.html',
          { content1, content2, content3, content4, content5, content6 },
          function () {
            console.log(`Email sent to ${customer.local.email} : Payin failed`);
          });
      }).catch(err => { console.log(err); });

      res.send('ok');
    }).catch(err =>{ return res.status(400).send(err); });
}



exports.catchPayoutCreated = (req, res) => {
  res.send('ok');
};


exports.catchPayoutSucceeded = (req, res) => {
   // resource id = payin id
   let resourceId = req.query.RessourceId;

   //find payin
   payments_api.PayOuts.get(resourceId).then(result => {
     // get json from tag
     let tagObject = JSON.parse(result.Tag);


       let emailContent = `Bonjour ${tagObject.fullName ? tagObject.fullName.split(` `)[0] : `cher Very Good Prof`} ! \n`;
       emailContent += `Un virement vient d'etre effectué avec succès vers ton compte en banque !\n\n`;
       emailContent += `Le temps que met l'argent à arriver dans ton compte varie en fonction de ta banque.\n\n`;
       emailContent += `Identifiant de la transaction : ${result.Id}\n`;
       emailContent += `Montant de la transaction : ${result.DebitedFunds.Amount / 100} ${result.DebitedFunds.Currency}\n`;
       emailContent += `Date de la transaction: ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;

       const content1 = `Bonjour ${tagObject.fullName ? tagObject.fullName.split(` `)[0] : `cher Very Good Prof`} ! \n`;
       const content2 = `Un virement vient d'etre effectué avec succès vers ton compte en banque !\n\n`;
       const content3 = `Le temps que met l'argent à arriver dans ton compte varie en fonction de ta banque.\n\n`;
       const content4 = `Identifiant de la transaction : ${result.Id}\n`;
       const content5 = `Montant de la transaction : ${result.DebitedFunds.Amount / 100} ${result.DebitedFunds.Currency}\n`;
       const content6 = `Date de la transaction: ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;

       sendEmail(

         tagObject.email,
         'Very Good Prof -  Virement effectué avec succès',
         emailContent,
         './email_templates/payment_confirmation_email.html',
         { content1, content2, content3, content4, content5, content6 },
         function () {
           console.log(`Email sent to ${tagObject.email} : Payout successful`);
         });
       res.send('ok');

  }).catch(err => { console.log(err); return res.status(400).send({ error: err }); });

}


exports.catchPayoutFailed = (req, res) => {
  // resource id = payin id
  let resourceId = req.query.RessourceId;

  //find payin
  payments_api.PayOuts.get(resourceId).then(result => {
    // get json from tag
    let tagObject = JSON.parse(result.Tag);


      let emailContent = `Bonjour ${tagObject.fullName ? tagObject.fullName.split(` `)[0] : `cher Very Good Prof`}, \n`;
      emailContent += `Une demande de virement a été faite mais n'a pu aboutir. Veuillez réessayer.\n\n`;
      emailContent += `Nous nous excusons de ce contre temps.\n`;
      emailContent += `Si vous persistez à rencontrer ce problème, veuillez contacter contact@verygoodprof.com\n\n`;
      emailContent += `Identifiant de la transaction : ${result.Id}\n`;
      emailContent += `Date de la transaction: ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;

      const content1 = `Bonjour ${tagObject.fullName ? tagObject.fullName.split(` `)[0] : `cher Very Good Prof`}, \n`;
      const content2 = `Une demande de virement a été faite mais n'a pu aboutir. Veuillez réessayer.\n\n`;
      const content3 = `Nous nous excusons de ce contre temps.\n`;
      const content4 = `Si vous persistez à rencontrer ce problème, veuillez contacter contact@verygoodprof.com\n\n`;
      const content5 = `Identifiant de la transaction : ${result.Id}\n`;
      const content6 = `Date de la transaction: ${new Date(req.query.Date * 1000).toLocaleDateString('fr-FR')}`;


      sendEmail(

        tagObject.email,
        'Very Good Prof - Erreur rencontré lors du virement',
        emailContent,
        './email_templates/payment_confirmation_email.html',
        { content1, content2, content3, content4, content5, content6 },
        function () {
          console.log(`Email sent to ${tagObject.email} : Payout failed`);
        });
      res.send('ok');

 }).catch(err => { console.log(err); return res.status(400).send({ error: err }); });
}
