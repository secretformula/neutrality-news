var config = require('../config/config');
var connect = require('connect');
var express = require('express');
var Gearman = require("node-gearman");

// Setup Connection to gearman
/*
var gearmanServer = new Gearman(config.gearman.host, config.gearman.port);
gearmanServer.connect();
*/

var PATH_TO_PUBLIC = __dirname + '/public';

// Setup Express server
var app = express();

app.use(connect.compress());
app.use(express.static(PATH_TO_PUBLIC));
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(app.router);

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// Implimentation of the router is below
app.get('/', function(req, res) {
	res.render('index.jade');
});

app.listen(3000);
