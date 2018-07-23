import mongoose   from 'mongoose';
import chai       from 'chai';
import chaiHttp   from 'chai-http';
import supertest  from 'supertest';
import {clone, pick}          from 'lodash';

import {assert, expect} from 'chai';
import {Asso}  from '../../models/asso';

chai.use(chaiHttp);

module.exports = server => {
  describe('Asso',() =>{
    var rememberID_2;
    var assosBeforeUpdate = [];
    let assosToAdd = [
      { name: 'Some Asso',
        description: 'Some short asso description',
        url: 'https://goodle.co.uk',
        imageUrl: 'https://somesite.com/some-image.png'
      },
      { name: 'Another Asso',
        description: 'Some average length asso description'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah',
        url: 'https://goodle.co.uk',
        imageUrl: 'https://somesite.com/some-image.png'
      },
      { name: 'One More Asso',
        description: 'Some long asso description'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah blah blah'+
        ' blah blah blah blah blah blah blah blah',        url: 'https://goodle.co.uk',
        imageUrl: 'https://somesite.com/some-image.png'
      },
      { name: 'And then there is this one',
        description: 'Three words description',
        url: 'https://goodle.co.uk',
        imageUrl: 'https://somesite.com/some-image.png'
      }
    ];
    let path = '/api/asso/';
    Asso.remove({}, (err) => {if(err) console.log(err);});

    describe('Create routes', () => {
      it('Should create new asso', done => {
        chai
          .request(server)
          .post(path)
          .send(assosToAdd[0])
          .end((err, res) => {
            if(err) {
              console.log(err);
              return done(err);
            }
            expect(res).to.have.status(200);
            done();
          });
      });

      it('Should refuse asso with the same name', done => {
        chai
          .request(server)
          .post(path)
          .send(assosToAdd[0])
          .end((err, res) => {
            expect(res).to.have.status(400);
            done();
          });
      });

      it('Should refuse asso with wrong url fromat', done => {
        let badUrlAsso = clone(assosToAdd[1]);
        badUrlAsso.url = 'very very bad url';
        chai
          .request(server)
          .post(path)
          .send(badUrlAsso)
          .end((err, res) => {
            expect(res).to.have.status(400);
            done();
          });
      });

      it('Should refuse asso with missing parameters', done => {
        chai
          .request(server)
          .post(path)
          .send({ description: 'this shold not be accepted' })
          .end((err, res) => {
            expect(res).to.have.status(400);
            done();
          });
      });

      it('Should create new asso', done => {
        chai
          .request(server)
          .post(path)
          .send(assosToAdd[1])
          .end((err, res) => {
            if(err) {
              console.log(err);
              return done(err);
            }
            expect(res).to.have.status(200);
            done();
          });
      });

      it('Should create new asso', done => {
        chai
          .request(server)
          .post(path)
          .send(assosToAdd[2])
          .end((err, res) => {
            if(err) {
              console.log(err);
              return done(err);
            }
            expect(res).to.have.status(200);
            rememberID_2 = res.body._id;
            done();
          });
      });

      it('Should create new asso', done => {
        chai
          .request(server)
          .post(path)
          .send(assosToAdd[3])
          .end((err, res) => {
            if(err) {
              console.log(err);
              return done(err);
            }
            expect(res).to.have.status(200);
            done();
          });
      });
    });

    describe('Read routes', ()=> {
      it('should list all routes', done => {
        chai
          .request(server)
          .get(path)
          .end((err,res) => {
            expect(res).to.have.status(200);
            expect(res.body.asso).to.have.lengthOf(4);
            expect(res.body.asso[3].description).to.be.equal(assosToAdd[3].description);
            assosBeforeUpdate = res.body.asso;
            done();
          });
      });

      it('should return third asso by id', done => {
        chai
          .request(server)
          .get(path + rememberID_2)
          .end((err,res) => {
            expect(res).to.have.status(200);
            expect( pick(res.body.asso, ['name', 'description', 'url', 'imageUrl']) )
              .to.be.eql(assosToAdd[2]);
            done();
          });
      });

      it('should return 404 with non-objectId id parameter', done => {
        chai
          .request(server)
          .get(path + 'not-an-object-id')
          .end((err,res) => {
            expect(res).to.have.status(404);
            done();
          });
      });

      it('should return 404 with valid but non existant object id', done => {
        let id = mongoose.Types.ObjectId();
        chai
          .request(server)
          .get(path + id)
          .end((err,res) => {
            expect(res).to.have.status(404);
            done();
          });
      });
    });

    describe('Update routes', () => {
      var newAsso = {
        name: 'New And Improved',
        description: 'This new one is way better than the old one',
        url: 'https://google.co.uk',
        imageUrl: 'https://somesite.com/some-image.png'
      };
      var newAsso2 = {
        name: 'New And Improved (but not good enough)',
        description: 'This new one is way better than the old one',
        url: 'https://google.co.uk',
        imageUrl: 'https://somesite.com/some-image.png'
      };
      var newAsso_sameName = {
        name: 'New And Improved',
        description: 'This should not be accepted',
        url: 'https://google.co.uk',
        imageUrl: 'https://somesite.com/some-image.png'
      };
      var newAsso_badUrl = {
        name: 'Bad Url Asso',
        description: 'This should not be accepted',
        url: 'bad bad bad bad bad bad bad',
        imageUrl: 'https://somesite.com/some-image.png'
      };
      it('should update an asso', done => {
        chai
          .request(server)
          .patch(path + assosBeforeUpdate[3]._id)
          .send(newAsso)
          .end((err,res) => {
            expect(res).to.have.status(200);
            expect( pick(res.body.asso, ['name', 'description', 'url', 'imageUrl']) )
              .to.be.eql(newAsso);
            done();
          });
      });

      it('should not violate unique name rule', done => {
        chai
          .request(server)
          .patch(path + assosBeforeUpdate[2]._id)
          .send(newAsso_sameName)
          .end((err,res) => {
            expect(res).to.have.status(400);
            done();
          });
      });

      it('should refuse bad url', done => {
        chai
          .request(server)
          .patch(path + assosBeforeUpdate[1]._id)
          .send(newAsso_badUrl)
          .end((err,res) => {
            expect(res).to.have.status(400);
            done();
          });
      });

      it('should return 404 witn invalid id', done => {
        chai
          .request(server)
          .patch(path + 'we98y7w98y70w9e870w98e7')
          .send(newAsso2)
          .end((err,res) => {
            expect(res).to.have.status(404);
            done();
          });
      });

      it('should return 404 non existant id', done => {
        let id = mongoose.Types.ObjectId();
        chai
          .request(server)
          .patch(path + id)
          .send(newAsso2)
          .end((err,res) => {
            expect(res).to.have.status(404);
            done();
          });
      });

      it('should return 200 with no body', done => {
        chai
          .request(server)
          .patch(path + assosBeforeUpdate[0]._id)
          .end((err,res) => {
            if(err) console.log(err);
            expect(res).to.have.status(200);
            done();
          });
      });
    });

    describe('Delete routes', () => {
      it('should delete the first asso', done => {
        chai
          .request(server)
          .delete(path + assosBeforeUpdate[0]._id)
          .end((err,res) => {
            expect(res).to.have.status(200);
            chai
              .request(server)
              .get(path)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.asso).to.have.lengthOf(3);
                done();
              });
          });
      });

      it('should return 404 trying to delete the same document', done => {
        chai
          .request(server)
          .delete(path + assosBeforeUpdate[0]._id)
          .end((err,res) => {
            expect(res).to.have.status(404);
            done();
          });
      });

      it('should return 404 with invalid id', done => {
        chai
          .request(server)
          .delete(path + 'lalalalalalallalalalalalalalala')
          .end((err,res) => {
            expect(res).to.have.status(404);
            done();
          });
      });

      it('should return 404 non existant id', done => {
        let id = mongoose.Types.ObjectId();
        chai
          .request(server)
          .delete(path + id)
          .end((err,res) => {
            expect(res).to.have.status(404);
            done();
          });
      });

    });
  });
};
