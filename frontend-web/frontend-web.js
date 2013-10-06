var config = require('../config/config');
var connect = require('connect');
var express = require('express');
var Gearman = require("node-gearman");
var mongode = require('mongode');
var _ = require('underscore');

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
    var new_items = _.map(items, function(item) {
      if (!item.compiled_text) return item;
      item.compiled_text = item.compiled_text.replace(/\n/gm, "<br/>");
      if (item.percent) {
        item.percent = ((1 - item.percent) * 100).toFixed(2);
      }
      return item;
     });
    res.render('index.jade', { articles: items });
  });
});

app.post('/', function(req, res) {
  var url = req.body.url;
  console.log(url);

  gearmanServer.submitJob('create-article', JSON.stringify({url: url})).on('data', function(data) {
    console.log("created article", data.toString('utf-8'));
    data = JSON.parse(data.toString('utf-8'));
    gearmanServer.submitJob('parse-url-sentence', JSON.stringify({url: url, title: data.title})).on('data', function(data) {
      data = data.toString('utf-8');
      console.log("first job done", data);
      gearmanServer.submitJob('compile-article', data);
    });
  });

  //res.send(url);
  res.redirect('/');
});

app.listen(3000);
