var FeedParser = require('feedparser');
var request = require('request');
var mongode = require('mongode');
var config = require('../config/config')

// go in config.js file?
var rss_feeds = [
    "http://rssfeeds.usatoday.com/UsatodaycomNation-TopStories",
    "http://feeds.reuters.com/Reuters/domesticNews?format=xml"
    // "http://rss.nytimes.com/services/xml/rss/nyt/US.xml",
    // "http://rss.cnn.com/rss/cnn_us.rss"
];

// add to mongodb
var mongoServer = mongode.connect(config.mongo.host);
console.log(mongoServer);
var collection = mongoServer.collection('source_articles');

// var rss_content = [];

for (var source in rss_feeds) {
  request(rss_feeds[source])
    .pipe(new FeedParser)
    .on('readable', function(){
      var stream = this, item;
      while (item = stream.read()) {
          // rss_content.push({
          //   title: item.title,
          //   date: item.date,
          //   guid: item.guid,
          //   description: item.description.slice(0, item.description.indexOf("<")), // strip img tag randomly appended
          //   source: getDomain(stream.meta.link)
          // });

          // generate article obj
          var article = {
            title: item.title,
            date: item.date,
            guid: item.guid,
            description: item.description.slice(0, item.description.indexOf("<")), // strip img tag randomly appended
            source: getDomain(stream.meta.link)
          };

          console.log(article);
          collection.insert(article, {safe:true}, function (err, objects){
                if (err) console.warn(err.message);
          })
          console.log('done');

      }
    });
}

// given url, extract domain
function getDomain(url) {
    var wwwIndex = url.indexOf("www.");
    url = url.slice(wwwIndex + 4);
    var endIndex = url.indexOf("."); // to catch .com or .[whatever]
    return url.slice(0, endIndex)
}


