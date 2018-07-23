import mongoose   from 'mongoose';
import chai       from 'chai';
import chaiHttp   from 'chai-http';
import supertest  from 'supertest';

import {assert, expect} from 'chai';
import {User} from '../../models/user';
import {Admin} from '../../models/admin';
import {Admins, SuperAdmins}  from './dummyData/users';

chai.use(chaiHttp);



module.exports = (server) => {

    describe('Admins',() =>{
    let superAdmin;
    let normalAdmin;

    describe('Super Admin', () => {
      User.remove({}, (err) => console.log);

      it('should only be able to register super admin manually', done => {
        var usr = new Admin({
          fullName: SuperAdmins[0].fullName,
          role: 'super-admin'
        });
        usr.local.email    = SuperAdmins[0].email;
        usr.local.password = usr.generateHash(SuperAdmins[0].password);
        usr.activationCode = usr.generateActvationCode();
        usr
          .save()
          .then((result)=>{
            superAdmin = result
            done();
          })
          .catch(err => console.log);
      });

      it('should activate super-admin', done =>{
        chai
          .request(server)
          .get(`/api/activate/${superAdmin.activationCode}`)
          .end((err,res) => {
            expect(res).to.have.status(200);
            done();
          });
      });

    });

    describe('Admin', () => {

      it('should refuse admin signup unless super-admin is logged in', done => {
        chai
        .request(server)
        .post('/signup-admin')
        .send({fullName: Admins[0].fullName, email: Admins[0].email, password: Admins[0].password, role: 'admin'})
        .end((err,res) => {
          expect(res).to.have.status(401);
          done();
        });
      });

      it('should log in as super-admin', done => {
        chai
          .request(server)
          .post('/login')
          .send({
            email: SuperAdmins[0].email,
            password: SuperAdmins[0].password
          })
          .end((err,res) => {
            if(err) console.log(err.error);
            expect(res).to.have.status(200);
            global.cookie = res.headers['set-cookie'];
            done();
          });
      });

      it('should register an admin', done => {
        chai
        .request(server)
        .post('/signup-admin')
        .set('cookie', global.cookie)
        .send({fullName: Admins[0].fullName, email: Admins[0].email, password: Admins[0].password, role: 'admin'})
        .end((err,res) => {
          expect(res).to.have.status(200);
          normalAdmin = res.body.user;
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

      it('admin not activated - should refuse login', done =>{
        chai
          .request(server)
          .post('/login')
          .send({ email: Admins[0].email, password: Admins[0].password })
          .end((err,res) => {
            // if(err) console.log(err.error);
            expect(res).to.have.status(400);
            done();
          });
      });

      it('should acivate an admin', done =>{
        chai
        .request(server)
        .get(`/api/activate/${normalAdmin.activationCode}`)
        .end((err,res) => {
          expect(res).to.have.status(200);
          done();
        });
      });

      it('should log in as an admin', done =>{
        chai
          .request(server)
          .post('/login')
          .send({ email: Admins[0].email, password: Admins[0].password })
          .end((err,res) => {
            // if(err) console.log(err.error);
            expect(res).to.have.status(200);
            cookie = res.headers['set-cookie'];
            done();
          });
      });

    });

  });
};
