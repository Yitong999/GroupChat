const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v4.2+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/4.2/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
			db.collection('chatrooms').find().toArray((err, result) => {
                resolve(result);
            })
		})
	)
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */

            if(typeof room_id === typeof ObjectID) {
				db.collection('chatrooms').findOne({_id: room_id}).then(result => {
					if(reject == null)
						resolve(null);
					else
						resolve(result);
				});
			} 
			else {
					db.collection('chatrooms').findOne({_id: room_id.toString()}).then(result => {
						if(result != null){
							resolve(result);
						}else if(room_id.length == 24){
							db.collection('chatrooms').findOne({_id: ObjectID(room_id.toString())}).then(result => {
								if(reject == null){
									resolve(null);
								}else{
									resolve(result);
								}
							});
						} else {
							resolve(null);
						}

					});
			}
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */

			if(room.name) {
				// add a new room into chatrooms array
				db.collection('chatrooms').insertOne(room).then((result) =>{
					db.collection('chatrooms').findOne({'_id': result['insertedId']}).then((result) =>{
						resolve(result);
					})
				});
			} else {
				reject(new Error("room is undefined"));
			}
		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */

			// //in case $before is not given
			if (before == undefined){
				before = Date.now();
				//before = before.toString().slice(7);
			}

			db.collection('conversations').find({'room_id': room_id}).toArray((err, conversations) =>{
				
				if(conversations.length > 0) {
					var latestCvst;						
					var timeInterval;		
					conversations.forEach((ea) => {
						if(ea.timestamp < before) { //find conversation before $before
							if(timeInterval) {
								if(before - ea.timestamp < timeInterval) {
									timeInterval = before - ea.timestamp;
									latestCvst = ea;											
								}
							} else {
								timeInterval = before - ea.timestamp;
								latestCvst = ea;
							} 
						} 
					})


					if(latestCvst == undefined){
						resolve(null);
					}else{
						resolve(latestCvst);
					}
				}else {
					resolve(null);
				}

			});
		})
	)
}



Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
			if (conversation.room_id == undefined){
				reject(new Error("conversation doesn't have room_id"));
			}else if (conversation.timestamp == undefined){
				reject(new Error("conversation doesn't have timestamp"));
			}else if (conversation.messages == undefined){
				reject(new Error("conversation doesn't have rmessagesoom_id"));
			}else{
				db.collection('conversations').insertOne(conversation).then(result => { 
					db.collection('conversations').findOne({'_id': result.insertedId}).then(result => {
						resolve(result);
					});
				});
			}
		})
	)
}

module.exports = Database;