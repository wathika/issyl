/*jslint node: true */
'use strict';

// Declare variables used
var	express, 
    app, 
	port, 
	shortid,
	base_url, 
	bodyParser, 
	client, 
	rtg;

// initializing the variables
express = require('express');
app = express();
port = process.env.PORT || 5000;
shortid = require('shortid');
bodyParser = require('body-parser');
// base_url = process.env.BASE_URL || 'http://localhost:5000';
base_url = process.env.BASE_URL || 'issyl.ml';

//creating a hack to make it work with heroku
// var REDISTOGO_URL = "redis://redistogo:7390cc2a89199620768b6d66904f5d0f@scat.redistogo.com:10389";
var REDISTOGO_URL = "redis://database:root@pub-redis-11415.us-east-1-2.2.ec2.garantiadata.com:11415";

// Set up connection to Redis
if (REDISTOGO_URL ) {
  rtg  = require("url").parse(REDISTOGO_URL);
  client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
  client = require('redis').createClient();
}

// Set up templating
app.set('views', __dirname + '/views');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

// Set URL
app.set('base_url', base_url);

// Handle POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Define index route
app.get('/', function (req, res) {
  res.render('index');
});

// Define submit route
app.post('/', function (req, res) {
    // Declare variables
    var url, id;

    // Get URL
    url = req.body.url;

    // Create a hashed short version
    id = shortid.generate();

    // Store them in Redis
    client.set(id, url, function () {
        // Display the response
        res.render('output', { id: id, base_url: base_url });
    });
});

// Define link route
app.route('/:id').all(function (req, res) {
    // Get ID and remove whitespaces
    var id = req.params.id.trim();

    // Look up the URL
    client.get(id, function (err, reply) {
        if (!err && reply) {
            // Redirect user to it
            res.status(301);
            res.set('Location', reply);
            res.send();
        } else {
            // Confirm no such link in database
            res.status(404);
            res.render('error');
        }
    });
});

// Serve static files
app.use(express.static(__dirname + '/static'));
//Serve CSS files
app.use(express.static(__dirname, '/css'));

// Listen
app.listen(port);
console.log('Listening on port ' + port);
