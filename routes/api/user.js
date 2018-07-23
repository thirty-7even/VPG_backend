// const app = require('./../../server');
const users = require('./../../controllers/user');
const privateMessages = require('./../../controllers/private-message');
const passport = require('passport');
import {loginCheck} from '../../utils';

module.exports = function(app){
  // USER ROUTES
  app.get   ('/api/users', users.list);
  app.get   ('/api/admins', users.listAdmins);

  app.get   ('/api/users/:id', users.read);
  app.patch ('/api/users/:id', loginCheck('admin'), users.update);
  app.delete('/api/users/:id', loginCheck('admin'), users.delete);

  // activation
  app.get   ('/api/activate/:activationCode/:email/:id', users.activate);
  app.get   ('/api/activate/:activationCode/:email', users.activate);

  // password change
  app.post ('/api/change-password', users.changePassword);
  app.post ('/api/forgot-password', users.forgotPassword);
  app.get  ('/api/get-course-notifications', loginCheck('user'), users.getCourseNotifications);
}
