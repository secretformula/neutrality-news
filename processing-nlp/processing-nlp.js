var natural = require('natural');
var classifier = new natural.BayesClassifier();
var _ = require('underscore')

var fs = require('fs');
var path = require('path');

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

var root = path.join(__dirname, 'database.mpqa.2.0');

var dirs = fs.readdirSync(path.join(root, 'docs'));

var dates = _.filter(dirs, function(str) {
  return str.match(/^[0-9]+$/)
});

console.log(dates);

var sources = [];
var annotations = [];

for (var i=0; i<dates.length; i++) {
  var sourceDir = fs.readdirSync(path.join(root, 'docs', dates[i]));

  for (var j=0; j<sourceDir.length; j++) {
    console.log(sourceDir[j]);
    if (!sourceDir[j] || !sourceDir[j].match(/^[0-9]{2}\.[0-9]{2}\.[0-9]{2}\-[0-9]+$/)) {
      continue;
    }
   
    console.log(path.join(root, 'docs', dates[i], sourceDir[j]));
    var source = fs.readFileSync(path.join(root, 'docs', dates[i], sourceDir[j]), { encoding: 'utf-8' });
    var annotation = fs.readFileSync(path.join(root, 'man_anns', dates[i], sourceDir[j], 'gateman.mpqa.lre.2.0'), { encoding: 'utf-8' });

    sources.push(source);
    annotations.push(annotation);
  }
}

// console.log(sources);

var keys = []
var vals = [];

for (var i=0; i<sources.length; i++) {
  var source = sources[i];
  var annotation = annotations[i];

  // console.log(annotation);

  var lines = annotation.split("\n");

  for (var j=0; j<lines.length; j++) {
    var line = lines[j];

    if (line[0] == "#") continue;

    if (line.indexOf("objectiv") == -1 && line.indexOf("subjectiv") == -1) continue;

    var sections = line.split("\t");

    var range = sections[1].split(",");
    
    var chars = source.slice(range[0], range[1]);

    if (chars.length == 0) continue;

    console.log(chars);

    keys.push(chars);
    
    if (sections[3].indexOf("GATE_direct-subjective")) {
      if (!line.match(/intensity=\"(low|neutral)\"/) && !line.match(/insubstantial/)) {
        vals.push("subjective");
      } else {
        vals.push("objective");
      }
    } else if (sections[3].indexOf("GATE_expressive-subjectivity")) {
      if (!line.match(/intensity=\"(low)\"/)) {
        vals.push("subjective");
      } else {
        vals.push("objective");
      }
    } else {
      vals.push("objective");
    }
  }
}

console.log(keys.length, vals.length);

classify(keys, vals);
