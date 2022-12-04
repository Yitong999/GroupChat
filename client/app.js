const defaultImg = "assets/everyone-icon.png";
const profile = {username: "unsigned"}
var roomId = 0;

var Service = {
    origin: window.location.origin,
    getAllRooms: function(){
        var xhrRequest = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhrRequest.open("GET", this.origin + '/chat');
            xhrRequest.onload = function(){
                if (xhrRequest.status == 200){
                    resolve(JSON.parse(xhrRequest.response));
                }else{
                    reject(new Error(xhrRequest.responseText));
                }
            }
            xhrRequest.ontimeout = function() {
                reject((new Error(xhrRequest.status)));
            }
            xhrRequest.onerror = function() {
                reject((new Error(xhrRequest.status)));
            };  
            
            xhrRequest.timeout = 500;
            xhrRequest.send();
        });
    },
    addRoom: function(data){
        var xhrRequest = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhrRequest.open("POST", this.origin + '/chat');
            xhrRequest.setRequestHeader('Content-Type', 'application/json');
            xhrRequest.onload = function(){
                if (xhrRequest.status == 200){
                    resolve(JSON.parse(xhrRequest.response));
                }else{
                    reject(new Error(xhrRequest.responseText));
                }
            }
            xhrRequest.ontimeout = function() {
                reject((new Error(xhrRequest.status)));
            }
            xhrRequest.onerror = function() {
                reject((new Error(xhrRequest.status)));
            };
            xhrRequest.send(JSON.stringify(data));
            xhrRequest.timeout = 500;
            
        });
    },
    getLastConversation: function(roomId, before){
        var xhrRequest = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhrRequest.open("GET", this.origin + "/chat/" + roomId + "/messages?before=" + before);
            xhrRequest.onload = function(){
                if (xhrRequest.status==200) {
                    resolve(JSON.parse(xhrRequest.response));
                } else {	
                    reject((new Error(xhrRequest.responseText)));
                }
            }
            xhrRequest.ontimeout = function() {
                reject((new Error(xhrRequest.status)));
            }
            xhrRequest.onerror = function() {
                reject((new Error(xhrRequest.status)));
            };  
            
            xhrRequest.timeout = 500;
            xhrRequest.send();
        });
    },
    getProfile: function(){
        var xhrRequest = new XMLHttpRequest();
        return new Promise((resolve, reject) => {
            xhrRequest.open("GET", this.origin + '/profile');
            xhrRequest.onload = function(){
                if (xhrRequest.status == 200){
                    resolve(JSON.parse(xhrRequest.response));
                }else{
                    reject((new Error(xhrRequest.responseText)));
                }
            }

            xhrRequest.ontimeout = function() {
                reject((new Error(xhrRequest.status)));
            }
            xhrRequest.onerror = function() {
                reject((new Error(xhrRequest.status)));
            };  
            
            xhrRequest.timeout = 500;
            xhrRequest.send();
        })
    }
  
    
    

}


function sanitize(string) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
	};
	const reg = /[&<>]/ig;
	return string.replace(reg, (match)=>(map[match]));
}


//generator function
function* makeConversationLoader(room){
    var conversation;
    var before = room.time;

    do{
        room.canLoadConversation = false;
        yield(
            new Promise ((resolve, reject) => {
                Service.getLastConversation(room.id, before).then(result => {
                    if (result){
                        before = result.timestamp;
                        conversation = result;
                        if (result){
                            room.canLoadConversation = true;
                            room.addConversation(conversation);
                            resolve(conversation);
                        }else{
                            //canLoadConversation is false
                            resolve(null);
                        }
                    }else{
                        conversation = null;
                        resolve(null);
                    }
                })
            })
        )
    }while(conversation);
}





// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

{/* <li>
              <img src="assets/everyone-icon.png" width="20" height="20"/>
              <a href="#/chat">Everyone in CPEN400A</a>
          </li>
          <li>
            <img src="assets/bibimbap.jpg" width="20" height="20"/>
            <a href="#/chat">Foodies only</a>
          </li>  
          <li>
              <img src="assets/minecraft.jpg" width="20" height="20"/>
              <a href="#/chat">Gamers unite</a>
          </li>
          <li>
            <img src="assets/canucks.png" width="20" height="20"/>
            <a href="#/chat">Canucks Fans</a>
          </li> */}
