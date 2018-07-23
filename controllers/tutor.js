const { ObjectID } = require('mongodb');
import {pick} from 'lodash';

const { Tutor } = require('./../models/tutor');
const { Subject } = require('./../models/subject');
const { Course } = require('./../models/course');
const { Child } = require('./../models/child');


// SEARCH TUTORS
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

exports.listNotActivated = (req, res) => {
  if (req.user._t != 'Admin') return res.status(403).send({ error: 'Restricted to admins only.' });
  Tutor.find({ activated: false })
    .then(tutors => {
      res.status(200).send({ tutors });
    })
    .catch(err => {
      res.status(400).send(err);
    })
};

exports.search = (req, res) => {
  let lat1 = req.body.lat;
  let lon1 = req.body.lng;
  let page = req.body.page || 1;
  let perPage = req.body.perPage || 10;
  let radius = req.body.radius || 10000;

  let levelsIn = req.body.levels && req.body.levels.length !== 0 ? req.body.levels.map(level => {
    return ObjectID(level);
  }) : null;
  let subjectsIn = req.body.subjects && req.body.subjects.length !== 0 ? req.body.subjects.map(subject => {
    return ObjectID(subject);
  }) : null;

  var options = { page: page, limit: perPage } //, sortBy: { updatedDate: -1 }

  const isAdmin = req.user ? req.user.role === "admin" || req.user.role === "super-admin" : false;

  let match = {}

  if (levelsIn) match.levels = { $in: levelsIn };
  if (subjectsIn) match.subjects = { $in: subjectsIn }
  if (typeof req.body.activated !== "undefined") match.profileActivated = req.body.activated;
  if (req.body.from) match.createdAt = { $gte: new Date(req.body.from) };
  if (req.body.to) {
    if (match.createdAt) match.createdAt.$lte = new Date(req.body.to);
    else match.createdAt = { $lte: new Date(req.body.to) };
  }

  var aggregate = null;

  if (!isAdmin) {
    match.activated = true
    match.profileActivated = true
    match.profileOnline = true
  }

  if (lat1 && lon1) {
    aggregate = Tutor.aggregate([
      {
        "$geoNear":
          {
            "near":
              {
                "type": "Point",
                "coordinates": [lon1, lat1]
              },
            "distanceField": "distance",
            "spherical": true,
            "maxDistance": radius
          }
      },
      {
        $match: match
      }
    ]);
  } else {
    aggregate = Tutor.aggregate([
      {
        $match: match
      }
    ]);
  }

  Tutor
    .aggregatePaginate(aggregate, options, function (err, result, pageCount, count) {
      if (err) {
        return res.status(400).send(err);
      }
      else {
        var opts = [
          { path: 'levels', select: 'name' },
          { path: 'subjects', select: 'name' },
          { path: 'assos', select: 'name' }
        ];
        Tutor
          .populate(result, opts)
          .then(result2 => {
            return res.send({
              page: page,
              perPage: perPage,
              pageCount: pageCount,
              documentCount: count,
              tutors: result2
            });
          })
          .catch(err => {
            return res.status(400).send(err);
          });
      }
    })
};


// LIST ALL TUTORS
exports.list = (req, res) => {
  Tutor.find()
    .populate('subjects')
    .then((tutors) => {
      if (!tutors) {
        return res.status(404).send();
      }
      res.send({ tutors });
    }).catch((e) => {
      res.status(400).send();
    });
};

// READ TUTOR
exports.searchByEmail = (req, res) => {
  const email = req.params.email;
  Tutor.find({ 'local.email': email })
    .populate('subjects')
    .then((tutor) => {
      if (!tutor) {
        return res.status(404).send();
      }
      res.send({ user: tutor });
    }).catch((e) => {
      res.status(400).send();
    });
};

// READ TUTOR
exports.read = (req, res) => {
  var id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  Tutor.findById(id)
    .populate('subjects')
    .then((tutor) => {
      if (!tutor) {
        return res.status(404).send();
      }
      res.send({ user: tutor });
    }).catch((e) => {
      res.status(400).send();
    });
};

exports.update = (req, res) => {
  var id = req.params.id;

  const isAdmin = req.user ? req.user.role === "admin" || req.user.role === "super-admin" : false;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  const toPickFrom = [
    'fullName',
    'location',
    'loc',
    'telephoneNumber',
    'dob',
    'createdAd',
    'levels',
    'profileOnline',
    'range',
    'bio',
    'hobbies',
    'experiences',
    'cv',
    'majorDescription',
    'profilePicture',
    'backgroundPicture',
    'subjects',
    'asso',
    'givenToAsso',
    'siretNumber',
    'companyAddress',
    'schedule',
    'updatedDate'];

  if (isAdmin)
    ['profileActivated', 'activated'].map(item => toPickFrom.push(item));

  var body = pick(req.body, toPickFrom);

  Tutor.findByIdAndUpdate(id, {
    $set: body
  }, {
      new: true,
      runValidators: true
    }).then((tutor) => {
      if (!tutor) {
        return res.status(404).send();
      }
      res.send({ user: tutor });
    }).catch((e) => {
      res.status(400).send();
    });
};

exports.delete = (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  Tutor.findByIdAndRemove(id).then((tutor) => {
    if (!tutor) {
      return res.status(404).send();
    }
    res.send({ user: tutor });
  }).catch((e) => {
    res.status(400).send();
  });
};

