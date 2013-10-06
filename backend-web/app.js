var express = require('express');
var request = require('request');
var alchemy = require('../alchemyapi');
var _ = require('underscore');
var config = require('../config/config');
var Gearman = require("node-gearman");

// Setup Connection to gearman
var gearmanServer = new Gearman(config.gearman.host, config.gearman.port);
gearmanServer.connect();

var app = express();

app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(express.cookieParser());
app.use(express.bodyParser());

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  res.render('home');
});

app.post('/', function(req, res) {
  var url = req.param('url');
  
  alchemy.text_clean('url', url, {}, function(error, response) {
    console.log(response.text.split("\n"));

    res.send("");
  });
});

app.listen(8000);
