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
  describe('Customers', () => {
    it('should register a parent', done => {
      chai
        .request(server)
        .post('/signup')
        .send({
          email: 'customer-1@qwer.ty',
          password: 'qwe',
          fullName: 'Parent 1'
        })
        .end((err,res) => {
          expect(res).to.have.status(200);
          let activationCode = res.body.user.activationCode;
          chai
            .request(server)
            .get('/api/activate/' + activationCode)
            .end((err,res) => {
              expect(res).to.have.status(200);
              done();
            });
        });
    });

    it('should log in as a parent', done => {
      chai
        .request(server)
        .post('/login')
        .send({
          email: 'customer-1@qwer.ty',
          password: 'qwe'
        })
        .end((err,res) => {
          if(err) console.log(err.error);
          expect(res).to.have.status(200);
          global.parentCookie = res.headers['set-cookie'];
          global.parentObject = res.body;
          done();
        });
    });
  });
};
