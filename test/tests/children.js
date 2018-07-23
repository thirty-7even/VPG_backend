import mongoose   from 'mongoose';
import chai       from 'chai';
import chaiHttp   from 'chai-http';
import supertest  from 'supertest';

import {assert, expect} from 'chai';
import {User} from '../../models/user';
import {Admin} from '../../models/admin';
import {Tutors}  from './dummyData/users';

chai.use(chaiHttp);

module.exports = (server) => {
  describe('Children', () => {
    it('should register a child', done => {
      chai
        .request(server)
        .post('/signup-child')
        .set('cookie', global.parentCookie)
        .send({fullName: 'Child 1', email: 'child-1@qwer.ty', password: 'qwe'})
        .end((err,res) => {
          if(err) console.log(err);
          expect(res).to.have.status(200);
          global.childObject = res.body.user;
          done();
        });
    });

    it('should register another child', done => {
      chai
        .request(server)
        .post('/signup-child')
        .set('cookie', global.parentCookie)
        .send({fullName: 'Child 2', email: 'child-2@qwer.ty', password: 'qwe'})
        .end((err,res) => {
          if(err) console.log(err);
          expect(res).to.have.status(200);
          done();
        });
    });
  });
}
