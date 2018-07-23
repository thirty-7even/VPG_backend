import mongoose   from 'mongoose';
import chai       from 'chai';
import chaiHttp   from 'chai-http';
import supertest  from 'supertest';

import {assert, expect} from 'chai';
import {User} from '../../models/user';
import {Tutors}  from './dummyData/users';
import {Mailbox} from '../../models/mailbox';

chai.use(chaiHttp);



module.exports = (server) => {

  describe('Messaging', () => {
    Mailbox.remove({}, err => {if (err) console.log(err);});
    let tutor1Cookie, tutor2Cookie, tutor1ID, tutor2ID;
    it('should logout', done => {
      chai
        .request(server)
        .get('/logout')
        .end((err,res) => {
          if(err) console.log(err);
          global.cookie = res.headers['set-cookie'];
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should log in as a tutor', done => {
      chai
        .request(server)
        .post('/login')
        .send({
          email: Tutors[0].email,
          password: Tutors[0].password
        })
        .end((err,res) => {
          if(err) console.log(err.error);
          expect(res).to.have.status(200);
          tutor1Cookie = res.headers['set-cookie'];
          tutor1ID = res.body._id;
          global.cookie = res.headers['set-cookie'];
          global.tutorCookie = res.headers['set-cookie'];
          done();
        });
    });

    it('should logout', done => {
      chai
        .request(server)
        .get('/logout')
        .end((err,res) => {
          if(err) console.log(err);
          global.cookie = res.headers['set-cookie'];
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should log in as a tutor', done => {
      chai
        .request(server)
        .post('/login')
        .send({
          email: Tutors[1].email,
          password: Tutors[1].password
        })
        .end((err,res) => {
          if(err) console.log(err.error);
          expect(res).to.have.status(200);
          global.cookie = res.headers['set-cookie'];
          tutor2Cookie = res.headers['set-cookie'];
          tutor2ID = res.body._id;
          done();
        });
    });

    it('should create a message', done => {
      chai
        .request(server)
        .post('/api/message')
        .set('cookie', tutor1Cookie)
        .send({to: tutor2ID, body: 'first message'})
        .end((err,res) => {
          if(err) console.log(err);
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should reply', done => {
      chai
        .request(server)
        .post('/api/message')
        .set('cookie', tutor2Cookie)
        .send({to: tutor1ID, body: 'first reply'})
        .end((err,res) => {
          if(err) console.log(err);
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should get a list of chats', done => {
      chai
        .request(server)
        .get('/api/messages')
        .set('cookie', tutor2Cookie)
        .end((err,res) => {
          if(err) console.log(err);
          expect(res).to.have.status(200);
          done();
        });
    });


    it('should get one chat', done => {
      chai
        .request(server)
        .get('/api/messages/'+tutor1ID)
        .set('cookie', tutor2Cookie)
        .end((err,res) => {
          if(err) console.log(err);
          expect(res).to.have.status(200);
          done();
        });
    });

  });
};
