const { Mailbox } = require("./../models/mailbox");
const { ObjectID } = require("mongodb");
import mongoose from "mongoose";
import { logDev, logAlways } from "../utils/index";
var colors = require("colors");

// Mark messages as read
exports.markAsRead = (req, res) => {
  let id = req.user._id;
  let chatId = req.body.chatId;
  let foundChat = false;
  Mailbox.findOne({ owner: id })
    .then(mailbox => {
      let hasMoreUnreadMessages = false;
      for (let i = 0; i < mailbox.chats.length; i++) {
        if (mailbox.chats[i]._id == chatId) {
          mailbox.chats[i].unreadMessages = 0;
          foundChat = true;
        } else {
          if (mailbox.chats[i].unreadMessages > 0) {
            hasMoreUnreadMessages = true;
          }
        }
      }
      if (foundChat) {
        mailbox.hasUnreadMessages = hasMoreUnreadMessages;
        return mailbox.save();
      } else return res.status(404).send({ error: "chat not found" });
    })
    .then(result => {
      return res.send({ mailbox: result });
    })
    .catch(err => {
      return res.status(400).send({ err });
    });
};

// Send a message
exports.sendSocket = (sender, receiver, child, body, callback) => {
  let senderChatId;
  let receiverChatId;
  let senderMessageId;
  let receiverMessageId;
  logDev(colors.bgYellow.black("inside mailbox.sendSocket()"));
  if (!ObjectID.isValid(sender) || !ObjectID.isValid(receiver)) {
    return callback({ error: "sender or receiver id is not valid" });
  }
  let message = {
    body,
    from: sender
  };
  let targetMailbox;
  let chatID;
  logDev("Received from socket", 1);
  logDev(colors.dim(` from: ${sender}`), 2);
  logDev(colors.dim(`   to: ${receiver}`), 2);
  logDev(colors.dim(`child: ${child}`), 2);
  logDev(colors.dim(` body: ${body}`), 2);

  logDev(colors.yellow(`Searching receiver\'s mailbox`), 1);
  // ######################################
  // # SAVE MESSAVE IN RECEIVER'S MAILBOX #
  // ######################################
  var id = mongoose.Types.ObjectId(receiver);
  Mailbox.findOne({ owner: id })
    .then(existingMailBox => {
      // If he doesn't have one, create new
      if (!existingMailBox) {
        logDev(colors.red(`not found, creating a new one`), 2);
        return new Mailbox({
          owner: id
        }).save();
      } else {
        // Or return exising one
        logDev(colors.green(`found, using existing one`), 2);
        return existingMailBox;
      }
    })
    .then(result => {
      logDev(
        colors.yellow(
          `Searching for chat in receiver\'s mailbox: ${result._id}`
        ),
        1
      );
      // Find chat
      for (let i = 0; i < result.chats.length; i++) {
        let c = result.chats[i];
        if (c.chatWith.toString() == sender && c.child.toString() == child) {
          logDev(colors.green(`found, pushing message`), 2);
          chatID = i;
          break;
        }
      }
      // If chat is found, add message and save
      if (chatID != undefined) {
        result.chats[chatID].messages.push(message);
        result.sendEmailNotification = true;
        result.hasUnreadMessages = true;
        result.chats[chatID].unreadMessages =
          result.chats[chatID].unreadMessages + 1;
        return result.save();
      } else {
        // If not found, create new chat and add a message
        logDev(colors.red(`not found, pushing new chat and a message`), 2);

        return Mailbox.findOneAndUpdate(
          { _id: result._id },
          {
            hasUnreadMessages: true,
            sendEmailNotification:true,
            $push: {
              chats: {
                child: child,
                unreadMessages: 1,
                messages: [message],
                chatWith: sender
              }
            }
          },
          { new: true }
        );
      }
    })
    .then(result => {
      logDev(colors.dim(`done`), 3);
      // Get receiver chat id

      logDev(colors.yellow(`Finding receiver chat id and message id`), 1);
      let receiverMailBox = result;
      for (let i = 0; i < receiverMailBox.chats.length; i++) {
        let c = receiverMailBox.chats[i];
        if (c.chatWith.toString() == sender && c.child.toString() == child) {
          receiverChatId = c._id;
          logDev(colors.dim(`   chat id: ${receiverChatId}`), 2);
          receiverMessageId = c.messages[c.messages.length - 1]._id;
          logDev(colors.dim(`message id: ${receiverMessageId}`), 2);
          break;
        }
      }

      logDev(colors.yellow(`Searching sender\'s mailbox`), 1);
      chatID = undefined;
      var id = mongoose.Types.ObjectId(sender);
      return Mailbox.findOne({ owner: id }).then(existingMailBox => {
        // If he doesn't have one, create new
        if (!existingMailBox) {
          logDev(colors.italic.red(`not found, creating a new one`), 2);
          return new Mailbox({
            owner: id,
            sendEmailNotification: false,
            hasUnreadMessages: false
          }).save();
        } else {
          // Or return exising one
          logDev(colors.italic.green(`found, using existing one`), 2);
          // existingMailBox.sendEmailNotification = false;
          // existingMailBox.hasUnreadMessages = false;
          return existingMailBox.save();
        }
      });
    })
    .then(result => {
      logDev(
        colors.yellow(
          `Searching for chat in receiver\'s mailbox: ${result._id}`
        ),
        1
      );
      // Find chat
      for (let i = 0; i < result.chats.length; i++) {
        let c = result.chats[i];
        if (c.chatWith.toString() == receiver && c.child.toString() == child) {
          logDev(colors.green(`found, pushing message`), 2);
          chatID = i;
          break;
        }
      }
      // If chat is found, add message and save
      if (chatID != undefined) {
        result.chats[chatID].messages.push(message);
        return result.save();
      } else {
        // If not found, create new chat and add a message
        logDev(colors.red(`not found, pushing new chat and a message`), 2);
        return Mailbox.findOneAndUpdate(
          { _id: result._id },
          {
            $push: {
              chats: {
                child: child,
                messages: [message],
                chatWith: receiver
              }
            }
          },
          { new: true }
        );
      }
    })
    .then(result => {
      logDev(colors.dim(`done!`), 3);
      // Get receiver chat id
      logDev(colors.yellow(`Finding sender chat id and message id`), 1);
      let senderMailBox = result;
      for (let i = 0; i < senderMailBox.chats.length; i++) {
        let c = senderMailBox.chats[i];
        if (c.chatWith.toString() == receiver && c.child.toString() == child) {
          senderChatId = c._id;
          logDev(colors.dim(`   chat id: ${senderChatId}`), 2);
          senderMessageId = c.messages[c.messages.length - 1]._id;
          logDev(colors.dim(`message id: ${receiverMessageId}`), 2);
          break;
        }
      }
      // res.send(result);
      // return callback({_id: new ObjectID, from: sender, body})
      logDev("Return", 1);
      logDev(colors.dim(`     sender chat id: ${senderChatId}`), 2);
      logDev(colors.dim(`   receiver chat id: ${receiverChatId}`), 2);
      logDev(colors.dim(`  sender message id: ${senderMessageId}`), 2);
      logDev(colors.dim(`receiver message id: ${receiverMessageId}`), 2);
      logDev(colors.dim(`               from: ${sender}`), 2);
      logDev(colors.dim(`               body: ${body}`), 2);
      return callback({
        senderChatId,
        receiverChatId,
        senderMessageId,
        receiverMessageId,
        from: sender,
        body
      });
    })
    .catch(err => {
      logDev(err);
      return callback({ error: "failed to send message" });
      // res.status(400).send(err);
    });
};

