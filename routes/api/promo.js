const promos = require('./../../controllers/promo');
const passport = require('passport');

import {loginCheck} from './../../utils';

module.exports = function(app){
  app.get    ('/api/promos',     loginCheck('admin'), promos.list);
  app.get    ('/api/promos/:id', promos.read);
  app.post   ('/api/promos',     loginCheck('admin'), promos.create);
  app.patch  ('/api/promos/:id', loginCheck('admin'), promos.update);
  app.delete ('/api/promos/:id', loginCheck('admin'), promos.delete);
}
