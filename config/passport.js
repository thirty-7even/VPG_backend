// config/passport.js

import axios from 'axios';

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
import {Customer} from'../models/customer';
import {Tutor}    from'../models/tutor';
import {User}     from'../models/user';
import {Child}     from'../models/child';
import {Admin}     from'../models/admin';
import {Subject}  from'../models/subject';
import {Level}    from'../models/level';

let debug = 0;
let log2 = message => {
  if(debug>=2) console.log(message);
}

// expose this function to our app using module.exports
module.exports = function(passport) {

    // passport session setup ==================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    // LOCAL SIGNUP ###################################################################
    passport.use('local-signup-admin',
      new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
      },
      function(req, email, password, done) {
        process.nextTick(function() {
          // check if user with this email already exists
          User.findOne({'local.email': email},
            (err, user) => {
              // error searching database
              if (err)  return done(null, false, {message : err});
              // user does exist
              if (user) return done(null, false, { message : 'Un autre compte utilise déjà cet email' });
              // email available, go on with signup
              else {

                // console.log(req.body);
                // if location is provided, we're dealing with a tutor
                if(req.body.role && req.body.role == 'admin'){
                  var newUser = new Admin({
                    fullName: req.body.fullName,
                    profilePicture: req.body.profilePicture,
                    backgroundPicture: req.body.backgroundPicture,
                    role: 'admin'
                  });
                }else if(req.body.role && req.body.role == 'super-admin'){
                  var newUser = new Admin({
                    fullName: req.body.fullName,
                    profilePicture: req.body.profilePicture,
                    backgroundPicture: req.body.backgroundPicture,
                    role: 'super-admin'
                  });
                }
                // for any user, record email and hashed password
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);
                // generate activation code
                // will be used to verify email address
                newUser.activationCode = newUser.generateActvationCode();
                // save user to database
                newUser
                  .save((err) => {
                    // something went wrong
                    if (err) return done(null, false, {message : err});
                    // all good
                    return done(null, newUser);})
                }
          });
        });
      }));

    // LOCAL SIGNUP ###################################################################
    passport.use('local-signup-child',
      new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
      },
      function(req, email, password, done) {
        process.nextTick(function() {
          log2('-----------------------------------------');
          log2(`REGISTERING A CHILD`);
          log2(`Check is user logged in is a parent`);
          if(req.user.__t != 'Customer'){
            log2(` - refused, ${req.user.fullName} is not a parent`);
            return done(null, false, { message : 'Seulement un parent peut inscrire un élève' });
          }
          log2(` - ok, ${req.user.fullName} is a parent`);

          // check if user with this email already exists
          User.findOne({'local.email': email},
            (err, user) => {
              // error searching database
              if (err)  return done(null, false, {message : err});
              // user does exist
              if (user) return done(null, false, { message : 'Un autre compte utilise déjà cet email' });
              // email available, go on with signup
              else {
                var newUser = new Child({
                  fullName: req.body.fullName,
                  parent: {
                    fullName: req.user.fullName,
                    _id: req.user._id
                  },
                  profilePicture: req.body.profilePicture,
                  backgroundPicture: req.body.backgroundPicture,
                  role: 'user'
                });
                // for any user, record email and hashed password
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);
                // generate activation code
                // will be used to verify email address
                newUser.activationCode = newUser.generateActvationCode();
                newUser.activated = true;
                // save user to database
                newUser
                  .save(err => {
                    if(err) {return done(null, false, {message : err});}
                  })
                  .then(
                    doc => {
                      // console.log(doc);
                      let child = {
                        fullName: doc.fullName,
                        _id: doc._id
                      }
                      Customer
                        .update(
                          { _id: req.user._id },
                          { $push: {
                            children: child
                            }
                          }
                        )
                        .then(res=>{
                          return done(null, doc);
                        });
                    }
                  ).
                  catch(err => {
                    res.status(400).send({ error: err })
                  });
                }
          });
        });
      }));

    // LOCAL SIGNUP ###################################################################
    passport.use('local-signup',
      new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
      },
      function(req, email, password, done) {
        // console.log(password);
        process.nextTick(function() {
          // check if user with this email already exists
          User.findOne({'local.email': email},
            (err, user) => {
              // error searching database
              if (err)  return done(null, false, {message : err});
              // user does exist
              if (user) return done(null, false, { message : 'Un autre compte utilise déjà cet email' });
              // email available, go on with signup
              else {
                // if location is provided, we're dealing with a tutor
                if(req.body.location){
                  // create tutor object
                  var newUser = new Tutor({
                    fullName: req.body.fullName,
                    dob: req.body.dob,
                    telephoneNumber: req.body.telephoneNumber,
                    location: req.body.location,
                    loc:{
                      type: 'Point',
                      coordinates: [req.body.location.lng, req.body.location.lat]
                    },
                    levels: req.body.levels,
                    subjects: req.body.subjects,
                    range: req.body.range,
                    bio: req.body.bio,
                    experiences: req.body.experiences,
                    cv: req.body.cv,
                    majorDescription: req.body.majorDescription,
                    profilePicture: req.body.profilePicture,
                    backgroundPicture: req.body.backgroundPicture,
                    siretNumber: req.body.siretNumber,
                    role: 'user'
                  });
                // no location => it's a customer
                }else{
                  var newUser = new Customer({
                    telephoneNumber: req.body.telephoneNumber,                    
                    fullName: req.body.fullName,
                    profilePicture: req.body.profilePicture,
                    backgroundPicture: req.body.backgroundPicture,
                    role:'user'
                  });

                  if(req.body.parrainEmail)
                    newUser.parrain = req.body.parrainEmail;
                }
                // for any user, record email and hashed password
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);
                // generate activation code
                // will be used to verify email address
                newUser.activationCode = newUser.generateActvationCode();
                // save user to database
                newUser
                  .save((err) => {
                    // something went wrong
                    if (err) return done(null, false, {message : err});
                    // all good
                    return done(null, newUser);})
                }
          });
        });
      }));

    // LOCAL LOGIN =============================================================
    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
        User.findOne({ 'local.email' :  email },
          (err, user) => {
            // error searching database
            if (err)
              return done(null, false, {message : err});
            // user not found
            if (!user)
              return done(null, false, {message : 'L\' email renseigné ne correspond à aucun compte'});
            // wrong password
            if (!user.validPassword(password)){
              return done(null, false, {message : 'Mauvais mot de passe'});
            }
            if (!user.activated){
              return done(null, false, {message: 'Vous n\'avez pas activé votre compte'});
            }

            // user exists, password is correct - return user
            return done(null, user);
        });

    }));
};
