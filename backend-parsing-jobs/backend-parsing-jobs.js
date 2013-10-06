var config = require('../config/config');
var alchemy = require('../alchemyapi');
var Gearman = require("node-gearman");
var _ = require('underscore');
var request = require('request');
var mongode = require('mongode');

// Setup Connection to gearman
var gearmanServer = new Gearman(config.gearman.host, config.gearman.port);
gearmanServer.connect();

// var mongoServer = mongode.connect(config.mongo.host);
// console.log(mongoServer);

gearmanServer.registerWorker('parse-url-sentence', function(payload, worker) {
  if (!payload) {
    worker.error();
    return;
  }
  payload = JSON.parse(payload.toString("utf-8"));

  alchemy.text_clean('url', payload.url, {}, function(error, response) {
    worker.end(response.text.split("\n"));
    console.log(response.text.split("\n"));
  });
});

gearmanServer.registerWorker('store-article-concepts', function(payload, worker) {
  if (!payload) {
    worker.error();
    return;
  }
  payload = JSON.parse(payload.toString("utf-8"));

  alchemy.concepts('url', url, {}, function(error, response) {
    if (error) {
      worker.error();
      return;
    }

    var concepts = _.pluck(response['concepts'], 'text');
    
    var collection = mongoServer.collection('source_articles');

    collection.findAndModify({
      query: { url: url },
      update: { concepts: concepts },
      upsert: true
    }, function() {
      console.log("findAndModify", arguments);
    });

  });
});

gearmanServer.registerWorker('compile-article', function(payload, worker) {
  
});

