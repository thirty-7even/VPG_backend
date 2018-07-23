import mongoose   from 'mongoose';
import chai       from 'chai';
import chaiHttp   from 'chai-http';
import supertest  from 'supertest';

import {assert, expect} from 'chai';
import {User} from '../../models/user';
import {Admin} from '../../models/admin';
import {Tutors}  from './dummyData/users';

chai.use(chaiHttp);

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

// AIzaSyC6uh_nAjL6p1UCqwpCZ58PHrmBZ68ATAs
module.exports = (server) => {

  var levels = [];
  describe('Tutors',() =>{
    it('should have tutors array', done => {
      expect(Tutors).to.have.lengthOf(13);
      done();
    });
    describe('Create Tutors', () => {
      it('should get levels object from database', done =>{
        chai
        .request(server)
        .get('/api/levels')
        .end((err,res) =>{
          if(err) console.log(err);
          expect(res).to.have.status(200);
          levels = res.body.levels;
          done();
        });
      });
      let i = 0;
        Tutors.forEach(tutor => {
          it(`should create tutor: ${tutor.fullName}`, done => {
            let activationCode;
            let index = i % levels.length;
            i++;
            let level = levels[index];
            let lvl = level._id;
            let subjIndex1 = getRandomInt(0, level.subjects.length-1);
            let subjIndex2 = subjIndex1;
            while(subjIndex1 == subjIndex2) subjIndex2 = getRandomInt(0, level.subjects.length-1);
            let subj1 = level.subjects[subjIndex1]._id;
            let subj2 = level.subjects[subjIndex2]._id;
            chai
              .request(server)
              .post('/signup')
              .send({
                email: tutor.email,
                password: tutor.password,
                fullName: tutor.fullName,
                dob: tutor.dob,
                telephoneNumber: tutor.telephoneNumber,
                location: tutor.location,
                levels: lvl,
                subjects: [subj1, subj2],
                range: 9
              })
              .end((err,res) => {
                if(err) console.log(res.body.message);
                expect(res).to.have.status(200);
                activationCode = res.body.user.activationCode;
                chai
                  .request(server)
                  .get('/api/activate/' + activationCode)
                  .end((err,res) => {
                    expect(res).to.have.status(200);
                    done();
                  });
              });
          });
        });
    });

  });
};
