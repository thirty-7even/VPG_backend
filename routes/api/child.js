import passport from 'passport';

import children from './../../controllers/child';

import {loginCheck} from './../../utils';

module.exports = function(app){
  // USER ROUTES
  // app.get   ('/api/children', children.list);
  app.get   ('/api/children/:id', loginCheck('user'), children.read);
  app.patch ('/api/children/:id', loginCheck('user'), children.update);
  app.delete('/api/children/:id', loginCheck('user'), children.delete);
}
