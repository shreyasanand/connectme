var app = require('express')();
var http = require('http');
var io = require('socket.io');
var mysql = require('mysql');
var mime = require('mime');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');

var chatRoom = {}; // Chatroom object
var user = {}; // User object
var userRooms = []; // Array to keep track of all users in a chat room

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use(favicon(__dirname + '/favicon.ico'));

// Create an instance of http server that listens on TCP port 3000
var server = http.createServer(createServerCallbackHandler).listen(process.env.PORT || 3000, function() {
    console.log('listening on *:3000');
});

// Load all the resources (files) once the server receives a request 
function createServerCallbackHandler(request, response) {
    var resFilePath = false;
    if (request.url == '/') {
        resFilePath = './index.html';
    } else {
        resFilePath = request.url;
    }
    var absResPath = './' + resFilePath;
    response.writeHead(200, {
        "Content-Type": mime.lookup(path.basename(absResPath))
    });
    fs.readFile(absResPath, function(err, data) {
        if (err) {
            throw err;
        }
        response.write(data);
        response.end();
    });
}

// Create a connection to the mysql database
var db_config = {
    host: 'us-cdbr-iron-east-03.cleardb.net',
    user: 'bf8389a8ce592f',
    password: 'fd6646e4',
    database: 'heroku_2fcab8e41eaf3b5'
};

var dbConn;

function handleDisconnect() {
  dbConn = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  dbConn.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  dbConn.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

// Establish the database connection
//dbConn.connect(function(err) {
//    if (!err) {
//        console.log("Database is connected ... \n\n");
//    } else {
//        console.log("Error connecting database ... \n\n");
//    }
//});

// Create a socket and make it listen to the server created above
var socket = io.listen(server);

// Handle new client connection requests
socket.on("connection", handleClient);

// Function to assign event handlers to each new client
function handleClient(client) {
    
    // Assign event handlers based on the corresponding messages
    client.on("signUp", evtHandlerSignUp);
    client.on("signIn", evtHandlerSignIn);
    client.on("createChatRoom", evtHandlerCreateRoom);
    client.on("chatRoomValidity", evtHandlerChatRoomValidity);
    client.on("chatRoomJoin", evtHandlerJoinChatRoom);
    client.on("message", evtHandlerSendMessage);
    client.on("leaveChatRoom", evtHandlerLeaveChatRoom);
    client.on("logOut", evtHandlerLogout);
    
    /* Signup event handler:
     * Validate the new user data and make an entry into the database 
     */
    function evtHandlerSignUp(data) {
            var newName = data.name;
            var newUserName = data.userName;
            var newPassword = data.password;
            var newEmail = data.email;
            var userExists = false;
            dbConn.query('SELECT * FROM USER WHERE username = ?', newUserName, function(err, rows) {
                if (err) {
                    client.emit("errorLogin", "Server Unavailable. Please try again");
                    throw err;
                } else {
                    if (rows.length == 0) {
                        userExists = false;
                        dbConn.query('INSERT INTO USER SET ?', data, function(err, rows) {
                            if (err) {
                                client.emit("errorLogin", "Server Unavailable. Please try again");
                                throw err;
                            }
                            else client.emit('signupSuccess');
                        });
                    } else {
                        userExists = true;
                        client.emit('errorLogin', 'Username already exists');
                    }
                }
            });
        }
    
    /* Signin event handler:
     * Validate the user login details, create the user object with the client id
     * as key and username as value and notify the server if the sign in was successful 
     */
    function evtHandlerSignIn(data) {
        var userName = data.userName;
        var password = data.password;
        var userExists = false;
        dbConn.query('SELECT * FROM USER WHERE username = ? AND password = ?', [userName, password], function(
            err, rows) {
            if (err) {
                client.emit("errorLogin", "Server Unavailable. Please try again");
                throw err;
            } else {
                if (rows.length != 0) {
                    user[client.id] = userName;
                    client.emit("signInSuccess", chatRoom);
                } else {
                    client.emit("errorLogin", "Username or password invalid");
                }
            }
        });
    }

    /* New chat room creation event handler:
     * Create the chatRoom object with the roomName as the key and value 
     * and notify all clients 
     */
    function evtHandlerCreateRoom(roomName) {
        try {
            chatRoom[roomName] = roomName;
            socket.sockets.emit("newChatRoom", roomName);
        } catch (err) {
            console.log(err);
        }
    }

    /* Chat room name validity event handler:
     * Check if the chatroom name entered by the user is present or not
     * in the chatroom array and notify the server with appropriate message 
     */
    function evtHandlerChatRoomValidity(roomName) {
        try {
            if (roomName == "") {
                client.emit("chatRoomNotValid");
            } else if (chatRoom[roomName] == null) {
                client.emit("chatRoomValid");
            } else {
                client.emit("chatRoomNotValid");
            }
        } catch (err) {
            console.log(err);
        }
    }

    /* Join chatroom event handler: 
     * Join the client to the chatroom, add the roomname to the userRooms array 
     * with the current user object as the key 
     */
    function evtHandlerJoinChatRoom(roomName) {
        try {
            client.join(roomName);
            client.emit("joinChatRoomSuccess", roomName);
            if (userRooms[user[client.id]] == undefined) {
                userRooms[user[client.id]] = [];
            }
            userRooms[user[client.id]].push(roomName);
            client.broadcast.to(roomName).emit("newChatRoomUser", user[client.id], roomName);
        } catch (err) {}
    }

    /* Send message event handler:
     * Pack the message along with the roomName and sender and broadcast it
     * to all the clients in that room
     */
    function evtHandlerSendMessage(roomName, msg) {
        client.broadcast.to(roomName).emit("message", {
            "chatRoomName": roomName,
            "message": msg,
            "sender": user[client.id]
        });
    }

    /* Leave chatroom event handler:
     * Broadcast to all the clients that the user has left the room with the 
     * user object and the roomname and send a leave success message to the 
     * left room and update the userRooms array for the particular user object. 
     */
    function evtHandlerLeaveChatRoom(roomName) {
        try {
            client.broadcast.to(roomName).emit("userLeft", user[client.id], roomName);
            client.leave(roomName);
            var clientRooms = userRooms[user[client.id]];
            var index = clientRooms.indexOf(roomName);
            if (index > -1) {
                userRooms[user[client.id]].splice(index, 1);
                client.emit("leaveChatRoomSuccess", roomName);
            }
        } catch (err) {
            console.log(err);
        }
    }

    /* Logout event handler:
     * Send a user left message to all the rooms the user had joined,
     * update the userRooms array for the user object and delete the user object.
     */
    function evtHandlerLogout() {
        try {
            var totalRooms = userRooms[user[client.id]].length;
            for (var idx = 0; idx < totalRooms; idx++) {
                var room = userRooms[user[client.id]][idx];
                client.leave(room);
                client.broadcast.to(room).emit("userLeft", user[client.id], room);
            }
            delete userRooms[user[client.id]];
            delete user[client.id];
        } catch (err) {}
    }
}