const lobbyHTML =  `
        <div class = "content">
      <ul class = "room-list">
                
      </ul>

      <div class = "page-control">
          <input id = "room-name" type="text" placeholder="Room Title">
          <button id = "room-create-button">Create Room</button>
      </div>
  </div>
        `;



    //     <div class = "message">
    //     <span class = "message-user">
    //         Alice
    //     </span>
    //     <br>
    //     <span class = "message-text">
    //         message
    //     </span>
    // </div>

    // <div class = "message my-message">
    //     <span class = "message-user">
    //         Bob
    //     </span>
    //     <br>
    //     <span class = "message-text">
    //         message
    //     </span>
    // </div>
const chatHTML = `<div class = "content">
<h4 class = "room-name">Room</h4>

<div class = "message-list">
    



</div>

<div class = "page-control">
    <textarea id="typein-text" placeholder="Type in ..."></textarea>
    <button id="send-button">Send</button>
</div>
</div>`;

const profileHTML = `
<div class = "content">
<div class = "profile-form">
<div class = "form-field">
    <label>Username</label>
    <input type="text">
</div>
<div class = "form-field">
    <label>Password</label>
    <input type="password">
</div>
<div class = "form-field">
    <label>Avatar image</label>
    <img src="assets/profile-icon.png" width="20" height="20"/>
    <input type="file">
</div>
</div>
<div class = "page-control">
<button type = "button">Save</button>
</div>
</div>`;

class LobbyView {
    constructor(lobby) {
        this.lobby = lobby;
        this.elem = createDOM(lobbyHTML);
        this.listElem = this.elem.querySelector("ul.room-list");
        this.inputElem = this.elem.querySelector('#room-name');
        this.buttonElem = this.elem.querySelector('#room-create-button');
    
        this.lobby.onNewRoom = function(room){
            var newRoom = createDOM(
                `<li>
                        <a href="#/chat/`+room.id+`">
                            <img src="`+room.image+`" width="20" height="20"/>
                            `+room.name+`
                        </a>
                </li>`
            );
            this.listElem.appendChild(newRoom);
        }.bind(this);

        this.buttonElem.addEventListener('click', 
            function(){
                var room_data = {name: this.inputElem.value, image: defaultImg};
                
                var response = Service.addRoom(room_data);
                response.then(
                    (result)=>{
                        this.lobby.addRoom(result.id, result.name, result.image, result.messages);
                    },
                    (error)=>{
                        console.log(error);
                    }
                )

                // var roomName = this.inputElem.value;
                // console.log(roomId);
                // this.lobby.addRoom(roomId, roomName, defaultImg, "");
                
                this.inputElem.value = "";
            }.bind(this),
            false
        );
        this.redrawList();
        
    }

    redrawList(){
        emptyDOM(this.listElem);
        // console.log('debug in LobbyView, for lobby: ' + this.lobby["room-1"]);
        // <a href="#/chat/`+room+`"></a>
        for(var room in this.lobby.rooms) {
            console.log('debug in LobbyView, for lobby room: ');
            this.listElem.appendChild(
                createDOM(
                    `<li>
                            <a href="#/chat/`+room+`"></a>
                            <img src="assets/everyone-icon.png" width="20" height="20"/>
                            `+this.lobby.rooms[room].name+`
                        </a>
                    </li>`
                    )
            );
            console.log('debug in LobbyView, for lobby room: ');
        }
    }


}



class ChatView{
    constructor(socket){
        this.socket = socket;
        this.elem = createDOM(chatHTML);
        this.titleElem = this.elem.querySelector("h4.room-name");
        this.chatElem = this.elem.querySelector("div.message-list");
        this.inputElem = this.elem.querySelector("#typein-text");
        this.buttonElem = this.elem.querySelector("#send-button");
        this.room = null;

        this.buttonElem.addEventListener("click", function(event) {
            this.sendMessage();
            //clean input text bar
            this.inputElem.value = "";
        }.bind(this),
        false);

        this.inputElem.addEventListener('keyup', function(event) {
            if(event.keyCode == 13 && !event.shiftKey) {
                this.sendMessage();
                //clean input text bar
                this.inputElem.value = "";
            }
            
        }.bind(this), false);

        this.chatElem.addEventListener('wheel', function(event){
            if(this.room.canLoadConversation == true && event.deltaY < 0 && this.chatElem.scrollTop === 0){
                this.room.getLastConversation.next();
            }
        }.bind(this));   

    }

