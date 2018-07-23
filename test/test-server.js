import server from '../server';

import mongoose         from 'mongoose';
import request          from 'supertest';
import chai             from 'chai';
import chaiJsonEqual    from 'chai-json-equal';
import chaiHttp         from 'chai-http';
import supertest        from 'supertest';
import {assert, expect} from 'chai';

import {User} from '../models/user';
import {Addresses} from './tests/dummyData/users';

chai.use(chaiHttp);
chai.use(chaiJsonEqual);

global.cookie;
// get geolocations
// describe('get locations', () => {
//   let addLocations = [];
//   Addresses.forEach(address => {
//     console.log(address);
//     it(`should get locaton for ${address}`, done => {
//       chai
//       .request(`https://maps.googleapis.com/`)
//       .get(`/maps/api/geocode/json?key=AIzaSyC6uh_nAjL6p1UCqwpCZ58PHrmBZ68ATAs&address=${address}`)
//       .end((err,res) => {
//         expect(res).to.have.status(200);
//         let jsonRes = {
//             address_components: res.body.results[0].address_components,
//             description: res.body.results[0].formatted_address,
//             lat: res.body.results[0].geometry.location.lat,
//             lng: res.body.results[0].geometry.location.lng
//         }
//         addLocations.push(jsonRes);
//         done();
//       });
//     });
//
//   });
//   it('should save json string', done =>{
//     console.log(JSON.stringify(addLocation));
//     done();
//   });
// });
//
// // Admins
require('./tests/admin')(server);
//
// // Subjects
require('./tests/subjects')(server);
//
// // Levels
require('./tests/levels')(server);
//
// // Tutors
require('./tests/tutors')(server);
//
// // Tutors search test
require('./tests/tutor-search')(server);
//
// // Customers
require('./tests/customers')(server);
//
// // Children
require('./tests/children')(server);
//
// // Messages
require('./tests/tutors-messaging')(server);
//
// // Courses
require('./tests/course-test')(server);

// Test asso
require('./tests/asso')(server);


// Customers


// Advanced security check


// Messaging
require('./tests/messaging')(server);


// // Test user routes
require('./tests/api-user-routes')(server);

//
//

// Test location search
// require('./tests/search')(server);

// Test users
// require('./tests/users')(server);
