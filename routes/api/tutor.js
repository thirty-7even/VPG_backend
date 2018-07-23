import passport from 'passport';

import tutors from './../../controllers/tutor';
import privateMessages from './../../controllers/private-message';
import {loginCheck} from './../../utils';

module.exports = function(app){
  // USER ROUTES
  app.get   ('/api/tutors', tutors.list);
  app.get   ('/api/tutors-not-activated', loginCheck('admin') ,tutors.listNotActivated);
  app.get   ('/api/tutors/:id', tutors.read);
  app.get   ('/api/tutors/get/:email', tutors.searchByEmail);
  app.get   ('/api/get-pupils', loginCheck('user'), tutors.getPupils);
  app.patch ('/api/tutors/:id', loginCheck('admin'), tutors.update);
  app.delete('/api/tutors/:id', loginCheck('admin'), tutors.delete);
  app.post  ('/api/tutors/search', tutors.search);
  app.post   ('/api/get-profs', loginCheck('user'), tutors.getProfs);
  app.post   ('/api/rate-tutor', loginCheck('user'), tutors.rate)
}