    sendMessage(){
        let text = this.inputElem.value;
        //replace
        text = sanitize(text);

        console.log("input text: " + text);
        this.room.addMessage(profile.username, text);
        // this.socket.send((JSON.stringify({roomId: this.room.id, username: profile.username, text: text}))); 
        this.socket.send((JSON.stringify({roomId: this.room.id, text: text}))); //modified in a5, ignore client username.
        this.inputElem.value = "";
    }


    
    setRoom(room){
        this.room = room;
        this.titleElem.innerHTML = room.name;

        emptyDOM(this.chatElem);
        //retrive all messages
        for (var i = 0; i < room.messages.length; i++){
            if (room.messages[i].username != profile.username){ //messages from others
                                                                //listed in the right
                this.chatElem.appendChild(createDOM(
                    `
                    <div class = "message">
                        <span class = "message-user">
                            `+room.messages[i].username+`
                        </span>
                        <br>
                        <span class = "message-text">
                            `+room.messages[i].text+`
                        </span>
                    </div>
                    `
                ));

            }else{//message from the user
                this.chatElem.appendChild(createDOM(
                    `
                    <div class = "message my-message">
                        <span class = "message-user">
                            `+room.messages[i].username+`
                        </span>
                        <br>
                        <span class = "message-text">
                            `+room.messages[i].text+`
                        </span>
                    </div>
                    `
                ));
            }
        }

        this.room.onNewMessage = function(message){
            var message_text = message.text;


            message_text = sanitize(message_text);

            if (message.username == profile.username){
                this.chatElem.appendChild(createDOM(
                    `
                    <div class = "message my-message">
                        <span class = "message-user">
                            `+profile.username+`
                        </span>
                        <br>
                        <span class = "message-text">
                            `+message_text+`
                        </span>
                    </div>
                    `
                ));
            }else{
                this.chatElem.appendChild(createDOM(
                    `
                    <div class = "message">
                        <span class = "message-user">
                            `+message.username+`
                        </span>
                        <br>
                        <span class = "message-text">
                            `+message_text+`
                        </span>
                    </div>
                    `
                ));
            }
        }.bind(this);

        
        this.room.onFetchConversation = (conversation) => {
            var height_init = this.chatElem.scrollTop;
            var messages = conversation.messages;

            var user_name;
            var user_text;
            for(let i = messages.length-1; i >= 0; i--) {
                //retrive info
                user_name = messages[i].username;
                user_text = messages[i].text;

                user_text = sanitize(user_text);

                if(messages[i].username == profile.username) { //message from user
                    this.chatElem.insertBefore(createDOM(
                        `<div class="message my-message">
                            <span class="message-user">` + user_name + `</span>
                            <span class="message-text">` + user_text + `</span>
                            </div>`
                    ), this.chatElem.firstChild);
                }else { //message from others
                    this.chatElem.insertBefore(createDOM(
                        `<div class="message my-message">
                                <span class="message-user">` + user_name + `</span>
                                <span class="message-text">` + user_text + `</span>
                            </div>`
                    ), this.chatElem.firstChild);
                }
            }
            var height_aft = this.chatElem.scrollTop;
            this.chatElem.scrollTop = height_aft - height_init;
        }
 
    }
}






class ProfileView{
    constructor(){
        this.elem = createDOM(profileHTML);
    }
}

class Room{
    constructor(id, name, image = defaultImg, messages = []){
        this.id = id;
        this.name = name;
        this.image = image;
        this.messages = messages;
        this.time = Date.now();
        //this.messages = Array.from(messages);
        //this.messages = [];
        this.canLoadConversation = true;
        this.getLastConversation = makeConversationLoader(this);
    }

    addMessage(username, text){
        text = text.trim();
        if (text == ""){
            return;
        }

        //define the message json format
        var message = {
            username: username,
            text: text
        };

        // message['text'] = message['text'].replace(/</g, "");
        // message['text'] = message['text'].replace(/>/g, "");
        
        console.log('addMessage dubug: ' + Array.isArray(this.messages));
        if (!Array.isArray(this.messages)){ //some unexpected error [messages is not
                                            //recognized as an array]
                                            //cast as array
            this.messages = Array.from(this.messages);
        }
        this.messages.push(message);
        
        //debug
        for (var i = 0; i < this.messages.length; i++){
            console.log("message debug: " + this.messages[i].text);
        }

        if (this.onNewMessage){
            this.onNewMessage(message);
        }
       
    }

