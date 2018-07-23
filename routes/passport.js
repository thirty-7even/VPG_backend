
const {User} = require('./../models/user');
import mail from './../controllers/mail';

import {loginCheck} from './../utils';

module.exports = function(app, passport) {

  app.post('/signup', (req,res,next) => {
    passport.authenticate('local-signup', (err,user,info) => {
      if(err) {return next(err)}
      if(!user) {return res.status(400).json({message: info.message})}
      res.json({user});

    })(req,res,next);
  });

  app.post('/signup-admin', loginCheck('super-admin'), (req,res,next) => {
    passport.authenticate('local-signup-admin', (err,user,info) => {
      if(err) {return next(err)}
      if(!user) {return res.status(400).json({message: info.message})}
      res.json({user});

    })(req,res,next);
  });

  app.post('/signup-child', loginCheck('user'), (req,res,next) => {
    passport.authenticate('local-signup-child', (err,user,info) => {
      if(err) {return next(err)}
      if(!user) {return res.status(400).json({message: info.message})}
      res.json({user});

    })(req,res,next);
  });

    app.post('/login', (req,res,next) => {
      passport.authenticate('local-login', (err,user,info) => {
        if(err) {return next(err)}
        if(!user) {return res.status(400).json({message: info.message})}
        req.logIn(user, (err) => {
          if (err) { return next(err); }
          return res.json(user);
        });
      })(req,res,next);
    });

    app.get('/logout', (req, res) => {
      req.logout();
      req.session.destroy(err => {
        res.redirect('/');
      });
    });

    app.get('/get-user', (req, res) => {
      if(req.user == undefined){
        res.json({});
      }
      else{
        res.json({
          user: req.user
        });
      }
    });
};

// route middleware to make sure a user is logged in
export function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    // res.redirect('/user');
}
