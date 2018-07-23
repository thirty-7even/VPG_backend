import mongoose   from 'mongoose';
import chai       from 'chai';
import chaiJsonEqual from 'chai-json-equal';
import chaiHttp   from 'chai-http';
import supertest  from 'supertest';


import {assert, expect} from 'chai';
import {Subject}  from '../../models/subject';
import {Level}    from '../../models/level';

chai.use(chaiHttp);
chai.use(chaiJsonEqual);

module.exports = function(server){
  let path = '/api/levels/';
  let subjectIDs = [];
  let subjectNames = [];
  let levels = [];
  describe('LEVELS',() =>{
    Level.remove({}, (err) => {
    });

    describe('Prepare', () => {
      it('Gets all subject IDs from database', done => {
        Subject
          .find()
      		.then((subjects) => {
            subjectIDs = subjects.map(v=>{
              return v._id;
            });
            subjectNames = subjects.map(v=>{
              return v.name;
            });
            expect(subjectIDs).to.have.lengthOf(9);
            expect(subjectNames).to.have.lengthOf(9);
            done();
      		});
      });
    });

    describe('Empty Levels collection', () => {
      it('GET(/api/levels/) should respond with an empty array', (done) => {
        chai.request(server)
        .get('/api/levels')
        .set('cookie', global.cookie)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('levels');
          expect(res.body.levels).to.be.an('array').that.is.empty;
          done();
        });
      });
    });

    describe('Create Levels', () => {
      it('POST(/api/levels) should be successful', done => {
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({
            name: 'Level 0',
            subjects: [
              subjectIDs[0],
              subjectIDs[1],
              subjectIDs[2],
              subjectIDs[3],
              subjectIDs[4],
              subjectIDs[5],
              subjectIDs[6]
            ]
          })
          .end((err,res) => {
            if(err){
              done(err);
            }else {
              expect(res).to.have.status(200);
              done();
            }
          })
      });
      it('POST(/api/levels) with the same name should be refused', done => {
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({
            name: 'Level 0',
            subjects: [
              subjectIDs[0],
              subjectIDs[1],
              subjectIDs[2],
              subjectIDs[3],
              subjectIDs[4],
              subjectIDs[5],
              subjectIDs[6]
            ]
          })
          .end((err,res) => {
            if(err){
              expect(err).to.have.status(400);
              done();
            }else {
              expect.fail();
              done();
            }
          })
      });
      it('POST(/api/levels) with no name should be refused', done => {
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({
            name: '',
            subjects: [
              subjectIDs[0],
              subjectIDs[1],
              subjectIDs[2],
              subjectIDs[3],
              subjectIDs[4],
              subjectIDs[5],
              subjectIDs[6]
            ]
          })
          .end((err,res) => {
            if(err){
              expect(err).to.have.status(400);
              done();
            }else {
              expect.fail();
              done();
            }
          })
      });
      it('POST(/api/levels) with no subjects should be refused', done => {
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({
            name: 'Refuse empty',
            subjects: [
            ]
          })
          .end((err,res) => {
            if(err){
              expect(err).to.have.status(400);
              done();
            }else{
              expect.fail();
              done();
            }
          })
      });
      it('POST(/api/levels) with the same subject twice should be refused', done => {
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({
            name: 'Refuse duplicate',
            subjects: [
              subjectIDs[0],
              subjectIDs[1],
              subjectIDs[2],
              subjectIDs[3],
              subjectIDs[4],
              subjectIDs[5],
              subjectIDs[0]
            ]
          })
          .end((err,res) => {
            if(err){
              expect(err).to.have.status(400);
              done();
            }else {
              expect.fail();
              done();
            }
          })
      });
      it('POST(/api/levels) second level should be accepted', done => {
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({
            name: 'Level 1',
            subjects: [
              subjectIDs[1],
              subjectIDs[2],
              subjectIDs[3],
              subjectIDs[4],
              subjectIDs[5],
              subjectIDs[6],
              subjectIDs[7]
            ]
          })
          .end((err,res) => {
            if(err){
              done(err);
            }else {
              expect(res).to.have.status(200);
              done();
            }
          })
      });
      it('POST(/api/levels) third level should be accepted', done => {
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({
            name: 'Level 2',
            subjects: [
              subjectIDs[2],
              subjectIDs[3],
              subjectIDs[4],
              subjectIDs[5],
              subjectIDs[6],
              subjectIDs[7],
              subjectIDs[8]
            ]
          })
          .end((err,res) => {
            if(err){
              done(err);
            }else {
              expect(res).to.have.status(200);
              done();
            }
          })
      });
      it('POST(/api/levels) fourth level should be accepted', done => {
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({
            name: 'Level 3',
            subjects: [
              subjectIDs[2],
              subjectIDs[3],
              subjectIDs[4],
              subjectIDs[5],
              subjectIDs[6],
              subjectIDs[7],
              subjectIDs[8]
            ]
          })
          .end((err,res) => {
            if(err){
              done(err);
            }else {
              expect(res).to.have.status(200);
              done();
            }
          })
      });
      it('GET(/api/levels) should respond with a list of 4 levels, 7 subjects each; level 2 and 3 have the same subjects', done => {
        chai
          .request(server)
          .get(path)
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              done(err);
            }else{
              expect(res).to.have.status(200);
              expect(res.body.levels).to.have.lengthOf(4);
              expect(res.body.levels[0].subjects.map(s=>{return s.name}))
                .to.contain.members(subjectNames.slice(0,7));
              expect(res.body.levels[1].subjects.map(s=>{return s.name}))
                .to.contain.members(subjectNames.slice(1,8));
              expect(res.body.levels[2].subjects.map(s=>{return s.name}))
                .to.contain.members(subjectNames.slice(2,9));
              expect(res.body.levels[3].subjects.map(s=>{return s.name}))
                .to.contain.members(subjectNames.slice(2,9));
              levels = res.body.levels;
              done();
            }
          });
      });
      it('GET(/api/levels/:id) should respond with one subject', done => {
        chai
          .request(server)
          .get(path + levels[1]._id)
          .set('cookie', global.cookie)
          .end((err, res) => {
            if(err){
              done(err);
            }else{
              expect(res).to.have.status(200);
              expect(JSON.stringify(res.body.level)).to.be.equal(JSON.stringify(levels[1]));
              done();
            }
          });
      });
      it('GET(/api/levels/:id) with invalid id should respond with an error', done => {
        chai
          .request(server)
          .get(path + '12rf3ijin2i3ough7o')
          .set('cookie', global.cookie)
          .end((err, res) => {
            if(err){
              expect(err).to.have.status(404);
              done();
            }else{
              expect.fail();
              done();
            }
          });
      });
    });

    describe('Edit Levels', () => {
      it('PATCH(/api/levels/:id) should edit the level name', done => {
        let id = levels[3]._id;
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({name: 'New Level 3'})
          .end((err, res) => {
            if(err){
              done(err);
            }else{
              expect(res).to.have.status(200);
              done();
            }
          });
      });
      it('PATCH(/api/levels/:id) should edit the level subjects', done => {
        let id = levels[3]._id;
        let newSubjects = [
          subjectIDs[0],
          subjectIDs[1],
          subjectIDs[2]
        ];
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({subjects: newSubjects})
          .end((err, res) => {
            if(err){
              done(err);
            }else{
              expect(res).to.have.status(200);
              done();
            }
          });
      });
      it('PATCH(/api/levels/:id) with the existing name should be refused', done => {
        let id = levels[1]._id;
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({name: 'New Level 3'})
          .end((err, res) => {
            if(err){
              expect(err).to.have.status(400);
              done();
            }else{
              expect.fail();
              done();
            }
          });
      });
      it('PATCH(/api/levels/:id) with invalid id should be refused', done => {
        let id = "2123r";
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({name: 'refuse invalid id'})
          .end((err, res) => {
            if(err){
              expect(err).to.have.status(404);
              done();
            }else{
              expect.fail();
              done();
            }
          });
      });
      it('PATCH(/api/levels/:id) with no id should be refused', done => {
        let id = '';
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({name: 'refuse no id'})
          .end((err, res) => {
            if(err){
              expect(err).to.have.status(404);
              done();
            }else{
              expect.fail();
              done();
            }
          });
      });
      it('PATCH(/api/levels/:id) with duplicate subjects should be refused', done => {
        let id = levels[3]._id;
        let newSubjects = [
          subjectIDs[5],
          subjectIDs[5]
        ];
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({subjects: newSubjects})
          .end((err, res) => {
            if(err){
              expect(err).to.have.status(400);
              done();
            }else{
              expect.fail();
              done();
            }
          });
      });
      it('check new level', done => {
        chai
          .request(server)
          .get(path + levels[3]._id)
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              done(err);
            }else{
              expect(res).to.have.status(200);
              expect(res.body.level.name).to.equal('New Level 3');
              let arr = res.body.level.subjects.map(s => {return s.name;});
              let shouldBe = [
                subjectNames[0],
                subjectNames[1],
                subjectNames[2]
              ];
              expect(arr).to.contain.members(shouldBe);
              done();
            }
          });
      });
    });

    describe('Delete Levels', () => {
      it('DELETE(/api/levels/:id) should remove level from levels collection', done => {
        let id = levels[3]._id;
        chai
          .request(server)
          .delete(path + id)
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              done(err);
            }else{
              expect(res).to.have.status(200);
              done();
            }
          });
      });
      it('DELETE(/api/levels/:id) with invalid id should be refused', done => {
        let id = 'w8et8weg468w';
        chai
          .request(server)
          .delete(path + id)
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              expect(err).to.have.status(404);
              done();
            }else{
              expect.fail();
              done();
            }
          });
      });
      it('DELETE(/api/levels/:id) with no id should be refused', done => {
        let id = '';
        chai
          .request(server)
          .delete(path + id)
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              expect(err).to.have.status(404);
              done();
            }else{
              expect.fail();
              done();
            }
          });
      });
      it('check levels collection has right number of documents', done => {
        chai
          .request(server)
          .get(path)
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              done(err);
            }else{
              expect(res).to.have.status(200);
              expect(res.body.levels).to.have.lengthOf(3);
              done();
            }
          });
      })
    });
  });
};
