const nodemailer = require("nodemailer");
const sparkPostTransport = require("nodemailer-sparkpost-transport");
import utils from "./../utils";
const { Customer } = require("./../models/customer");
const { Child } = require("./../models/child");
var handlebars = require("handlebars");
var fs = require("fs");

exports.send = (req, res) => {
  var to = req.body.to;
  var subject = req.body.subject;
  var text = req.body.text;
  var htmlFilePath = req.body.htmlFilePath ? req.body.htmlFilePath : null;
  var replacements = req.body.replacements ? req.body.replacements : null;

  //  to, subject, text, htmlFilePath, replacements, callSuccess, callError

  utils.sendEmail(
    to,
    subject,
    text,
    htmlFilePath,
    replacements,
    (err, info) => {
      if (err) {
        console.log("Failed to send email");
        return res.status(400).send(error);
      } else {
        console.log("Email sent to " + to);
        return res.send(info);
      }
    }
  );
};

exports.sendActivationEmail = (req, res) => {
  var toAddress = req.body.to;
  var activationCode = req.body.activationCode;
  var id = req.body.id;
  utils.sendEmail(
    toAddress,
    "Bienvenue sur Very Good Prof !",
    `Merci de vous être inscrit sur Very Good Prof.\n` +
      `Pour confirmer votre adresse email, veuillez visiter cette page:\n` +
      `http://verygoodprof.fr/api/activate/${activationCode}/${toAddress}${
        id ? `/${id}` : ""
      }\n` +
      `A bientôt sur Very Good Prof !`,
    "./email_templates/welcome_email.html",
    {
      activationCode: `http://verygoodprof.fr/api/activate/${activationCode}/${toAddress}${
        id ? `/${id}` : ""
      }`
    },
    (error, info) => {
      if (error) {
        return res.status(400).send(error);
      } else {
        return res.send("Sent: " + info.response);
      }
    }
  );
};

exports.sendActivationEmailChild = (req, res) => {
  // child is already saved in DB
  // get child id
  var childId = req.body.id;
  var pw = req.body.pw;
  var parentId = "";
  var childEmail = "";
  var parentEmail = "";
  var activationCode = "";
  var childName = "";

  Child.findById(childId)
    .then(child => {
      // get parent id from child object
      childEmail = child.local.email;
      childName = child.fullName.split(" ")[0];
      activationCode = child.activationCode;
      parentId = child.parent;
      Customer.findById(parentId).then(parent => {
        parentEmail = parent.local.email;
        // send email to parent
        utils.sendEmail(
          parentEmail,
          "Very Good Prof, inscription de votre enfant",
          `Merci d'avoir inscrit votre enfant sur Very Good Prof.\n` +
            `Voici ses identifiants pour qu'il puisse se connecter à son espace personnel : \n\n` +
            `Email :` +
            childEmail +
            "\n" +
            `Mot de passe : ` +
            pw +
            "\n\n" +
            `Se connecter à son espace personnel lui permettra de suivre sa progression. Il pourra ainsi voir les récapitulatifs des cours, les points positifs et ceux à améliorer. De plus, il aura la possibilité de communiquer directement avec son professeur grâce à notre système de messagerie instantanée. Qu'il n'hésite surtout pas à contacter son Very Good Prof si il a des questions ou quoi que ce soit !\n` +
            `A bientôt sur Very Good Prof !`,
          "./email_templates/welcome_email_child_for_parents.html",
          {
            // activationCode: `http://verygoodprof.fr/api/activate/${activationCode}`,
            childEmail,
            pw,
            childName
          },
          (error, info) => {
            if (error) {
              return res.status(400).send(error);
            } else {
              return res.send("Sent: " + info.response);


            }
          }
        );
      });
    })
    .catch(err => {
      return res.status(400).send(err);
    });
};

exports.sendEmail = (
  to,
  subject,
  text,
  htmlFilePath,
  replacements,
  callback
) => {
  var transporter = nodemailer.createTransport({
    service: "Mailgun",
    auth: {
      user: "",
      pass: ""
    }
  });

  if (htmlFilePath) {
    sendHtmlEmail(
      transporter,
      to,
      subject,
      text,
      htmlFilePath,
      replacements,
      callback
    );
  } else {
    var message = {
      from: "",
      to,
      subject,
      text
    };
    transporter.sendMail(message, callback);
  }
};

var sendHtmlEmail = function(
  transporter,
  to,
  subject,
  text,
  htmlFilePath,
  replacements,
  callback
) {
  readHTMLFile(htmlFilePath, function(error, html) {
    var template = handlebars.compile(html);
    var htmlToSend = template(replacements);
    var mailOptions = {
      from: "",
      to,
      subject,
      text,
      html: htmlToSend
    };

    transporter.sendMail(mailOptions, callback);
  });
};

var readHTMLFile = function(path, callback) {
  fs.readFile(path, { encoding: "utf-8" }, function(error, html) {
    if (error) {
      throw error;
      callback(error);
    } else {
      callback(null, html);
    }
  });
};
