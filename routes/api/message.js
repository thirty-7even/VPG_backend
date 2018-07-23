const mailbox = require('./../../controllers/mailbox');
const passport = require('passport');

import {loginCheck} from './../../utils';

module.exports = function(app){
  app.post    ('/api/message',           mailbox.send);
  app.post    ('/api/mark-as-read',      mailbox.markAsRead);
  app.post    ('/api/messages',      mailbox.read);
  app.get     ('/api/messages',         mailbox.list);
  app.get     ('/api/children-mailbox',  mailbox.getChildrenMailBox);
  app.get     ('/api/child-mailbox/:id', mailbox.getChildMailBox);
}
