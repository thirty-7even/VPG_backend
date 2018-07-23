import mongoose         from 'mongoose';
import request          from 'supertest';
import chai             from 'chai';
import chaiJsonEqual    from 'chai-json-equal';
import chaiHttp         from 'chai-http';
import supertest        from 'supertest';
import {assert, expect} from 'chai';

import {User} from '../../models/user';
import {Admin} from '../../models/admin';
import {Customer} from '../../models/customer';
import {Tutor} from '../../models/tutor';

chai.use(chaiHttp);
chai.use(chaiJsonEqual);

// USER LOG IN AND SESSION TEST
// using cookie for session testing
module.exports = server => {

  describe('Users api routes', () => {
    var tutor, customer, admin;
    var levels;
    describe('Create', () => {
      it('should get a list of levels', done => {
        chai
          .request(server)
          .get('/api/levels')
          .end((err,res) => {
            expect(res).to.have.status(200);
            levels = res.body.levels;
            // console.log(JSON.stringify(res.body));
            done();
          })
      });
      it('should register a customer', done => {
        chai
          .request(server)
          .post('/signup')
          .send({email: 'customer@qwer.ty', password: 'qwe'})
          .end((err,res) => {
            expect(res).to.have.status(200);
            customer = res.body.user;
            done();
          });
      });
      it('should register a tutor', done => {
        chai
          .request(server)
          .post('/signup')
          .send({
            fullName: 'Test Tutor 1',
            location: 'London',
            telephoneNumber: '07444555666',
            dob: '01.01.1980',
            level: levels[0]._id,
            subjects: [
              levels[0].subjects[0]._id,
              levels[0].subjects[1]._id
            ],
            location: '1 strand london uk',
            email: 'tutor@qwer.ty',
            password: 'qwe'})
          .end((err,res) => {
            if(err) console.log(err);
            expect(res).to.have.status(200);
            tutor = res.body.user;
            done();
          });
      });
      it('should register an admin', done => {
        chai
          .request(server)
          .post('/signup')
          .send({email: 'admin@qwer.ty', password: 'qwe', role: 'admin'})
          .end((err,res) => {
            expect(res).to.have.status(200);
            admin = res.body.user;
            done();
          });
      });

      it('should activate a customer', done => {
        chai
          .request(server)
          .get(`/api/activate/${customer.activationCode}`)
          .end((err,res) => {
            if(err) console.log(err);
            expect(res).to.have.status(200);
            done();
          });
      });

      it('should activate a tutor', done => {
        chai
          .request(server)
          .get(`/api/activate/${tutor.activationCode}`)
          .end((err,res) => {
            if(err) console.log(err);
            expect(res).to.have.status(200);
            done();
          });
      });

      it('should activate an admin', done => {
        chai
          .request(server)
          .get(`/api/activate/${admin.activationCode}`)
          .end((err,res) => {
            if(err) console.log(err);
            expect(res).to.have.status(200);
            done();
          });
      });
    });
    // describe('Read', () => {
    //
    // });
    describe('Update', () => {
      it('should update tutor document', done => {
        chai
          .request(server)
          .patch(`/api/tutors/${tutor._id}`)
          .send({
            fullName: 'Different Name',
            range: 9,
            experiences: [
              {
                started: '01.01.2000',
                ended: '01.01.2010',
                title: 'the man',
                description: 'did the thing'
              }
            ],
            hobbies: [
              'Slow walking',
              'Sleeping',
              'Fast food enthusiast'
            ],
          })
          .end((err, res) => {
            expect(res).to.have.status(200);
            done();
          });
      });

      it('should update customer document', done => {
        chai
          .request(server)
          .patch(`/api/customers/${customer._id}`)
          .send({
            fullName: 'First Customer',
            telephoneNumber: '07123456789'
          })
          .end((err, res) => {
            expect(res).to.have.status(200);
            done();
          });
      });
    });
    // describe('Delete', () => {
    //
    // });
  });
}