exports.send = (req, res) => {
  // log2('INSIDE MAILBOX.SEND() - SENDING MESSAGE')
  let sender = req.user._id;
  let receiver = req.body.to;
  let child = req.body.child;

  console.log(req)

  if (!ObjectID.isValid(sender) || !ObjectID.isValid(receiver)) {
    return res.status(404).send();
  }
  let message = {
    body: req.body.body,
    from: sender
  };

  console.log(message)

  let targetMailbox;
  let chatID;

  // log2('-----------------------------------');
  // log2('Searching receiver mailbox');
  // ######################################
  // # SAVE MESSAVE IN RECEIVER'S MAILBOX #
  // ######################################
  Mailbox.findOne({ owner: receiver })
    .then(existingMailBox => {
      // If he doesn't have one, create new
      if (!existingMailBox) {
        // log2(' - not found, creatigin a new one');
        return new Mailbox({ owner: receiver }).save();
      } else {
        // Or return exising one
        // log2(' - found, using existing one');
        return existingMailBox;
      }
    })
    .then(result => {
      // Find chat
      // log2('-----------------------------------');
      // log2('Searching for chat in receiver mailbox');
      for (let i = 0; i < result.chats.length; i++) {
        let c = result.chats[i];
        // log2(` - compare ${c.chatWith} with ${sender}`)
        if (c.chatWith.toString() == sender && c.child.toString() == child) {
          // log2(' - match');
          chatID = i;
          break;
        }
      }
      // If chat is found, add message and save
      if (chatID != undefined) {
        // log2('Chat found, pushing message');
        result.chats[chatID].messages.push(message);
        return result.save();
      } else {
        // If not found, create new chat and add a message
        // log2('Chat not found, pushing new chat and a message');
        return Mailbox.update(
          { _id: result._id },
          {
            $push: {
              chats: {
                child: child,
                messages: [message],
                chatWith: sender
              }
            }
          }
        );
      }
    })
    .then(result => {
      chatID = undefined;
      return Mailbox.findOne({ owner: sender }).then(existingMailBox => {
        // If he doesn't have one, create new
        if (!existingMailBox) {
          return new Mailbox({ owner: sender }).save();
        } else {
          // Or return exising one
          return existingMailBox;
        }
      });
    })
    .then(result => {
      // Find chat
      chatID = undefined;
      for (let i = 0; i < result.chats.length; i++) {
        let c = result.chats[i];
        if (c.chatWith.toString() == receiver && c.child.toString() == child) {
          chatID = i;
          break;
        }
      }
      // If chat is found, add message and save
      if (chatID != undefined) {
        result.chats[chatID].messages.push(message);
        return result.save();
      } else {
        // If not found, create new chat and add a message
        return Mailbox.update(
          { _id: result._id },
          {
            $push: {
              chats: {
                child: child,
                messages: [message],
                chatWith: receiver
              }
            }
          }
        );
      }
    })
    .then(result => {
      console.log(result)
      res.send(result);
    })
    .catch(err => {
      console.log(err);
      res.status(400).send(err);
    });
};

