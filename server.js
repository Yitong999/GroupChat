const cpen322 = require('./cpen322-tester.js');
const Database = require('./Database.js');
const SessionManager = require('./SessionManager.js');
const crypto = require('crypto');
var db = new Database(
	'mongodb://localhost:27017',
	'cpen322-messenger'
)

var messageBlockSize = 10;
var messages = {};
var sessionManager = new SessionManager();

ws = require('ws');
const broker = new ws.Server({port: 8000});
broker.on('connection', function connection(user, request){

	var cookie_list = request.headers.cookie;
	if (cookie_list == null || cookie_list == undefined){
		user.close();
	}else{

		// console.log('***$$$cookie_list is: ' + cookie_list);
		cookie_list = cookie_list.split('; ');
		var cookie;
		var cookie_found = false;
		for (var i = 0; i < cookie_list.length; i++){
			// console.log('***$$$each is: ' + cookie_list[i]);
			
			if (cookie_list[i].indexOf('cpen322-session=') != -1){ //required cookie is found
				if (sessionManager.tokenIsValid(cookie_list[i].substring(16))){ //cookie is mapped correctly
					cookie = cookie_list[i].substring(16);
					cookie_found = true;
					break;
				} 
			}
		}

		if (cookie_found == false){
			user.close();
		}
	}
	

	user.on('message', function loading(text){
		var parsed_message = JSON.parse(text);
		console.log(parsed_message);

		var message_id = parsed_message.roomId.toString();
		// var message_username = parsed_message.username;

		var message_username = sessionManager.getUsername(cookie);
		console.log('***^^user name is: ' + message_username);

		var message_text = parsed_message.text;
		// var message_text = parsed_message.text.replace(/</g, "");
		// var message_text = parsed_message.text.replace(/>/g, "");
		message_text = sanitize(message_text);

		var new_message = {
			username: message_username,
			text: message_text
		}
		messages[message_id].push(new_message);


		broker.clients.forEach(function each(client){
			if(client !== user && client.readyState === ws.OPEN) {//client not the user
				client.send(JSON.stringify(new_message));
			}
		});
		
		

		if (messages[message_id].length == messageBlockSize){
			var convst = {
				'room_id': message_id,
				'timestamp': Date.now(),
				'messages': messages[message_id]
			}

			db.addConversation(convst).then(result => {
				messages[message_id] = [];
			})
		}

	})
})



const path = require('path');
const fs = require('fs');
const express = require('express');
const { response } = require('express');
const e = require('express');
const { request } = require('http');

var roomId = 30; //global roomId => for generating unique id
var id;


// var chatrooms = [];
// chatrooms.push({id:"10",name:"room_10",image:"assets/canucks.png"});
// chatrooms.push({id:"11",name:"room_11",image:"assets/canucks.png"});
var messages = {};

db.getRooms().then((result) => {
	result.forEach((room) => {
		messages[room._id] = new Array();
	})
})
// for (var i = 0; i < chatrooms.length; i++){
// 	messages[chatrooms[i].id] = new Array();
// }






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

app.use(middlewareErrorHandler);

app.use('/login', express.static("./client/login.html"));
app.use('/app.js',sessionManager.middleware, middlewareErrorHandler, express.static(clientApp + '/app.js'));
app.use('/index.html',sessionManager.middleware, middlewareErrorHandler, express.static(clientApp + '/index.html'));
app.use('/index',sessionManager.middleware, middlewareErrorHandler, express.static(clientApp + '/index.html'));
app.use('/+',sessionManager.middleware, middlewareErrorHandler, express.static(clientApp + '/index.html'));





app.post('/login', function(req, res){
	if (req == null){
		res.status(400).send('client error');
	}else if(req.body.username == undefined){
		console.log('***username is undefined in login POST');
		res.status(400).send('client error');
	}else
	{
		var username = req.body.username;
		var password = req.body.password;

		db.getUser(username).then(result => {
			if (result){
				if (isCorrectPassword(password, result.password)){
					sessionManager.createSession(res, username, 2000000);
					res.status(200).redirect('/');
				}else{
					res.status(200).redirect('/login');
				}
			}else{ //user is not find
				console.log('user not found');
				res.status(200).redirect('/login');
			}
		})

	}
	
})


