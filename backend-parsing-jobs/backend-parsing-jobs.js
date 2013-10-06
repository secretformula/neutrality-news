var config = require('../config/config');
var alchemy = require('../alchemyapi');
var Gearman = require("node-gearman");
var _ = require('underscore');
var request = require('request');
var mongode = require('mongode');
var natural = require('natural');
var fs = require('fs');
var path = require('path');

// Setup Connection to gearman
var gearmanServer = new Gearman(config.gearman.host, config.gearman.port);
gearmanServer.connect();

var mongoServer = mongode.connect(config.mongo.host);

var classifierDump = fs.readFileSync(path.join(__dirname, '..', 'processing-nlp', 'objectiveness-classifier.json'));
var classifier = natural.BayesClassifier.restore(JSON.parse(classifierDump));


gearmanServer.registerWorker('create-article', function(payload, worker) {
  if (!payload) {
    worker.error();
    return;
  }
  payload = JSON.parse(payload.toString("utf-8"));

  var collection = mongoServer.collection('source_articles');
  alchemy.text_title('url', payload.url, {}, function(error, response) {
    if (error) {
      worker.error();
      return;
    }
    
    var article = {
      title: response.title,
      url: payload.url,
      created_at: new Date()
    }

    collection.insert(article, {safe:true}, function (err, objects){
      if (err) console.warn(err.message);

      worker.end();
    });
  });
});

// input: url
// return: hash with url, data (array of strings)
gearmanServer.registerWorker('parse-url-sentence', function(payload, worker) {
  if (!payload) {
    worker.error();
    return;
  }
  payload = JSON.parse(payload.toString("utf-8"));

  alchemy.text_clean('url', payload.url, {}, function(error, response) {
    var data = {
      url: payload.url,
      data: response.text.split("\n")
    }
    worker.end(JSON.stringify(data));
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

// expects input:
// {
//   url: string
//   data: [array of strings]
// }
gearmanServer.registerWorker('compile-article', function(payload, worker) {
  if (!payload) {
    worker.error();
    return;
  }
  console.log(payload.toString("utf-8"));
  payload = JSON.parse(payload.toString("utf-8"));

  var url = payload.url;
  var data = payload.data;

  console.log(payload);

  var classifications = [];

  for (var i=0; i<data.length; i++) {
    var line = data[i];

    var classified = classifier.classify(line);

    if (classified == 'objective') {
      classifications.push(line);
    }
  }

  var text = classifications.join("\n\n");

  var collection = mongoServer.collection('compiled_articles');

  collection.findAndModify({
    query: { url: url },
    update: { compiled_text: text },
    upsert: true
  }, function() {
    console.log("findAndModify", arguments);
  });

  worker.end();
});
