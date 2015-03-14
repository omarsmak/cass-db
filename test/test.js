'use strict';

//************************ Change these values to match your server settings ****************/
var databaseUrl = "localhost";
var databaseUsername = "cassandra";
var databasePassword = "cassandra";
//*******************************************************************************************/

var myApp = require('../app');
var should = require('chai').should();
var request = require('supertest')(myApp);


describe('general request', function () {
    it('return the homepage', function (done) {
        request
            .get('/')
            .expect(200, 'The homepage is loaded', done());
    });
});


describe('cassdb API', function () {

    describe('POST /api/connect', function (done) {

        it('should connect to the database and return an API Key', function (done) {
            var databaseuser = {
                address: databaseUrl,
                username: databaseUsername,
                password: databasePassword
            };

            request
                .post('/api/connect')
                .set('Content-Type', 'application/json')
                .send(databaseuser)
                .expect(200, function (err, res) {
                    res.body.should.have.property('apiKey');
                    done();
                });
        });

    });

    describe('POST /api/execute_cql', function (done) {

        it('should execute a CQL query and return 200 if the query was correct', function (done) {
            var databaseuser = {
                address: databaseUrl,
                username: databaseUsername,
                password: databasePassword
            };

            request
                .post('/api/connect')
                .set('Content-Type', 'application/json')
                .send(databaseuser)
                .expect(200, function (err, res) {
                    var apiKey = res.body.apiKey;
                    var cqlRequest = "select * from system.schema_columns";
                    request
                        .post('/api/execute_cql?apiKey=' + apiKey)
                        .set('Content-Type', 'application/json')
                        .send({query: cqlRequest})
                        .expect(200, done);
                });
        });

        it('should execute a CQL query and return 400 if the query was wrong', function (done) {
            var databaseuser = {
                address: databaseUrl,
                username: databaseUsername,
                password: databasePassword
            };

            request
                .post('/api/connect')
                .set('Content-Type', 'application/json')
                .send(databaseuser)
                .expect(200, function (err, res) {
                    var apiKey = res.body.apiKey;
                    var cqlRequest = "select * from schema_column";
                    request
                        .post('/api/execute_cql?apiKey=' + apiKey)
                        .set('Content-Type', 'application/json')
                        .send({query: cqlRequest})
                        .expect(400, done);
                });

        });

    });
});
