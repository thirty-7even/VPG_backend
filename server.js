import express from "express";
import sassMiddleware from "node-sass-middleware";
import path from "path";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import passport from "passport";
import flash from "connect-flash";
import http from "http";
import sharedsession from "express-socket.io-session";
import { logDev, logAlways } from "./utils/index";
const colors = require("colors");

import mailbox from "./controllers/mailbox";

const { ObjectID } = require("mongodb");

require("./config/config");

const { mongoose } = require("./config/mongoose");

// import hbs from 'hbs';

import config from "./config/";

const app = (module.exports = express());

var Session = require('express-session');
// Use mongostore to save sessions
const MongoStore = require("connect-mongo")(Session);
const session = Session(
 {
    secret: "",
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  }
);

app.use(session);

app.get("*.js", function(req, res, next) {
  if (
    !req.url.includes("loadingbar") &&
    !req.url.includes("pdfmake.min") &&
    !req.url.includes("vfs_fonts") &&
    !req.url.includes("mangopay-kit")
  ) {
    req.url = req.url + ".gz";
    res.set("Content-Encoding", "gzip");
    res.set("Content-Type", "application/javascript");
  }
  next();
});

app.use(
  sassMiddleware({
    src: path.join(__dirname, "scss"),
    dest: path.join(__dirname, "public"),
    outputStyle: "compressed"
  })
);

// app.get('*.css', function(req, res, next) {
//   req.url = req.url + '.gz';
//   res.set('Content-Encoding', 'gzip');
//   res.set('Content-Type', 'text/css');
//   next();
// });

// app.use(session({ secret: 'threepointonefour' })); // session secret
// app.use(session);
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(cookieParser());
// app.use(bodyParser());
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb"
  })
);
app.use(bodyParser.json({ limit: "50mb" }));

require("./routes/passport")(app, passport); // load our routes and pass in our app and fully configured passport
require("./config/passport")(passport); // pass passport for configuration
require("./config/scheduled-tasks");
require("./config/payments");

// Multer for file upload
// app.use(multer({ dest: './uploads/',
//   rename: function (fieldname, filename) {
//     return filename;
//   }
// }));

app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

// JSON parser
// logger
let logFilterRegex = new RegExp("^(/api/).*");
if (process.env.NODE_ENV != "test") {
  app.use((req, res, next) => {
    var now = new Date();
    var options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    if (!logFilterRegex.test(req.url)) return next();
    var log = `${now.toLocaleTimeString("en-us", options)}: ${req.method} ${
      req.url
    }`;
    // console.log(colors.dim.italic(log));
    logAlways(colors.dim.italic(log));
    next();
  });
}

// hbs.registerPartials(__dirname + '/views/partials');

// app.use(express.static(__dirname + '/public'));
app.use("/", express.static(__dirname + "/public"));
app.use("/medias", express.static(__dirname + "/medias"));
require("./routes");
require("./routes/fileUpload")(app, mongoose);

app.get("*", (req, res) => {
  res.render("index");
});


//TODO: Move these to separate file.
var server = http.createServer(app);
// Pass a http.Server instance to the listen method
var io = require("socket.io").listen(server);
var clients = [];
io.use(sharedsession(session));
io.on("connection", socket => {
  let userId = "not logged in";
  if (
    socket.handshake.session.passport &&
    socket.handshake.session.passport.user
  ) {
    userId = socket.handshake.session.passport.user;
    clients.push({ user: userId, socket: socket.id });
    io.emit("all-clients", clients);
    logAlways(
      `${colors.bgGreen.black("user online")}: ${userId} | socket ${
        socket.id
      } | total online: ${clients.length}`
    );
  }

  socket.on("disconnect", () => {
    logAlways(colors.bgRed.black("user disconnected"));
    for (let i = 0; i < clients.length; i++) {
      if (clients[i].socket == socket.id) {
        clients.splice(i, 1);
      }
    }
  });

  socket.on("chat message", request => {

    logDev(colors.bgBlue.black(" >>> NEW MESSAGE <<< "));
    logDev(
      colors.bgYellow.black('inside server.js - socket.on("chat message")')
    );
    let toUser = request.to;
    let fromUser = userId;
    let child = request.child;
    let targetSockets = [];
    for (let i = 0; i < clients.length; i++) {
      if (
        clients[i].user == toUser ||
        (clients[i].user == fromUser && fromUser != toUser)
      ) {
        targetSockets.push(clients[i]);
      }
    }
    logDev("Message", 1);
    logDev(colors.dim(` from: ${fromUser}`), 2);
    logDev(colors.dim(`   to: ${toUser}`), 2);
    logDev(colors.dim(`child: ${child}`), 2);
    logDev(colors.dim(` body: ${request.msg}`), 2);
    logDev("Target sockets", 1);
    for (let i = 0; i < targetSockets.length; i++) {
      logDev(
        colors.dim(`${targetSockets[i].user} : ${targetSockets[i].socket}`),
        2
      );
    }

    mailbox.sendSocket(fromUser, toUser, child, request.msg, response => {
      // logDev('inside socket callback');
      // logDev(response);
      logDev(colors.bgYellow.black("inside socket callback"));
      logDev("Received:", 1);
      logDev(colors.dim(`  senderChatId: ${response.senderChatId}`), 2);
      logDev(colors.dim(`receiverChatId: ${response.receiverChatId}`), 2);
      logDev(colors.dim(`          from: ${response.from}`), 2);
      logDev(colors.dim(`          body: ${response.body}`), 2);
      if (response.error) {
        return socket.emit("chat message", {
          error: response.error
        });
      }
      logDev(colors.yellow(`Building response objects`), 1);
      let responseToSender = {
        _id: response.senderMessageId,
        chatId: response.senderChatId,
        from: response.from,
        body: response.body
      };
      let responseToReceiver = {
        _id: response.receiverMessageId,
        chatId: response.receiverChatId,
        from: response.from,
        body: response.body
      };

      logDev("responseToSender:", 2);
      logDev(colors.dim(` _id: ${responseToSender._id}`), 3);
      logDev(colors.dim(`from: ${responseToSender.from}`), 3);
      logDev(colors.dim(`body: ${responseToSender.body}`), 3);
      logDev("responseToReceiver:", 2);
      logDev(colors.dim(` _id: ${responseToReceiver._id}`), 3);
      logDev(colors.dim(`from: ${responseToReceiver.from}`), 3);
      logDev(colors.dim(`body: ${responseToReceiver.body}`), 3);
      logDev(colors.yellow(`Sending to receiving client sockets`), 1);
      for (let i = 0; i < targetSockets.length; i++) {
        let r;
        if (targetSockets[i].user == fromUser) {
          r = responseToSender;
        } else {
          r = responseToReceiver;
        }
        socket.broadcast.to(targetSockets[i].socket).emit("chat message", r);
      }

      logDev(colors.yellow(`Sending to sending client socket`), 1);

      socket.emit("chat message", responseToSender);
    });
  });
});

server.listen(config.port, config.host, () => {
  logAlways(colors.bgBlue.black(`Express listening on port ${config.port}`));
});
