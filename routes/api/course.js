import course from './../../controllers/course';

import {loginCheck} from './../../utils';

module.exports = function(app){
  app.post ('/api/course',            loginCheck('user'),  course.create);
  app.post ('/api/is-first-course',   loginCheck('user'),  course.isFirstCourse);
  app.get  ('/api/cancel-course/:id', loginCheck('user'),  course.cancel);
  app.get  ('/api/course/:id',           loginCheck('user'),  course.read);
  app.get  ('/api/courses',           loginCheck('user'),  course.listUser);
  app.post ('/api/courses-tutor-child', course.tutorChildCourses);
  app.post ('/api/courses-summary',   loginCheck('user'),  course.coursesSummary);
  app.post ('/api/pay-for-course', loginCheck('user'), course.pay);
}
