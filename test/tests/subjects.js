import mongoose   from 'mongoose';
import chai       from 'chai';
import chaiHttp   from 'chai-http';
import supertest  from 'supertest';

import {assert, expect} from 'chai';
import {Subject}  from '../../models/subject';

chai.use(chaiHttp);

module.exports = server => {
  describe('Subjects',() =>{
    let subjectsToAdd = [
      'Subject 0',
      'Subject 1',
      'Subject 2',
      'Subject 3',
      'Subject 4',
      'Subject 5',
      'Subject 6',
      'Subject 7',
      'Subject 8',
      'Subject 9'
    ];
    let subjectIDs = [];
    let index = 0;
    let path = '/api/subjects/';
    Subject.remove({}, (err) => {
    });

    describe('Empty subject collection', () => {
        it('GET(/api/subjects/) should get an empty array of subjects', done => {
          chai
            .request(server)
            .get(path)
            .end((err, res) => {
              if(err){
                done(err);
              }else{
                expect(res,'Status should be 200').to.have.status(200);
                expect(res.body,'Response body should have subjects').to.have.property('subjects');
                expect(res.body.subjects,'subjects should be an empty array').to.be.an('array').that.is.empty;
                done();
              }
            });
        });
    });

    describe('Create subjecs', () => {
      it('POST(/api/subjects/) with a valid name should add subject to collection', done => {
        let name = subjectsToAdd[0];
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({name})
          .end((err, res) => {
            if(err){
              done(err);
            }else{
              expect(res.status,'response status should be 200').to.equal(200);
              expect(res.body,'new subject should have all the expected properties').to.include.all.keys('name', '_id');
              expect(res.body.name,'new subject should have a correct name').to.equal(name);
              subjectIDs.push(res.body._id);
              done();
            }
          });
      });

      it('GET(/api/subjects/) should get an array with one subject', done => {
        chai
          .request(server)
          .get(path)
          .end((err, res) => {
            if(err){
              done(err);
            }else{
              expect(res.status,'Status should be 200').to.equal(200);
              expect(res.body,'Response body should have subjects').to.have.property('subjects');
              expect(res.body.subjects,'one elemts in array').to.have.lengthOf(1);
              done();
            }
          });
      });

      it('POST(/api/subjects/) with a the same name again should NOT add subject to collection', done => {
        let name = subjectsToAdd[0];
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({name})
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
      it('POST(/api/subjects/) with an empty name should NOT add subject to collection', done => {
        let name = '';
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({name})
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
      it('POST(/api/subjects/) with a valid name and other fields should still add subject to collection', done => {
        let name = subjectsToAdd[1];
        chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({name, foo: 'bar'})
          .end((err, res) => {
            if(err){
              done(err);
            }else{
              expect(res.status,'response status should be 200').to.equal(200);
              expect(res.body,'new subject should have all the expected properties').to.include.all.keys('name', '_id');
              expect(res.body.name,'new subject should have a correct name').to.equal(name);
              subjectIDs.push(res.body._id);
              done();
            }
          });
      });

      subjectsToAdd.slice(2,subjectsToAdd.length).forEach(name => {
        it('add ' + name, done => {
          chai
          .request(server)
          .post(path)
          .set('cookie', global.cookie)
          .send({name, foo: 'bar'})
          .end((err, res) => {
            if(err){
              done(err);
            }else{
              expect(res.status,'response status should be 200').to.equal(200);
              expect(res.body,'new subject should have all the expected properties').to.include.all.keys('name', '_id');
              expect(res.body.name,'new subject should have a correct name').to.equal(name);
              subjectIDs.push(res.body._id);
            }
          });
          done();
        });
      });

      it(`GET(/api/subjects/) should respond with a list of ${subjectsToAdd.length} subjects`, done => {
        chai
          .request(server)
          .get(path)
          .set('cookie', global.cookie)
          .end((err, res) => {
            if(err){
              done(err);
            }else{
              expect(res.status,'Status should be 200').to.equal(200);
              expect(res.body,'Response body should have subjects').to.have.property('subjects');
              expect(res.body.subjects,'one elemts in array').to.have.lengthOf(subjectsToAdd.length);
              done();
            }
          });
      });
      it('GET(/api/subjects/:id) with valid id should respond with subject body', done => {
        chai
          .request(server)
          .get(path + subjectIDs[5])
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              done(err);
            }else{
              expect(res.status).to.equal(200);
              expect(res.body).to.have.property('subject');
              expect(res.body.subject).to.have.property('name');
              expect(res.body.subject.name).to.equal(subjectsToAdd[5]);
              done();
            }
          });
      });
      it('GET(/api/subjects/:id) with invalid id should respond with 404: Not Found', done => {
        chai
          .request(server)
          .get(path + '012qwe')
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
    });

    describe('Edit subjects', () => {
      it('PATCH(/api/subjects/) should edit subject name', done => {
        let id = subjectIDs[9];
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({name: 'New Subject 9', foo: 'bar'})
          .end((err,res) => {
            if(err){
              done(err);
            }else{
              expect(res).to.have.status(200);
              done();
            }
          });
      });

      it('PATCH(/api/subjects/) with the same name shoule be refused', done => {
        let id = subjectIDs[8];
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({name: 'New Subject 9', foo: 'bar'})
          .end((err,res) => {
            if(err){
              expect(err).to.have.status(400);
              done();
            }else{
              expect.fail();
              done();
            }
          });
      });

      it('PATCH(/api/subjects/) with no ID  shoule be refused', done => {
        let id = '';
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({name: 'New Subject with wrong id', foo: 'bar'})
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


      it('PATCH(/api/subjects/) with wrong id should respond with 404', done => {
        let id = '12f4e0i';
        chai
          .request(server)
          .patch(path + id)
          .set('cookie', global.cookie)
          .send({name: 'New Subject 9'})
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

      it('check renamed subject', done => {
        chai
          .request(server)
          .get(path + subjectIDs[9])
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              done(err);
            }else{
              expect(res.status).to.equal(200);
              expect(res.body).to.have.property('subject');
              expect(res.body.subject).to.have.property('name');
              expect(res.body.subject.name).to.equal('New Subject 9');
              done();
            }
          });
      });
    });

    describe('Delete subjects', () => {
      it('DELETE(/api/subjects/:id) with valid id should be accepted', done => {
        let id = subjectIDs[7];
        chai
          .request(server)
          .delete(path + id)
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              done(err);
            }else{
              expect(res).to.have.status(200);
              expect(res.body).to.have.property('subject');
              expect(res.body.subject).to.have.property('name');
              expect(res.body.subject.name).to.equal(subjectsToAdd[7]);
              done();
            }
          });
      });
      it('DELETE(/api/subjects/:id) with invalid id should be refused', done => {
        let id = '123vwe5';
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
      it('DELETE(/api/subjects/:id) with no id should be refused', done => {
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
      it('GET(/api/subjects/) should be of a correct size and not contain deleted subject', done => {
        chai
          .request(server)
          .get(path)
          .set('cookie', global.cookie)
          .end((err,res) => {
            if(err){
              done(err);
            }else{
              expect(res.body.subjects).to.have.lengthOf(subjectsToAdd.length - 1);
              let names = res.body.subjects.map(obj => {
                return obj.name;
              });
              expect(names).to.not.include(subjectsToAdd[7]);
              done();
            }
          });
      });
    });

  });
};