    addConversation(conversation){
        var messages = conversation.messages;
        var roomId = conversation.room_id;

        var i = 0;
        while (i < messages.length){
            this.messages.push(messages[i]);
            i++;
        }

        if(this.onFetchConversation) {
            this.onFetchConversation(conversation);
        }
    }
    
}

class Lobby{
    constructor(){
        this.rooms = {};
        //default 4 rooms set-up
        // this.addRoom(0, "room-0", defaultImg, "");
        // this.addRoom(1, "room-1", defaultImg, "");
        // this.addRoom(2, "room-2", defaultImg, "");
        // this.addRoom(3, "room-3", defaultImg, "");
    }

    getRoom(roomId){
        console.log('num rooms is: ' + this.rooms.length);
        return this.rooms[roomId];
    }


    addRoom(id, name, image, messages){
        //quit if room is already created
        if (id in this.rooms){
            return;
        }

        var newRoom = new Room(id, name, image, messages);
        this.rooms[id] = newRoom;

        if (this.onNewRoom){
            this.onNewRoom(newRoom);
        }
    }
}


function main(){
    const socket = new WebSocket('ws://localhost:8000');

    var lobby = new Lobby();
    var lobbyView = new LobbyView(lobby);
    var chatView = new ChatView(socket);
    var profileView = new ProfileView();

    
    socket.addEventListener('message', function(event){
        var received_data = JSON.parse(event.data);
        var room = lobby.getRoom((received_data.roomId).toString());
        room.addMessage(received_data.username, received_data.text);
    });
    

    

    
    function renderRoute(){
        var url = window.location.hash;
        console.log("url: " + url);
        var elem = document.getElementById("page-view");
        var roomID = "#/chat/[a-zA-Z0-9]+"; //to fulfill the test chat/id
        
        if (url === "#/" || url === ""){
            emptyDOM (elem);
            elem.appendChild(lobbyView.elem);    
        }else if (url.match(roomID)){
            emptyDOM (elem);
            console.log('room id is:' + url.substring(7));
            
            let room = lobby.getRoom(url.substring(7)) // #/chat/[room-id] starts in index 7
            console.log("debug: check elements of lobby: " + lobby.getRoom('room-1'));
            console.log("debug: check if room is defined: " + room);
            if (room != null){
                chatView.setRoom(room);
            }
            elem.appendChild(chatView.elem);
        }else if (url === "#/profile"){
            console.log('in profile');
            emptyDOM (elem);
            elem.appendChild(profileView.elem);
        }else{

        }

        // var url = window.location.hash;
        // url = url.split('/');
        // var elem = document.getElementById("page-view");
        // var roomID = "#/chat/[a-zA-Z0-9]+"; //to fulfill the test chat/id
        
        // if (url[1] == "" || url[1] == ""){
        //     emptyDOM (elem);
        //     elem.appendChild(lobbyView.elem);    
        // }else if (url[1].match(roomID)){
        //     emptyDOM (elem);

        //     let room = lobbyView.lobby.getRoom(url.substring(7)) // #/chat/[room-id] starts in index 7
        //     console.log("debug: if room is defined:" + room);
        //     if (room != null){
        //         chatView.setRoom(room);
        //     }
        //     elem.appendChild(chatView.elem);
        // }else if (url[1] == "profile"){
        //     emptyDOM (elem);
        //     elem.appendChild(profileView.elem);
        // }else{

        // }
    }
    
    
    function refreshLobby(){
        Service.getAllRooms()
            .then(result => {
                for (let i in result) {
                    let room = result[i];
                    if (room._id in lobby.rooms) {
                        lobby.rooms[room._id].image = room.image;
                        lobby.rooms[room._id].name = room.name;
                    } else {
                        lobby.addRoom(room._id, room.name, room.image, room.messages);
                    }
                }
            })
    };


    renderRoute();
    refreshLobby();
    window.addEventListener("popstate", renderRoute);
    setInterval(refreshLobby, 5000);
    Service.getProfile().then(result => {
        console.log('#$#$result.username: ' + result['username']);
        profile['username'] = result['username'];
    })

    cpen322.export(arguments.callee, {
        renderRoute,
        refreshLobby,
        
        lobby: lobby,
        
        lobbyView: lobbyView,

        profileView: profileView,

        chatView: chatView,
        socket: socket

        // addConversation,
    });
}



window.addEventListener("load", main);