// Get a list of all chats
exports.list = (req, res) => {
  // console.log('listing messages');
  let id = req.user._id;
  // let id = req.params.id; // for testing
  // console.log(id);
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  Mailbox.findOne({ owner: id })
    .populate("chats.chatWith", "fullName _id")
    .populate("chats.child", "fullName _id")
    // .populate({
    //   path: 'chats.chatWith'
    // })
    .then(result => {
      let chats = [];
      if (!result) return res.send({ chats });
      if (result.chats != undefined) {
        for (let i = 0; i < result.chats.length; i++) {
          // console.log(result.chats[i].messages.length);
          var chatId = result.chats[i]._id;
          var lastMessage =
            result.chats[i].messages[result.chats[i].messages.length - 1].body;
          var date = ObjectID(
            result.chats[i].messages[result.chats[i].messages.length - 1]._id
          ).getTimestamp();
          var chatWith = {
            _id: result.chats[i].chatWith._id,
            name: result.chats[i].chatWith.fullName
          };
          // console.log(result.chats[i]);
          var child = {
            _id: result.chats[i].child._id,
            name: result.chats[i].child.fullName
          };
          //  console.log(chatWith);
          chats.push({
            lastMessage,
            date,
            chatWith,
            child,
            chatId
          });
        }
      }
      res.send({ chats: chats.reverse() });
    })
    .catch(err => {
      console.log(err);
      res.status(400).send(err);
    });
};

