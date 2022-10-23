const defaultImg = "assets/everyone-icon.png";
const profile = {username: "Alice"}
var roomId = 0;
window.addEventListener("load", main);


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

const lobbyHTML =  `
        <div class = "content">
      <ul class = "room-list">
          <li>
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
          </li>      
      </ul>

      <div class = "page-control">
          <input id = "room-name" type="text" placeholder="Room Title">
          <button id = "room-create-button">Create Room</button>
      </div>
  </div>
        `;

const chatHTML = `<div class = "content">
<h4 class = "room-name">Room 1</h4>

<div class = "message-list">
    <div class = "message">
        <span class = "message-user">
            Alice
        </span>
        <br>
        <span class = "message-text">
            message
        </span>
    </div>

    <div class = "message my-message">
        <span class = "message-user">
            Bob
        </span>
        <br>
        <span class = "message-text">
            message
        </span>
    </div>
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
                                
                                var roomName = this.inputElem.value;
                                console.log(roomId);
                                this.lobby.addRoom(roomId, roomName, defaultImg, "");
                                
                                this.inputElem.value = "";
                            }.bind(this),
                            false
        );
        this.redrawList();
        
    }

    redrawList(){
        emptyDOM(this.listElem);
        for(var room in this.lobby.rooms) {
            this.listElem.appendChild(
                createDOM(
                    `<li>
                        
                            <a href="#/chat/`+room+`">
                            <img src="assets/everyone-icon.png" width="20" height="20"/>
                            `+this.lobby.rooms[room].name+`
                        </a>
                    </li>`
                    )
            );
        }
    }


}



class ChatView{
    constructor(){
        this.elem = createDOM(chatHTML);
        this.titleElem = this.elem.querySelector("h4.room-name");
        this.chatElem = this.elem.querySelector("div.message-list");
        this.inputElem = this.elem.querySelector("#typein-text");
        this.buttonElem = this.elem.querySelector("#send-button");
        this.room = null;

        this.buttonElem.addEventListener("click", function(event) {
            this.sendMessage();
            this.inputElem.value = "";
        }.bind(this),
        false);

        this.inputElem.addEventListener('keyup', function(event) {
            if(event.keyCode == 13 && !event.shiftKey) {
                this.sendMessage();
                this.inputElem.value = "";
            }
            
        }.bind(this), false);
    }

    sendMessage(){
        let text = this.inputElem.value;
        console.log("input text: " + text);
        this.room.addMessage(profile.username, text);
        this.inputElem.value = "";
    }

    setRoom(room){
        this.room = room;
        this.titleElem.innerHTML = room.name;

        emptyDOM(this.chatElem);
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
            if (message.username == profile.username){
                this.chatElem.appendChild(createDOM(
                    `
                    <div class = "message my-message">
                        <span class = "message-user">
                            `+profile.username+`
                        </span>
                        <br>
                        <span class = "message-text">
                            `+message.text+`
                        </span>
                    </div>
                    `
                ));
            }else{
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
            }
        }.bind(this);
        
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
        //this.messages = Array.from(messages);
        //this.messages = [];

    }

    addMessage(username, text){
        text = text.trim();
        if (text == ""){
            return;
        }

        var message = {
            username: username,
            text: text
        };
        
        console.log(Array.isArray(this.messages));
        if (!Array.isArray(this.messages)){
            this.messages = Array.from(this.messages);
        }
        this.messages.push(message);
        
        for (var i = 0; i < this.messages.length; i++){
            console.log("message debug: " + this.messages[i].text);
        }

        if (this.onNewMessage){
            this.onNewMessage(message);
        }
       
    }
}

class Lobby{
    constructor(){
        this.rooms = [];
        this.addRoom(0, "room-0", defaultImg, "");
        this.addRoom(1, "room-1", defaultImg, "");
        this.addRoom(2, "room-2", defaultImg, "");
        this.addRoom(3, "room-3", defaultImg, "");
    }

    getRoom(roomId){
        return this.rooms[roomId];
    }


    addRoom(id, name, image, messages){
        if (id in this.rooms){
            return;
        }
        roomId++;
        var newRoom = new Room(id, name, image, messages);
        this.rooms[id] = newRoom;

        if (this.onNewRoom){
            this.onNewRoom(newRoom);
        }
    }
}


function main(){
    window.addEventListener('popstate', renderRoute);
    var lobby = new Lobby();

    var lobbyView = new LobbyView(lobby);
    var chatView = new ChatView();
    var profileView = new ProfileView();
    renderRoute();

    
    function renderRoute(){
        var url = window.location.hash;
        var elem = document.getElementById("page-view");
        var roomID = "#/chat/[a-zA-Z0-9]+"; //to fulfill the test chat/id
        
        if (url == "#/" || url == ""){
            emptyDOM (elem);
            elem.appendChild(lobbyView.elem);    
        }else if (url.match(roomID)){
            emptyDOM (elem);

            let room = lobbyView.lobby.getRoom(url.substring(7)) // #/chat/[room-id] starts in index 7
            console.log("debug: if room is defined:" + room);
            if (room != null){
                chatView.setRoom(room);
            }
            elem.appendChild(chatView.elem);
        }else if (url == "#/profile"){
            emptyDOM (elem);
            elem.appendChild(profileView.elem);
        }else{

        }
    }
    
    cpen322.export(arguments.callee, {
        renderRoute: renderRoute,
        lobbyView: lobbyView,
        chatView: chatView,
        profileView: profileView,
        lobby: lobby
        //renderRoute, lobbyView, chatView, profileView
    });
}



