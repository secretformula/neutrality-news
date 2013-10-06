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
  var url1 = req.param('url1'),
      url2 = req.param('url2');
  
  console.log(url1, url2);

  alchemy.concepts('url', url1, {}, function(error, response1) {
    alchemy.concepts('url', url2, {}, function(error, response2) {
      var keys1 = _.pluck(response1['concepts'], 'text'),
          keys2 = _.pluck(response2['concepts'], 'text'),
          shared = _.intersection(keys1, keys2),
          totalLength = keys1.length + keys2.length - shared.length,
          percent = shared.length / totalLength;

      console.log(keys1);
      console.log(keys2);

      console.log(shared, percent);

      var data = {
        url1: response1,
        url2: response2,
        matchPercent: percent
      };

      res.send(data);
    });
  });
});

app.listen(8000);
