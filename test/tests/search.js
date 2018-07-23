import mongoose         from 'mongoose';
import request          from 'supertest';
import chai             from 'chai';
import chaiJsonEqual    from 'chai-json-equal';
import chaiHttp         from 'chai-http';
import supertest        from 'supertest';
import axios            from 'axios';
import {assert, expect} from 'chai';

import {User} from '../../models/user';
import {Admin} from '../../models/user';
import {Customer} from '../../models/user';
import {Tutor} from '../../models/user';

chai.use(chaiHttp);
chai.use(chaiJsonEqual);

module.exports = server => {
  User.remove({}, (err) => console.log);
  describe('Search test', function(){

    var levels;
    const axrequest = axios.create({baseURL: 'http://localhost:3000'})
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
    it('should populate database with dummy data', function(done) {
      this.timeout(15000);
      var locations = [
        '102a tower bridge road',
        'Strand, London WC2R 2LS',
        'St Katharine\'s & Wapping, London EC3N 4AB',
        '103 Gaunt St, London SE1 6DP',
        '144-152 Bermondsey St, London SE1 3TQ',
        'Great Maze Pond, London SE1 9RT',
        '50 Great Dover St, London SE1 4YG',
        '318 Kennington Park Rd, London SE11 4PP',
        '8 Lewisham Way, New Cross, London SE14 6NW',
        'Denmark Hill, Brixton, London SE5 9RS'
      ];
      let newTutors = [];
      for(let i=0; i<locations.length; i++){
        newTutors.push({
          fullName: `Test Tutor ${i}`,
          location: locations[i],
          telephoneNumber: '07444555666',
          dob: '01.01.1980',
          level: levels[0]._id,
          subjects: [
            levels[0].subjects[0]._id,
            levels[0].subjects[1]._id
          ],
          email: `tutor${i}@qwer.ty`,
          password: 'qwe'
        });
      }


      // Register all tutors at once
      let promises = newTutors.map(tutor => {
        return new Promise((resolve,reject) => {
          axrequest
            .post('/signup', tutor)
            .then(res => {
              expect(res).to.have.status(200);
              resolve(res);
            })
            .catch(err => {
              console.log(err);
              reject(err);
            });
        });
      });



      axios
        .all(promises)
        .then(axios.spread(function (acct, perms) {
          done();
        }))
        .catch(err =>{
          done(err);
        });
    });

    it('should perform a basic search', done => {
      chai
        .request(server)
        .post('/api/tutors/search')
        .send({lat: 51.4967355, lng: -0.0814023})
        .end((err,res) => {
          if(err) console.log(err);
          console.log(res.body.tutors);
          done();
        });
    });
  });
}
