var alchemy = require('../alchemyapi');
var config = require('../config/config');
var Gearman = require("node-gearman");

// Setup Connection to gearman
var gearmanServer = new Gearman(config.gearman.host, config.gearman.port);
gearmanServer.connect();

gearmanServer.registerWorker('parse-url-sentence', function(payload, worker){
    if(!payload){
        worker.error();
        return;
    }
    payload = JSON.parse(payload.toString("utf-8"));
    
    alchemy.text_clean('url', payload.url, {}, function(error, response) {
      worker.end(response.text.split("\n"));
      console.log(response.text.split("\n"));
    });
});
