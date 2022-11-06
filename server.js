const cpen322 = require('./cpen322-tester.js');
WebSocket = require('ws');
const broker = new WebSocket.Server({port: 8000});
broker.on('connection', function connection(user){
	user.on('message', function loading(text){
		var parsed_message = JSON.parse(text);
		console.log(parsed_message);

		broker.clients.forEach(function each(client){
			if(client !== user && client.readyState === WebSocket.OPEN) {//client not the user
				client.send(JSON.stringify(parsed_message));
			}
		});
		
		var message_id = parsed_message.roomId.toString();
		var message_username = parsed_message.username;
		var message_text = parsed_message.text;
		messages[message_id].push({username: message_username, text: message_text});
	})
})



const path = require('path');
const fs = require('fs');
const express = require('express');

var roomId = 30; //global roomId => for generating unique id
var id;


var chatrooms = [];
chatrooms.push({id:"10",name:"room_10",image:"assets/canucks.png"});
chatrooms.push({id:"11",name:"room_11",image:"assets/canucks.png"});
var messages = {};
for (var i = 0; i < chatrooms.length; i++){
	messages[chatrooms[i].id] = new Array();
}






function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

app.get('/chat', function(req, res){
	var response = [];
	for (var i = 0; i < chatrooms.length; i++){
		var room = {
			'id': chatrooms[i].id,
			'name': chatrooms[i].name,
			'image': chatrooms[i].image,
			'messages': messages[chatrooms[i].id]
		}
		console.log(room);
		response.push(room);
	}
	res.status(200);
	res.send(response);
});
app.post('/chat', function(req, res){
	var data = req.body;
	
	if (req == null){
		res.status(400);
	}else if(data === undefined){
		res.status(400);
		res.send("ERROR 111: " + data);
	}else if(data.name === undefined)
	{
		res.status(400);
		res.send("ERROR 222: " + data.name);
	}else{
		//roomId++;
		//var id = roomId;
		messages[roomId.toString()] = new Array();
		var room = {
			id: roomId.toString(),
			name: data.name,
			image: data.image,
			messages: messages[(roomId++).toString()].toString
		};
		chatrooms.push(room);
		
		res.status(200);
		res.send(JSON.stringify(room));
	}
})




// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});




cpen322.connect('http://52.43.220.29/cpen322/test-a3-server.js');
cpen322.export(__filename, {
		app,
		chatrooms,
		messages,
		broker,
	});