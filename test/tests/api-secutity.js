import mongoose         from 'mongoose';
import request          from 'supertest';
import chai             from 'chai';
import chaiJsonEqual    from 'chai-json-equal';
import chaiHttp         from 'chai-http';
import supertest        from 'supertest';
import {assert, expect} from 'chai';

import {User} from '../../models/user';

chai.use(chaiHttp);
chai.use(chaiJsonEqual);

// USER LOG IN AND SESSION TEST
// using cookie for session testing
module.exports = server => {

// TODO: Separate admin and user signup routes

// Clear all test collections

// Create super-admin
// super admin can do anything and access everything

// Create admins
// Make sure only super-admin can register admins
// Admins have access to all customers and tutors, but not other admins

// Populate subjects and levels collections

// Create customers and tutors

// Try to access all api routes with valid request body as different users
// Each user can only edit their own information
// Admins can edit users and subjects/levels but not other admins
// Who can get customer.list and customer.read
// Who can get tutor.list and tutor.read

// Should admins be able to read everyone's messages?



};
