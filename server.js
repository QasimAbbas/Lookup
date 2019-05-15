/**
 * Created by yehyaawad on 3/5/16.
 */

var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var request = require('request');

//setup the root path
var root = __dirname;

var app = express();
app.use(bodyParser.json({limit: "50mb"}));

app.use(bodyParser.urlencoded({
  extended: true,
  limit: "50mb"
}));

app.get('/', function (req, res) {
  fs.readFile('index.html', 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    res.send(data);
  });
});

app.get('/client.js', function (req, res) {
  fs.readFile('client.js', 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    res.send(data);
  });
});

var getPersonCounter = 0;

app.post('/getPerson', function(req, res) {
  uploadToImgur(req.body.img, "brickhacks", function (link) {
    projectOxford.detect(link, function (body) {
      if (body.length > 0) {
        projectOxford.identify(body[0].faceId, function (body) {
          if (body !== null) {
            if (body[0] !== null) {
              if (body[0].candidates.length > 0) {
                projectOxford.getPerson(body[0].candidates[0].personId, function (body) {
                  res.send({"name":body.name, "Likes": body.userData});
                })
              }
            }
          }
        })
      } else {
        res.send({"name":"Searching...", "Likes": ""});
      }
    });
  });
});

app.get('/train', function (req, res) {
  projectOxford.train();
});

app.use('/node_modules', express.static('node_modules'));
app.use('/bower_components', express.static('bower_components'));

app.listen(3000 || 'localhost',function() {
    console.log('Application worker ' + process.pid + ' started...');
  }
);

// Project Oxford

function makeid()
{
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";

  for( var i=0; i < 8; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

var AUTHORIZATION_IMGUR = 'Client-ID 5905cd5d81b6fc5';
var GROUP_ID = "secondmode";

var uploadToImgur = function(base64Data, name, callback) {
  request({
      url: "https://api.imgur.com/3/image",
      method: "POST",
      json: true,
      headers: {
        'Authorization': AUTHORIZATION_IMGUR
      },
      body: {
        image: base64Data,
        title: name
      }
    }, function (error, resp, body) {
      callback(body.data.link);
    }
  );
};

var projectOxford = {
  BASE_URL: 'https://api.projectoxford.ai/face/v1.0/',
  KEY: '',
  PERSON_GROUP_ID: null,
  _lastPersonId: null,
  // detects who the person is
  detect: function(url, callback) {
    var data = {url: url};
    request({
        url: "https://api.projectoxford.ai/face/v1.0/detect",
        method: "POST",
        json: true,
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.KEY
        },
        body: data
      }, function (error, resp, body) {
        callback(body);
      }
    );
  },
  getPerson: function(personId, callback) {
    request({
        url: "https://api.projectoxford.ai/face/v1.0/persongroups/"+GROUP_ID+'/persons/'+personId,
        method: "GET",
        json: true,
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.KEY
        },
        body: {}
      }, function (error, resp, body) {
        if (!error) {
          callback(body);
        } else {
          console.log(error);
        }
      }
    );
  },
  identify: function (faceId, callback) {
    request({
        url: "https://api.projectoxford.ai/face/v1.0/identify",
        method: "POST",
        json: true,
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.KEY
        },
        body: {
          "personGroupId": GROUP_ID,
          "faceIds":[faceId],
          "maxNumOfCandidatesReturned": 1
        }
      }, function (error, resp, body) {
        if (!error && resp.statusCode == 200) {
          callback(body);
        } else {
          console.log(error);
        }
      }
    );
  },
  train: function (callback) {
    request({
        url: 'https://api.projectoxford.ai/face/v1.0/persongroups/'+GROUP_ID+'/train',
        method: "POST",
        json: true,
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.KEY
        },
        body: {}
      }, function (error, resp, body) {
        if (!error && resp.statusCode == 200) {
          callback(body);
        } else {
          console.log(error);
        }
      }
    );
  },
  getTrainingStatus: function(imgUrl, callback) {
    var data = {url: imgUrl};
    $.ajax({
      url: 'https://api.projectoxford.ai/face/v1.0/persongroups/'+GROUP_ID+'/training',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.KEY
      },
      type: 'POST'
    }).done(function(data) {
      callback(data);
      log('addPersonFace success');
    }).fail(function(err) {
      log('addPersonFace error');
      log(err);
    });
  }
};

