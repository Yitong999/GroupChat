const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {}; //token: user

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
		/* To be implemented */
        var token_generator = crypto.randomBytes(50).toString("hex");
        console.log('***$$$generated cookie is: ' + token_generator);
        var current_time = Date.now();
        var user = {
            'username': username,
            'time_create': current_time
            // 'time_expire': current_time + maxAge
        };
        sessions[token_generator] = user;

        //If the maxAge argument is not given, use some default value.
        if (maxAge == undefined){
            maxAge = 2000000;
        }
        
        response.cookie('cpen322-session', token_generator, {'maxAge': maxAge});
        
        setTimeout(function(){
            delete sessions[token_generator]
        }, maxAge);
	};

	this.deleteSession = (request) => {
		/* To be implemented */
        delete request.username;
        delete sessions[request.session];
        delete request.session; 
	};

	this.middleware = (request, response, next) => {
		/* To be implemented */
        var cookie_list = request.headers.cookie; //cpen322-session=2aeafeefbc5c4eb14986964884bdb6cecf4a627e634b292cc14c0eaada37; cookie_another=...
        var cookie;
        if (cookie_list == null){
            // console.log("***error cookie_list is not found");
            next(new SessionError("error that cookie header is not found"));
            return;
        }else{
            var parsed_cookie_list = cookie_list.split('; ');
            // console.log('***parsed_cookie_list length: ' + parsed_cookie_list.length);
            for (var i = 0; i < parsed_cookie_list.length; i++){
                // console.log('in loop: ' + parsed_cookie_list[i]);
                // console.log('index: ' + parsed_cookie_list[i].indexOf('cpen322-session='));
                if (parsed_cookie_list[i].indexOf('cpen322-session=') != -1){ //cpen322_cookie is found
                    console.log("###full cookie is found: " + parsed_cookie_list[i]);
                    cookie = parsed_cookie_list[i].substring(16).split(' ').join('');
                    console.log("###cookie is found: " + cookie);
                    break;
                }
            }
            
            if (cookie == null){
                next(new SessionError('error that cookie not found'));
            }

            var user = sessions[cookie];

            if(user){
                request['username'] = user['username'];
                request['session'] = cookie;             // assign a property named session and set its value to the cookie value (the token)
                next();
            }else{
                next(new SessionError('error that session not exist'));
            }
        }     
        
        
	};

    
    
	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);

    // this.tokenIsValid = (cookie) => {
    //     return cookie in sessions;
    // }
    this.tokenIsValid = function(cookie){
        return cookie in sessions;
    }
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;