app.get('/chat', sessionManager.middleware, middlewareErrorHandler, function(req, res){
	// var response = [];
	// for (var i = 0; i < chatrooms.length; i++){
	// 	var room = {
	// 		'id': chatrooms[i].id,
	// 		'name': chatrooms[i].name,
	// 		'image': chatrooms[i].image,
	// 		'messages': messages[chatrooms[i].id]
	// 	}
	// 	console.log(room);
	// 	response.push(room);
	// }
	// res.status(200);
	// res.send(response);
	db.getRooms().then((result) => {
		result.forEach(room => {
			room.messages = messages[room._id];
		});

		res.status(200).json(result);
	})
});


app.post('/chat', sessionManager.middleware, middlewareErrorHandler, function(req, res){
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
		//messages[roomId.toString()] = new Array();
		// var room = {
		// 	id: roomId.toString(),
		// 	name: data.name,
		// 	image: data.image,
		// 	messages: messages[(roomId++).toString()].toString
		// };
		// chatrooms.push(room);

		db.addRoom(data).then(result => {
			if (result){
				messages[result._id] = [];
				res.status(200);
				res.send(result);
			}else{
				res.status(400);
				res.send("fail in addRoom");
			}
		})
		
		// res.status(200);
		// res.send(JSON.stringify(room));
	}
});

app.get('/chat/:room_id', sessionManager.middleware, middlewareErrorHandler, function(req, res){
	//if room found
	db.getRoom(req.params.room_id).then(result => {
		if (result){
			console.log('$#$#room is: ' + result);
			res.status(200);
			res.send(result);
		}else{
			res.status(404);
			res.send('Room ' + req.params.room_id + ' was not found');
		}
	})
});

app.get('/chat/:room_id/messages', sessionManager.middleware, middlewareErrorHandler, function(req, res){
	var roomId = req.params.room_id;
	var before = req.url.split('?')[1]; //eg: get 1604188800000 from /chat/room-1/messages?before=1604188800000

	//$before is not given
	if (before == undefined){
		db.getLastConversation(roomId).then(result => {
			res.status(200);
			res.send(result);
		});
	}else{
		before = before.slice(7);
		db.getLastConversation(roomId, before).then(result => {
			res.status(200);
			res.send(result);
		})
	}
});


app.get('/profile',sessionManager.middleware,middlewareErrorHandler, function(req, res) {
	res.send({'username' : req.username});
});


app.get('/logout', sessionManager.middleware, function(req, res) {
	sessionManager.deleteSession(req);
	res.status(200).redirect('/login');
});





// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});



function isCorrectPassword(password, saltedHash){
	var salt = saltedHash.slice(0,20);
	var hash_of_salted = saltedHash.slice(20);
	var salted_Password = password + salt;
	var userHash = crypto.createHash('sha256').update(salted_Password).digest('base64');

	if(hash_of_salted == userHash){
		return true;
	}else{
		return false;
	}
}


function middlewareErrorHandler(err, req, res, next){
	if (err instanceof SessionManager.Error){
		if (req.headers.accept == 'application/json'){
			res.status(401).send('err is middleware 401: ' + err);
		}else{
			res.redirect('/login');
		}
	}else{
		res.status(500).send('err is middleware 500' + err);
	}
}

//copy from https://stackoverflow.com/questions/2794137/sanitizing-user-input-before-adding-it-to-the-dom-in-javascript/48226843#48226843
function sanitize(string) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
	};
	
	const reg = /[&<>]/ig;
	return string.replace(reg, (match)=>(map[match]));
}



cpen322.connect('http://52.43.220.29/cpen322/test-a5-server.js');
cpen322.export(__filename, {
		app,
		//chatrooms,
		messages,
		broker,
		db,
		messageBlockSize,
		sessionManager,
		isCorrectPassword
	});