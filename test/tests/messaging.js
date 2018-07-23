import mongoose         from 'mongoose';
import request          from 'supertest';
import chai             from 'chai';
import chaiJsonEqual    from 'chai-json-equal';
import chaiHttp         from 'chai-http';
import supertest        from 'supertest';
import axios            from 'axios';
import {assert, expect} from 'chai';

import {User} from '../../models/user';
import {Mailbox} from '../../models/mailbox';

chai.use(chaiHttp);
chai.use(chaiJsonEqual);

module.exports = server => {
  Mailbox.remove({}, err => {if (err) console.log(err);});
  var user1 = mongoose.Types.ObjectId();
  var user2 = mongoose.Types.ObjectId();
  var user3 = mongoose.Types.ObjectId();
  describe('Messaging', ()=> {
    it('should create a message', done => {
      chai
        .request(server)
        .post('/api/message/' + user1)
        .send({toID: user2, fromID: user1, body: 'fist message'})
        .end((err,res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should create a message in the same mailbox', done => {
      chai
        .request(server)
        .post('/api/message/' + user1)
        .send({toID: user2, fromID: user1, body: 'second message'})
        .end((err,res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should reply', done => {
      chai
        .request(server)
        .post('/api/message/' + user2)
        .send({fromID: user2, toID: user1, body: 'reply, third message'})
        .end((err,res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should send a message from a different user to user 1', done => {
      chai
        .request(server)
        .post('/api/message/' + user1)
        .send({fromID: user3, toID: user1, body: 'message from user 3'})
        .end((err,res) => {
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should send a message from a different user to user 2', done => {
      chai
        .request(server)
        .post('/api/message/' + user1)
        .send({fromID: user3, toID: user2, body: 'message from user 3'})
        .end((err,res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });
};