// Find messages from chat with one specific user
exports.read = (req, res) => {
  // console.log('Reading messages');
  let id = req.body.chatId;
  let isChild = false;
  let owner;
  if (typeof req.body.childId != "undefined") {
    owner = req.body.childId;
    isChild = true;
  } else {
    owner = req.user._id;
  }
  let chat;
  // console.log(owner);
  // console.log(id);
  // console.log(owner, id);
  if (!ObjectID.isValid(id) || !ObjectID.isValid(owner)) {
    return res.status(404).send({ error: "Invalid object id" });
  }

  if (isChild) {
    let children = req.user.children.map(chld => chld._id.toString());
    if (children.indexOf(owner) < 0) {
      // console.log('not your child');
      return res.status(403).send({ error: "Not authorised, not your child" });
    }
  }
  Mailbox.findOne({ owner: owner })
    .populate("chats.chatWith", "fullName _id")
    .populate("chats.child", "fullName _id")
    .then(result => {
      let index = -1;
      if (!result) return res.status(404).send();
      let chats = result.chats;

      let hasMoreUnreadMessages = false;
      let foundChat = false;

      for (let i = 0; i < chats.length; i++) {
        if (chats[i]._id == id) {
          chat = chats[i];
          index = i;
          result.chats[i].unreadMessages = 0;
          foundChat = true;
        } else {
          if (result.chats[i].unreadMessages > 0) {
            hasMoreUnreadMessages = true;
          }
        }
      }

      if (!chat) {
        return res.status(404).send();
      } else {
        result.sendEmailNotification = hasMoreUnreadMessages;
        result.hasUnreadMessages = hasMoreUnreadMessages;
      }

      return result
        .save()
        .then(result => {
          res.send({ chat });
        })
        .catch(err => {
          res.status(400).send({ err });
        });
    })
    .catch(err => {
      res.status(400).send({ err });
    });
};

exports.getChildrenMailBox = (req, res) => {
  let id = req.user._id;
  // console.log("user", id);
  if (req.user.__t == "Tutor") {
    Mailbox.findOne({ owner: id })
      .populate("chats.chatWith", "fullName _id")
      .populate("chats.child", "fullName _id")
      .populate("owner", "fullName _id")
      .then(result => {
        if (!result) return res.status(404).send();
        let chats = result.chats;
        let chatsOut = [];
        for (let i = 0; i < chats.length; i++) {
          let chat = chats[i];
          if (chat.chatWith.__t == "Child") {
            var lastMessage = chat.messages[chat.messages.length - 1].body;
            var date = ObjectID(
              chat.messages[chat.messages.length - 1]._id
            ).getTimestamp();
            var child = {
              _id: result.chats[i].child._id,
              name: result.chats[i].child.fullName
            };
            var chatWith = {
              _id: chat.chatWith._id,
              name: chat.chatWith.fullName
            };
            chatsOut.push({
              lastMessage,
              date,
              chatWith,
              child
            });
          }
        }
        return res.send({ chats: chatsOut });
      })
      .catch(err => {
        console.log(err);
        res.status(400).send(err);
      });
  } else if (req.user.__t == "Customer") {
    let childrenIDs = req.user.children.map(child => child._id);
    Mailbox.find({ owner: { $in: childrenIDs } })
      .populate("chats.chatWith", "fullName _id")
      .populate("chats.child", "fullName _id")
      .populate("owner", "fullName _id")
      .then(result => {
        if (!result) return res.status(404).send();
        let mailboxes = result;
        let mailboxesOut = [];
        for (let m = 0; m < mailboxes.length; m++) {
          let chats = mailboxes[m].chats;
          let chatsOut = [];
          for (let c = 0; c < chats.length; c++) {
            let chat = chats[c];
            // #######################################################
            var lastMessage = chat.messages[chat.messages.length - 1].body;
            var date = ObjectID(
              chat.messages[chat.messages.length - 1]._id
            ).getTimestamp();
            var child = {
              _id: result.chats[c].child._id,
              name: result.chats[c].child.fullName
            };
            var chatWith = {
              _id: chat.chatWith._id,
              name: chat.chatWith.fullName
            };
            chatsOut.push({
              lastMessage,
              date,
              chatWith,
              child
            });
          }
          // #######################################################
          mailboxesOut.push({
            _id: mailboxes[m]._id,
            owner: mailboxes[m].owner,
            chats: chatsOut
          });
        }
        return res.send({ mailboxes: mailboxesOut });
      })
      .catch(err => {
        console.log(err);
        res.status(400).send(err);
      });
  }
};

