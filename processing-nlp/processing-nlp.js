var natural = require('natural');
var classifier = new natural.BayesClassifier();
var _ = require('underscore')

function classify(words, values) {
  _.each(words, function(elem, index) {
    classifier.addDocument(words[index], values[index]);
  });
  classifier.train();
  classifier.save('objectivness-classifier.json', function(err) {
    if(err) {
      return;
    }
  });
}
