const levels = require('./../../controllers/level');
const passport = require('passport');

import {loginCheck} from './../../utils';

module.exports = function(app){
  app.get    ('/api/levels',     levels.list);
  app.get    ('/api/levels/:id', levels.read);
  app.post   ('/api/levels',     loginCheck('admin'), levels.create);
  app.patch  ('/api/levels/:id', loginCheck('admin'), levels.update);
  app.delete ('/api/levels/:id', loginCheck('admin'), levels.delete);
}
