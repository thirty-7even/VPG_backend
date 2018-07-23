const subjects = require('./../../controllers/subject');
const passport = require('passport');

import {loginCheck} from './../../utils';

module.exports = function(app){
  app.get   ('/api/subjects',     subjects.list);
  app.get   ('/api/subjects/:id', subjects.read);
  app.post  ('/api/subjects',     loginCheck('admin'), subjects.create);
  app.patch ('/api/subjects/:id', loginCheck('admin'), subjects.update);
  app.delete('/api/subjects/:id', loginCheck('admin'), subjects.delete);
}
