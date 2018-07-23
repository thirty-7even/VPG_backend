import mongoose from 'mongoose';
import validate from 'mongoose-validator';

var ObjectId = mongoose.Schema.Types.ObjectId;

var mailboxSchema = mongoose.Schema({
  owner: {
      type: ObjectId,
      ref: 'User',
      required: true
  },
  hasUnreadMessages:  {
    type: Boolean,
    default: true
  },
  sendEmailNotification:  {
    type: Boolean,
    default: true
  },
  chats: [
    {
      child: {
          type: ObjectId,
          ref: 'User',
          required: true
      },
      lastMessage: Date,
      unreadMessages:  {
        type: Number,
        default: 0
      },
      chatWith: {
    			type: ObjectId,
    			ref: 'User',
          required: true
    	},
      messages: [
        {
          body: String,
          read: Boolean,
          date: Date,
          from: ObjectId
        }
      ]
    }
  ]
}, {strict: true});

var Mailbox = mongoose.model('Mailbox', mailboxSchema);

module.exports = {
  Mailbox
};