// Get all mailboxes of a specific child
exports.getChildMailBox = (req, res) => {
  // console.log("Getting child's mailbox");
  let id = req.user._id;
  let childId = req.params.id;
  if (req.user.__t == "Customer") {
    let childrenIDs = req.user.children.map(child => child._id.toString());
    // console.log('Parent id', id);
    // console.log('Child id', childId);
    // console.log('Parent\'s children', childrenIDs);
    // console.log(childrenIDs[0].toString() == childId);
    // console.log('typeof childrenIDs[0])', typeof childrenIDs[0]);
    // console.log('typeof childId', typeof childId);
    // console.log(childrenIDs.indexOf(childId) > -1);
    if (childrenIDs.indexOf(childId) < 0) {
      // console.log("not your child");
      return res.status(403).send("not your child");
    }
    Mailbox.findOne({ owner: childId })
      .populate("chats.chatWith", "fullName _id")
      .populate("chats.child", "fullName _id")
      .populate("owner", "fullName _id")
      .then(result => {
        if (!result) return res.status(404).send();
        let mailbox = result;
        let mailboxOut;
        let chats = mailbox.chats;
        let chatsOut = [];
        for (let c = 0; c < chats.length; c++) {
          let chat = chats[c];
          // #######################################################
          var chatId = chat._id;
          var lastMessage = chat.messages[chat.messages.length - 1].body;
          var date = ObjectID(
            chat.messages[chat.messages.length - 1]._id
          ).getTimestamp();
          var child = {
            _id: result.chats[c].child._id,
            name: result.chats[c].child.fullName
          };
          var chatWith = {
            _id: chat.chatWith._id,
            name: chat.chatWith.fullName
          };
          chatsOut.push({
            lastMessage,
            date,
            chatWith,
            child,
            chatId
          });
        }
        // #######################################################
        return res.send({ chats: chatsOut });
      })
      .catch(err => {
        console.log(err);
        return res.status(400).send(err);
      });
  } else {
    return res.status(401).send();
  }
};

// Get all mailboxes of all children
exports.getChildrenMailBox = (req, res) => {
  // console.log("Getting child's mailbox");
  let id = req.user._id;
  if (req.user.__t == "Customer") {
    let childrenIDs = req.user.children.map(child => child._id);
    // console.log("Parent id", id);
    // console.log("Parent's children", childrenIDs);
    // console.log(childrenIDs[0].toString() == childId);
    // console.log('typeof childrenIDs[0])', typeof childrenIDs[0]);
    // console.log('typeof childId', typeof childId);
    // console.log(childrenIDs.indexOf(childId) > -1);
    // if (childrenIDs.indexOf(childId) < 0) {
    //   console.log('not your child');
    //   return res.status(403).send();
    // }
    Mailbox.find({ owner: { $in: childrenIDs } })
      .populate("chats.chatWith", "fullName _id")
      .populate("chats.child", "fullName _id")
      .populate("owner", "fullName _id")
      .then(mailboxes => {
        if (!mailboxes) return res.status(404).send();
        let mailboxesOut;
        mailboxesOut = mailboxes.map(mailbox => {
          let mailboxOut = {};
          mailboxOut.chats = [];

          let chats = mailbox.chats;
          let chatsOut = [];

          // console.log(mailbox);
          // console.log(chats);
          for (let c = 0; c < chats.length; c++) {
            let chat = chats[c];
            // console.log(chat);
            //   // #######################################################
            var lastMessage = chat.messages[chat.messages.length - 1].body;
            var date = ObjectID(
              chat.messages[chat.messages.length - 1]._id
            ).getTimestamp();
            var child = {
              _id: mailbox.chats[c].child._id,
              name: mailbox.chats[c].child.fullName
            };
            var chatWith = {
              _id: chat.chatWith._id,
              name: chat.chatWith.fullName
            };
            chatsOut.push({
              lastMessage,
              date,
              chatWith,
              child
            });
          }
          mailboxOut.chats = chatsOut;
          // console.log(mailboxOut);
          return mailboxOut;
        });
        // #######################################################
        return res.send({ mailboxes: mailboxesOut });
      })
      .catch(err => {
        console.log(err);
        return res.status(400).send(err);
      });
  } else {
    return res.status(401).send();
  }
};
