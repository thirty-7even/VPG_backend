const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: './uploads/' })
var Grid = require("gridfs-stream");

import { loginCheck } from './../utils';

module.exports = function (app, mongoose) {
  var conn = mongoose.connection;
  var gfs;
  Grid.mongo = mongoose.mongo;
  gfs = Grid(conn.db);

  app.get("/file-upload.html", function (req, res) {
    res.render("file-upload.html");
  });


  // Upload profile picture
  app.post('/api/upload-profile-picture', loginCheck('admin'), upload.single('avatar'), (req, res, next) => {

    let uId = req.body.owner;
    let name = "profile-picture" + "-" + uId + "-" + req.file.originalname;
    gfs.files.findOne(
      {
        "metadata.owner": uId,
        "metadata.type": 'profile'
      }
      , function (err, file) {
        if (err || !file) {
          // console.log('Image not found, uploading');
          // UPLOAD
          var writestream = gfs.createWriteStream({
            filename: name,
            metadata: {
              owner: uId,
              type: 'profile'
            }
          });

          fs.createReadStream("./uploads/" + req.file.filename)
            .on("end", function () {
              fs.unlink("./uploads/" + req.file.filename, function (err) {
                return res.send("success");
              })
            })
            .on("err", function () { return res.send("Error uploading image") })
            .pipe(writestream);
          // FINISH UPLOADING
        }else {
          // console.log('Image already exists, deleting old one');
          gfs.remove(file, function(err2) {
            if(err2) return res.status(400).send({error: err2});
            // UPLOAD
            var writestream = gfs.createWriteStream({
              filename: name,
              metadata: {
                owner: uId,
                type: 'profile'
              }
            });

            fs.createReadStream("./uploads/" + req.file.filename)
              .on("end", function () {
                fs.unlink("./uploads/" + req.file.filename, function (err) {
                  return res.send("success");
                })
              })
              .on("err", function () { return res.send("Error uploading image") })
              .pipe(writestream);
            // FINISH UPLOADING
          });
        }
      });

  });


  // Upload profile background picture
  app.post('/api/upload-background-picture', loginCheck('admin'), upload.single('avatar'), (req, res, next) => {

    let uId = req.body.owner;
    let name = "background-picture" + "-" + uId + "-" + req.file.originalname;
    gfs.files.findOne(
      {
        "metadata.owner": uId,
        "metadata.type": 'background'
      }
      , function (err, file) {
        if (err || !file) {
          // console.log('Image not found, uploading');
          // UPLOAD
          var writestream = gfs.createWriteStream({
            filename: name,
            metadata: {
              owner: uId,
              type: 'background'
            }
          });

          fs.createReadStream("./uploads/" + req.file.filename)
            .on("end", function () {
              fs.unlink("./uploads/" + req.file.filename, function (err) {
                return res.send("success");
              })
            })
            .on("err", function () { return res.send("Error uploading image") })
            .pipe(writestream);
          // FINISH UPLOADING
        }else {
          // console.log('Image already exists, deleting old one');
          gfs.remove(file, function(err2) {
            if(err2) return res.status(400).send({error: err2});
            // UPLOAD
            var writestream = gfs.createWriteStream({
              filename: name,
              metadata: {
                owner: uId,
                type: 'background'
              }
            });

            fs.createReadStream("./uploads/" + req.file.filename)
              .on("end", function () {
                fs.unlink("./uploads/" + req.file.filename, function (err) {
                  return res.send("success");
                })
              })
              .on("err", function () { return res.send("Error uploading image") })
              .pipe(writestream);
            // FINISH UPLOADING
          });
        }
      });
  });


  app.get("/images/profile/:uId", function (req, res) {
    let uId = req.params.uId;
    gfs.files.findOne(
      {
        "metadata.owner": uId,
        "metadata.type": 'profile'
      }
      , function (err, file) {
        if (err || !file) {
          return res.status(404).send({ error: 'Image not found' });
        }
        var readstream = gfs.createReadStream({ filename: file.filename });
        readstream.on("error", function (err) {
          res.send("Image not found");
        });
        readstream.pipe(res);
      });
  });

  app.get("/images/background/:uId", function (req, res) {
    let uId = req.params.uId;
    gfs.files.findOne(
      {
        "metadata.owner": uId,
        "metadata.type": 'background'
      }, function (err, file) {
        if (err || !file) return res.status(404).send({ error: 'Image not found' });
        var readstream = gfs.createReadStream({ filename: file.filename });
        readstream.on("error", function (err) {
          res.send("Image not found");
        });
        readstream.pipe(res);
      });
  });
}
