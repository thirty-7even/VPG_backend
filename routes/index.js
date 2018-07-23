const app = require('./../server');
const users = require('./../controllers/user');
const privateMessages = require('./../controllers/private-message');
const passport = require('passport');
const mail = require ('./../controllers/mail');



import {loginCheck} from './../utils';

require ('./api/user')(app);
require ('./api/tutor')(app);
require ('./api/customer')(app);
require ('./api/child')(app);
require ('./api/subject')(app);
require ('./api/level')(app);
require ('./api/promo')(app);
require ('./api/asso')(app);;
require ('./api/message')(app);
require ('./api/course')(app);
require ('./passport')(app,passport);
require ('./authCheckRedirect')(app);
require ('./api/payments.js')(app);

app.post ('/api/send-email', mail.send);
app.post ('/api/send-activation-email-child', mail.sendActivationEmailChild);
app.post ('/api/send-activation-email', mail.sendActivationEmail);


// for testing
app.post('/api/auth-test-user',        loginCheck('user'),       (req, res) => { res.status(200).send('only visible if logged in as user'); });
app.post('/api/auth-test-admin',       loginCheck('admin'),      (req, res) => { res.status(200).send('only visible if logged in as admin'); });
app.post('/api/auth-test-super-admin', loginCheck('super-admin'),(req, res) => { res.status(200).send('only visible if logged in as super-admin'); });