exports.listMessages = (req, res) => {
  var id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  PrivateMessage.find({ fromTutor: id })
    .populate('fromTutor')
    .populate('toTutor')
    .then((messages) => {
      if (!messages) {
        return res.status(404).send();
      }
      res.send({ messages });
    }).catch((e) => {
      res.status(400).send();
    });
};

exports.addSubjects = (req, res) => {
  var id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  var body = pick(req.body, ['subjects']);

  var promises = body.subjects.map(subjectID => {
    // validate subjects
    return new Promise((resolve, reject) => {
      Subject.findById(subjectID)
        .then(subject => {
          var msg = subjectID;
          // subject not found
          if (!subject) {
            msg += ' - not found';
            console.log(msg);
            return reject(msg);
          }
          //subject found
          msg += ' - found: ' + subject.name;
          console.log(msg);
          resolve(subject);
        })
        .catch((e) => {
          res.status(400).send(e);
        });

    });
  });
  Promise.all(promises)
    .then(function () {
      // if every subject exists in database
      console.log('all subjects found');
      // find and update tutor
      Tutor.findByIdAndUpdate(id, {
        $set: body
      }, {
          new: true
        }).then((tutor) => {
          // tutor not found
          if (!tutor) {
            return res.status(404).send();
          }
          // all good
          res.send({ tutor });
        }).catch((e) => {
          console.log(body);
          res.status(400).send(e);
        });
    })
    .catch((err) => {
      console.error;
      res.status(404).send(err);
    })

};

exports.getProfs = (req, res) => {
  let user = req.user;
  let query = {};
  let tutors = [];
  if (user.__t == 'Customer') {
    query = { 'customer._id': user._id };
    if (req.body.child) query.child = req.body.child;
  }
  else if (user.__t == 'Child') query = { 'child._id': user._id };
  else return res.status(401).send({ error: 'Restricted to children and parents' });
  Course
    .find(query)
    .then(courses => {
      courses.map(course => {
        if (!tutors.map(t => t.toString()).includes(course.tutor._id.toString())) tutors.push(course.tutor._id);
      });
      Tutor.find({ _id: { $in: tutors } })
        .populate('subjects')
        .then(tutorsFromDb => {
          res.send({ tutors: tutorsFromDb });
        })
    })
    .catch(err => {
      res.status(400).send({ error: err });
    })
};

exports.getPupils = (req, res) => {
  let user = req.user;
  if (user.__t != 'Tutor') return res.status(401).send({ error: 'Restricted to tutors' });
  let children = [];
  Course
    .find({ 'tutor._id': user._id })
    .then(courses => {
      courses.map(course => {
        if (!children.map(t => t.toString()).includes(course.child._id.toString())) children.push(course.child._id);
      });
      Child
        .find({ _id: { $in: children } })
        .then(childrenFromDb => {
          res.send({ pupils: childrenFromDb });
        });
    })
    .catch(err => {
      res.status(400).send({ error: err });
    })
};

exports.rate = (req, res) => {

  // Check missing parameters
  let allParametersPresend = (
    req.body.id &&
    req.body.ponctualiteRating &&
    req.body.communicationRating &&
    req.body.competencesRating
  );

  if (!allParametersPresend) return res.status(400).send({ error: 'Missing arguments' })

  let tutorId = req.body.id;
  let parentId = req.user._id;
  let ponctualiteRating = req.body.ponctualiteRating;
  let communicationRating = req.body.communicationRating;
  let competencesRating = req.body.competencesRating;
  let totalRating = ponctualiteRating + communicationRating + competencesRating;

  // Validate rating
  let validRating = (
    ponctualiteRating <= 5 && ponctualiteRating >= 0 &&
    communicationRating <= 5 && communicationRating >= 0 &&
    competencesRating <= 10 && competencesRating >= 0
  );
  if (!validRating) return res.status(404).send({ error: 'invalid rating' });

  // Validate tutor id
  if (!ObjectID.isValid(tutorId)) return res.status(404).send({ error: 'invalid tutor id' });

  // Check if there is a completed course
  Course
    .find({ 'tutor._id': tutorId, "customer._id": parentId})
    .then(courses => {
      if(courses.length<1) return res.status(401).send({ error: 'Can not rate - no completed courses with this tutor'})
      Tutor
        .findById(tutorId)
        .then(tutor => {
          if (!tutor) return res.status(404).send({ error: 'Tutor not found' });
          for (let i = 0; i < tutor.rated.length; i++) {
            if (tutor.rated[i].toString() === parentId.toString()) {
              return res.status(401).send({ error: 'Can not rate a tutor more than once' });
            }
          }

          // Rating
          tutor.rating.ponctualiteRating += ponctualiteRating;
          tutor.rating.communicationRating += communicationRating;
          tutor.rating.competencesRating += competencesRating;
          tutor.rating.totalRating += totalRating;
          tutor.rating.count += 1;

          // Save comment if provided
          if(req.body.comment){
            let comment = {
              title: req.body.comment.title,
              body: req.body.comment.body,
              totalRating: totalRating,
              author: {
                fullName: req.user.fullName,
                _id: parentId
              }
            };
            tutor.comments.push(comment);
        }


          // List of parents who rated this tutor
          tutor.rated.push(parentId);

          tutor.$__save({}, (error, doc) => {
            if(error){
              return res.status(400).send({ error });
            }
              return res.send({ tutor });
            })
          })
        .catch(error => {
          res.status(400).send(error);
        });
    })
    .catch(error => {
      res.status(400).send(error);
    });
};
