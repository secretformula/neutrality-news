var config = require('../config/config');
var alchemy = require('../alchemyapi');
var Gearman = require("node-gearman");
var _ = require('underscore');
var request = require('request');
var mongode = require('mongode');

// Setup Connection to gearman
var gearmanServer = new Gearman(config.gearman.host, config.gearman.port);
gearmanServer.connect();

var dbServer = mongode.connect(config.mongo.host);
var sourceArticles = dbServer.collection('source_articles');

sourceArticles.find({sentences: {$exists: false}}).toArray(function(err, items) {
  if(err) {
    // TODO: ANything
  }
  _.each(items, function(elem) {
    gearmanServer.submitJob('parse-url-sentence', JSON.stringify({url: elem.url})).on('data', function(data) {
      gearmanServer.submitJob('compile-article', JSON.stringify(data));
    });
  });
});
