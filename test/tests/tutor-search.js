import mongoose   from 'mongoose';
import chai       from 'chai';
import chaiHttp   from 'chai-http';
import supertest  from 'supertest';

import {assert, expect} from 'chai';
import {User} from '../../models/user';
import {Tutors}  from './dummyData/users';

chai.use(chaiHttp);

module.exports = (server) => {
  describe('Tutor search', () => {
    it('should search for tutors', done => {
      chai
        .request(server)
        .post('/api/tutors/search')
        .send({
          lng: -0.0814023,
          lat: 51.4967355,
          radius: 10000,
          levels: ['598b79e358aea0228dd6018a'],
          subjects: ['598b79e358aea0228dd60185']
        })
        .end((err,res) =>{
          if(err) console.log(err);
          expect(res).to.have.status(200);
          console.log(JSON.stringify(res.body.tutors, null, 2));
          done();
        });
    });
  });
};
