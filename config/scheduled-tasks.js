import schedule from "node-schedule";
import { logDev, logAlways, sendEmail } from "../utils/index";
const { Tutor } = require("../models/tutor");
const { User } = require("../models/user");
const { Mailbox } = require("../models/mailbox");
const colors = require("colors");

// Dayly report
var j = schedule.scheduleJob("00 00 * * *", function() {
  var yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  Tutor.find({ createdAt: { $gte: yesterday } })
    .populate("subjects")
    .then(tutors => {
      // to, subject, text, htmlFilePath, replacements, callback
      var totalRegistered = tutors.length;
      var totalActivated = 0;
      for (var i = 0; i < tutors.length; i++) {
        if (tutors[i].activated) totalActivated++;
      }
      var out = "Daily tutors activity report.\n";
      out +=
        "Since " +
        yesterday.toString() +
        ", " +
        totalRegistered +
        " new tutors registered, out of which " +
        totalActivated +
        " activated their accounts\n";
      out += "Tutors documents from database:\n";
      out += JSON.stringify(tutors, null, 2);
      if(totalRegistered !== 0){
        sendEmail(
          "",
          "Daily report - verygoodprof.com",
          out,
          null,
          null,
          function() {
            console.log("Sent daily report !");
          }
        );
      }
    })
    .catch(err => console.log(err));
});

// User notifications

var messageNotificationHalf = schedule.scheduleJob("30 * * * *", () =>
  messageNotification()
);
var messageNotificationOClock = schedule.scheduleJob("00 * * * *", () =>
  messageNotification()
);

