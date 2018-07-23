import mongoose         from 'mongoose';
import request          from 'supertest';
import chai             from 'chai';
import chaiJsonEqual    from 'chai-json-equal';
import chaiHttp         from 'chai-http';
import supertest        from 'supertest';
import {assert, expect} from 'chai';

import {User} from '../../models/user';

chai.use(chaiHttp);
chai.use(chaiJsonEqual);

// USER LOG IN AND SESSION TEST
// using cookie for session testing
module.exports = server => {
  var cookie;

  describe('Customer test', () => {
    var user;
    var admin;
    User.remove({}, (err) => console.log);
    it('Register user - should successfully register a customer', done => {
      chai
        .request(server)
        .post('/signup')
        .send({email: 'customer@qwer.ty', password: 'qwe'})
        .end((err,res) => {
          expect(res).to.have.status(200);
          user = res.body.user;
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

    it('should refuse registration with wrong role', done => {
      chai
        .request(server)
        .post('/signup')
        .send({email: 'god@qwer.ty', password: 'qwe', role: 'god'})
        .end((err,res) => {
          expect(res).to.have.status(400);
          admin = res.body.user;
          done();
        });
    });

    it('User not acitvated - should refuse log in', done =>{
      chai
        .request(server)
        .post('/login')
        .send({ email: 'customer@qwer.ty', password: 'qwe' })
        .end((err,res) => {
          // if(err) console.log(err.error);
          expect(res).to.have.status(400);
          done();
        });
    });

    it('Should not activate user with the wrong code', done =>{
      chai
        .request(server)
        .get(`/api/activate/pi1hrpiu13y0984ytghw45o`)
        .end((err,res) => {
          expect(res).to.have.status(404);
          done();
        });
    });

    it('Should activate user', done =>{
      chai
        .request(server)
        .get(`/api/activate/${user.activationCode}`)
        .end((err,res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it('Should activate admin', done =>{
      chai
        .request(server)
        .get(`/api/activate/${admin.activationCode}`)
        .end((err,res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it('User acitvated - should log in', done =>{
      chai
        .request(server)
        .post('/login')
        .send({ email: 'customer@qwer.ty', password: 'qwe' })
        .end((err,res) => {
          // if(err) console.log(err.error);
          expect(res).to.have.status(200);
          cookie = res.headers['set-cookie'];
          done();
        });
    });

    it('should access route that requeres authentication', done => {
      chai
      .request(server)
      .post('/api/auth-test-user')
      .set('cookie', cookie)
      .end((err,res) => {
        expect(res).to.have.status(200);
        done();
      });
    });

    it('should deny access to admin area', done => {
      chai
      .request(server)
      .post('/api/auth-test-admin')
      .set('cookie', cookie)
      .end((err,res) => {
        expect(res).to.have.status(401);
        done();
      });
    });

    it('should log out', done => {
      chai
        .request(server)
        .get('/logout')
        .end((err,res) => {
          if(err) console.log(err);
          cookie = res.headers['set-cookie'];
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should deny access', done => {
      chai
      .request(server)
      .post('/api/auth-test-user')
      .set('cookie', cookie)
      .end(function(err,res){
        expect(res).to.have.status(401);
        done();
      });
    });

    it('should allow access to admin area to admin user', done =>{
      chai
        .request(server)
        .post('/login')
        .send({ email: 'admin@qwer.ty', password: 'qwe' })
        .end((err,res) => {
          // if(err) console.log(err.error);
          expect(res).to.have.status(200);
          cookie = res.headers['set-cookie'];
          chai
            .request(server)
            .post('/api/auth-test-admin')
            .set('cookie', cookie)
            .end((err,res) => {
              expect(res).to.have.status(200);
              done();
            });
        });
    });
  });
};
