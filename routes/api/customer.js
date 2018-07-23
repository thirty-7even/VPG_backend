import passport from 'passport';

import customers from './../../controllers/customer';

import {loginCheck} from './../../utils';

module.exports = function(app){
  // USER ROUTES
  app.get   ('/api/customers', customers.list);
  // app.post  ('/api/customers/', customers.create);
  app.get   ('/api/customers/:id', customers.read);
  app.patch ('/api/customers/:id', loginCheck('admin'), customers.update);
  app.delete('/api/customers/:id', loginCheck('admin'), customers.delete);
}