var messageNotification = function() {
  // Get a list of all users that need to receive notification
  // User who have chats in their mailboxes with unreadMessages > 0
  // Something like "You have 13 unread messages in 3 chats"

  logAlways(colors.bgYellow.black("Message notifications job"));

  // Find all mailboxes that have any unread messages
  var findUnreadMailboxes = new Promise((resolve, reject) => {
    Mailbox.find({ hasUnreadMessages: true, sendEmailNotification: true })
      .then(unreadMailboxes => {
        let pendingNotifications = [];
        logAlways(
          "Total mailboxes with unread messages: " + unreadMailboxes.length,
          1
        );
        for (let i = 0; i < unreadMailboxes.length; i++) {
          let unreadChats = [];
          let totalUnreadMessages = 0;
          for (let j = 0; j < unreadMailboxes[i].chats.length; j++) {
            if (unreadMailboxes[i].chats[j].unreadMessages > 0) {
              // unreadChats.push(unreadMailboxes[i].chats[j]);
              unreadChats.push({
                chatId: unreadMailboxes[i].chats[j]._id,
                unreadMessages: unreadMailboxes[i].chats[j].unreadMessages,
                chatWith: {
                  id: unreadMailboxes[i].chats[j].chatWith
                },
                child: {
                  id: unreadMailboxes[i].chats[j].child
                },
                messages: unreadMailboxes[i].chats[j].messages
              });
              totalUnreadMessages += unreadMailboxes[i].chats[j].unreadMessages;
            }
          }
          pendingNotifications.push({
            owner: unreadMailboxes[i].owner,
            chatId: unreadMailboxes[i]._id,
            unreadChats,
            totalUnreadMessages
          });
        }

        resolve(pendingNotifications);
      })
      .catch(err => {
        reject();
      });
  });

  // Get owner name and last messages in each unread chat
  // Wait until all async. tasks are finished
  const getOwnerNameAndLastMessage = pendingNotifications => {
    var promises = pendingNotifications.map(mailbox => {
      return new Promise((resolve, reject) => {
        let userId = mailbox.owner;
        User.findById(userId)
          .then(user => {
            if (!user) return reject();
            mailbox.ownerName = user.fullName;
            mailbox.email = user.local.email;
            for (let c = 0; c < mailbox.unreadChats.length; c++) {
              let chat = mailbox.unreadChats[c];
              let lastMessage;
              let timeStamp;
              for (let m = chat.messages.length - 1; m >= 0; m--) {
                if (chat.messages[m].from.toString() != user._id.toString()) {
                  // lastMessage = chat.messages[m];
                  var options = {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  };
                  lastMessage = {
                    body: chat.messages[m].body,
                    timeStamp:
                      parseInt(
                        chat.messages[m]._id.toString().substring(0, 8),
                        16
                      ) * 1000,
                    time: new Date(
                      parseInt(
                        chat.messages[m]._id.toString().substring(0, 8),
                        16
                      ) * 1000
                    ).toLocaleTimeString("en-us", options)
                  };
                  break;
                }
              }
              mailbox.unreadChats[c].messages = undefined;
              mailbox.unreadChats[c].lastMessage = lastMessage;
            }

            resolve(mailbox);
          })
          .catch(err => {
            reject();
          });
      });
    });
    return Promise.all(promises);
  };

  const sendNotificationEmails = pendingNotifications => {
    var promises = pendingNotifications.map(mailbox => {
      return new Promise((resolve, reject) => {
        var email = {
          userId: mailbox.owner,
          to: mailbox.email,
          user: mailbox.ownerName,
          totalUnreadMessages: mailbox.totalUnreadMessages,
          totalUnreadChats: mailbox.unreadChats.length,
          unreadChats: []
        };

        const chatWith = [];

        for (let i = 0; i < mailbox.unreadChats.length; i++) {
          let chatWithId = mailbox.unreadChats[i].chatWith.id;

          User.findById(chatWithId)
            .then(chatWithUser => {
              chatWith.push({ [chatWithId]: chatWithUser.fullName });
            })
            .catch(err => {
              return reject(err);
            });
        }

        for (let i = 0; i < mailbox.unreadChats.length; i++) {
          let chatWithId = mailbox.unreadChats[i].chatWith.id;

          email.unreadChats.push({
            chatWith: chatWith.chatWithId,
            totalNewMessages: mailbox.unreadChats[i].unreadMessages,
            lastMessageTime: mailbox.unreadChats[i].lastMessage.time,
            lastMessageBody: mailbox.unreadChats[i].lastMessage.body
          });
        }
        resolve(email);
      });
    });
    return Promise.all(promises);
  };

  findUnreadMailboxes
    .then(getOwnerNameAndLastMessage)
    .then(sendNotificationEmails)
    .then(emails => {
      for (var email of emails) {
        let emailBody = "";
        let chatsBody = "";
        emailBody += `Bonjour , ${email.user}\n`;
        emailBody += `Vous avez ${
          email.totalUnreadMessages
        } nouveau(x) messages(s) dans ${
          email.totalUnreadChats
        } conversation(s).\n\n`;

        for (var unreadChat of email.unreadChats) {
          emailBody += `${
            unreadChat.chatWith !== undefined
              ? `Conversation avec ${unreadChat.chatWith} - `
              : ""
          }${unreadChat.totalNewMessages} nouveau(x) message(s)\n`;
          emailBody += `Dernier message reçu - ${
            unreadChat.lastMessageTime
          } :\n " ${unreadChat.lastMessageBody} "\n\n`;
          chatsBody += `${
            unreadChat.chatWith !== undefined
              ? `Conversation avec <b>${unreadChat.chatWith}</b> - `
              : ""
          }${unreadChat.totalNewMessages} nouveau(x) message(s)<br/>`;
          chatsBody += `Dernier message reçu - ${
            unreadChat.lastMessageTime
          } :<br/><br/> <b>" ${unreadChat.lastMessageBody} "</b><br/><br/>`;
        }

        email.chatsBody = chatsBody;
        sendEmail(
          email.to,
          "Very Good Prof - Nouveaux messages",
          emailBody,
          "./email_templates/messages_notifications_email.html",
          email,
          function(error, result) {
            if (result) {
              Mailbox.findOneAndUpdate(
                { owner: email.userId },
                { sendEmailNotification: false }
              )
                .then(result => {
                  logAlways("Email sent to " + email.to, 2);
                })
                .catch(err => {
                  logAlways("Could not update mailbox but sent email" + err, 2);
                });
            } else {
              logAlways("Cound'nt send email to " + email.to, 2);
            }
          }
        );
      }
    })
    .catch(err => {
      console.log(err);
    });
};
