var express = require('express'),
  request = require('request'),
  alchemy = require('../alchemyapi');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  res.render('home');
});

app.post('/', function(req, res) {
  var url = req.param('url');
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      alchemy.relations('url', url, {}, function(error, response) {
        console.log(error, response);
        var data = {
          relations: response,
          text: body
        };
        res.send(data);
      });
    }
  });
});

app.listen(8000);
