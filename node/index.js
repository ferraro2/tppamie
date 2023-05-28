//simple http server for testing

// var http = require('http');
// http.createServer(function (req, res) {
  // res.writeHead(200, {'Content-Type': 'text/plain'});
  // res.end('Hello Apache!\n');
// }).listen(8000, '127.0.0.1');


//npm installs: express, socket.io
//npm install --save <name>

var fs = require('fs');
var http = require('http');
// var https = require('https');

// var subdomain = require('express-subdomain');
var express = require('express');
var app = express();
// var router = express.Router();
// app.use(subdomain('ws', router));

// var privateKey = fs.readFileSync('/etc/apache2/ssl/tppvisuals.key');//.toString();
// var certificate = fs.readFileSync('/etc/apache2/ssl/tppvisuals.cert');//.toString();
// var options = {key: privateKey, cert: certificate};


// var server = https.createServer(options, app);
var server = http.createServer(app);
var io = require('socket.io')(server);

var version = '(1.1)'
var adminCode = fs.readFileSync('../auth_socketIO');//.toString();
var currMatchSpec = null
var currLiveBetsData = {}

var socketHandler = function(socket) {
	
	var client_ip_address = socket.request.connection.remoteAddress;
	console.log('new connection from ' + client_ip_address);
	socket.emit('connect');

	socket.on(adminCode + ': visualizer', function (eventOut, data) {
		switch (eventOut) {
			case 'live match spec':				
				currMatchSpec = data;
				console.log("match spec: " + data);
				break;
			case 'load blank match':
				currMatchSpec = null
				console.log("load blank match");
				break;
			case 'live bets updates':
				data.forEach( function(update) {
					currLiveBetsData[update.type] = update.payload;
				});
				break;
		}
		console.log(data);
		socket.broadcast.emit(eventOut + version, data);
	});
  
	socket.on('visualizer initialize request' + version, function() {
		console.log("received initialization request");
		if ( currMatchSpec ) {
			console.log("returning live match spec");
			socket.emit('live match spec' + version, currMatchSpec);
		} else {
			console.log("returning load blank match");
			socket.emit('load blank match' + version);
		}
		// emit all stored live bets updates
		currLiveBetsUpdates = []
		Object.keys(currLiveBetsData).forEach( function(updateType) {
			currLiveBetsUpdates.push( {
				"type": updateType, 
				"payload": currLiveBetsData[updateType] } );
		});
		socket.emit('live bets updates' + version, currLiveBetsUpdates);
	});
}

io.on('connection', socketHandler);

server.listen(8000, function() {
	console.log('server running on port %s', 8000);
});

/**/