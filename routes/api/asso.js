import asso from './../../controllers/asso';
import {loginCheck} from './../../utils';

module.exports = function(app){
  app.get    ('/api/asso',     asso.list);
  app.get    ('/api/asso/:id', asso.read);
  app.post   ('/api/asso',     loginCheck('admin'), asso.create);
  app.patch  ('/api/asso/:id', loginCheck('admin'), asso.update);
  app.delete ('/api/asso/:id', loginCheck('admin'), asso.delete);
}
