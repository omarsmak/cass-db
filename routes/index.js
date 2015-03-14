'use strict'


var express = require('express');
var router = express.Router();
var cassandra = require('cassandra-driver');
var crypto = require('crypto');
var clients={};



//For main API


	

router.post('/api/connect', function(req, res, next) {

	// This info will be entered by the user.
	var dbAddress = req.body.address;//'192.168.1.7';
	var dbUser = req.body.username;//'cassandra';
	var dbPass = req.body.password;//'cassandra';

	// in each API request we return a result object contain status, data, error


	//generrate a unique clinet id which also can be used as an API key
	var CUA = crypto.createHash('md5').update(dbAddress+dbUser+dbPass).digest('hex');

	clients[CUA] = new cassandra.Client({contactPoints: [dbAddress], authProvider: new cassandra.auth.PlainTextAuthProvider(dbUser,dbPass)});
	clients[CUA].connect(function (err) {
 		if(err){
			res.status(400).send({
				message: 'Could not connect to server',
				details: err
			});
		}
		else{
			res.send({
				apiKey : CUA
			});
		} 		
	});
});

router.post('/api/execute_cql', function(req, res) {

	// use get to obtain it;
	var CUA = req.query.apiKey;
	var query = req.body.query;
	//var query = 'select * from system.schema_keyspaces';
	clients[CUA].execute(query, [], function(err, data) {
 		if(err){
			res.status(400).send({
				message: 'Could not execute query',
				details: err
			});
		}
		else{
			res.send({
				results: data
			});
		} 	
	});

 	
});

router.get('*', function(req, res) {
	res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

module.exports = router;

