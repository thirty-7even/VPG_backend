// check tutors validator


// add tutors rating

import mongoose   from 'mongoose';
import chai       from 'chai';
import chaiHttp   from 'chai-http';
import supertest  from 'supertest';

import {assert, expect} from 'chai';

chai.use(chaiHttp);

module.exports = (server) => {
  describe('Courses', () =>{
    it('should not create a course if not logged in', done => {
      chai
        .request(server)
        .post('/api/course')
        // .set('cookie', global.tutorCookie)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });


    it('should create a course', done => {
      chai
        .request(server)
        .post('/api/course')
        .set('cookie', global.tutorCookie)
        .send({
          customer: global.parentObject._id,
          child: global.childObject._id,
          description: 'first course',
          date: new Date(),
          free: true,
          duration: 3
        })
        .end((err, res) => {
          if(err) console.log(err);
          expect(res).to.have.status(200);
          done();
        });
    });
  });
};
