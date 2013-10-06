var config = require('../config/config');
var connect = require('connect');
var express = require('express');
var Gearman = require("node-gearman");
var mongode = require('mongode');

// Setup Connection to gearman
var gearmanServer = new Gearman(config.gearman.host, config.gearman.port);
gearmanServer.connect();

// Connect to mongodb
var dbServer = mongode.connect(config.mongo.host);
var compiledArticles = dbServer.collection('compiled_articles');

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
  compiledArticles.find().toArray(function(err, items) {
    res.render('index.jade', { articles: items });
  });
});

app.post('/', function(req, res) {
  var url = req.body.url;
  console.log(url);

  gearmanServer.submitJob('parse-url-sentence', JSON.stringify({url: url})).on('data', function(data) {
    console.log("first job done", JSON.stringify(data.toString('utf-8')));
    gearmanServer.submitJob('compile-article', JSON.stringify(data));
  });

  res.send(url);
});

app.listen(3000);
