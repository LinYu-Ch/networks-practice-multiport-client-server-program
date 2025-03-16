/*
Project Description:
Implementation of a simple chat room that includes a client and a server that utilizes
the socket API.

The current scirpt is the main entry point for the server side code utilized in implementing
the simple client
*/

/*
 Note to developers.
 this is not a secure way to define ports, if it weren't for a practice project with a fixed port number one should be
 using environment variables
*/

// setup of initial IP and port variables
const PORT = 10890;
const HOST = '127.0.0.1';

// importing required APIs
const http = require("http");
const { Server } = require("socket.io");

const { userExists, passwordMatch, addUser } = require("./fileManager.js");

// Active server data
// UUID : UserID pairs
const SESSIONDATA = {}

const httpServer = http.createServer();
const socketServer = new Server(httpServer);

/**
 * Function receives username and password,
 * Then checks for username matches in save file.
 * And adds a new entry in case there are no matching 
 * usernames
 * 
 * @param {string} userId 
 * @param {string} password 
 * @param {socket} socket 
 */
function newUser(userId, password, socket) {
  userExists(userId, (err, exists) => {
    if (err) {
      console.error('Error checking user:', err);
      return;
    }

    if (exists) {
      socket.emit("message", "Denied. User account already exists.");
      return;
    }

    addUser(userId, password, (err) => {
      if (err) {
        console.error('Error adding user:', err);
      }
      else {
        console.log('New user account created');
        socket.emit("message", "New user account created. Please login.");
      }

    });
  });
}

/**
 * 
 * function creates a random session id that persists for
 * the duration the server is running
 * 
 * @returns randomizedSessionId
 */
function generateSessionId() {
  return 'xxxx-4xxx-yxxx'
    .replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      // check for existing session id
      if (SESSIONDATA.hasOwnProperty(v.toString(16))) {
        return v.toString(16);
      }
      return v.toString(16);
    });
}

// helper function to keep track of currently logged in users
function sessionExists(userId){
  for (let userObj in SESSIONDATA) {
    if(SESSIONDATA[userObj].userId === userId) {
      return true;
    }
    return false;
  }
} 

/**
 * function takes in user ID and password, it searches 
 * through the save file for a pattern match, if found, user 
 * will be logged in
 * 
 * @param {string} userId 
 * @param {string} password 
 * @param {socket} socket 
 */
function userLogin(userId, password, socket, socketServer) {
  passwordMatch(userId, password, (err, matches) => {
    if (err) {
      console.error('Error checking password', err);
      return;
    }

    if (!matches) {
      // console.log("Error, username or password invalid");
      socket.emit("message", "Error, username or password invalid");
      return;
    }

    if (sessionExists(userId)) {
      socket.emit("message", "Error, user account is already logged in");
      return;  
    }

    const sessionId = generateSessionId();
    SESSIONDATA[sessionId] = {
      userId: userId,
      socket: socket
    };

    const confirmationPayload = {
      sessionId: sessionId,
      username: SESSIONDATA[sessionId].userId
    }

    socket.emit("sessionHandshake", confirmationPayload);
    socketServer.emit("message", `${userId}: login`);
    console.log(`${userId}: login`);
  })

}

/**
 * function takes client sessionId
 * sessionId is used to match message sender,
 * then displays sent message on server side, and emits
 * send message to all connected clients
 * 
 * @param {string} sessionId 
 * @param {string} password 
 * @param {socket} socket 
 */
function newMsg(sessionId, msg) {
  const messageString = `${SESSIONDATA[sessionId].userId}: ${msg}`;
  console.log(messageString);

  const recepientSockets = [];
  for (let session in SESSIONDATA) {
    if (session !== sessionId) {
      recepientSockets.push(SESSIONDATA[session].socket);
    }
  }

  recepientSockets.forEach((socket)=>socket.emit("message", messageString));
}

// helper function to find sessionId based on userId
function findSessionId(userId) {
  for (let userObj in SESSIONDATA) {
    if(SESSIONDATA[userObj].userId === userId) {
      return userObj;
    }
  }
  return null;
}

// Takes in the recepient name, and retrieves the associated socket object, sending a message directly
// to them
function newDirMsg(sessionId, message, recepient, socket) {
  const senderSID = sessionId;
  const senderSocket = socket;
  const payload = `${SESSIONDATA[senderSID].userId}: ${message}`;
  const recepientSID = findSessionId(recepient);

  if (recepientSID == null) {
    senderSocket.emit("message", "Denied. Recepient name does not exist");
    return;
  }

  const recepientSocket = SESSIONDATA[recepientSID].socket;

  console.log(`${SESSIONDATA[senderSID].userId} (to ${SESSIONDATA[recepientSID].userId}): ${payload}`);
  recepientSocket.emit("message", payload);
}

// itterates through the sessiondata object, returns to the requester the usernames in SESSIONDATA
function who(socket) {
  let userArray = [];
  for (let userObj in SESSIONDATA) {
    userArray.push(SESSIONDATA[userObj].userId);
  }

  socket.emit("message", userArray.toString());
}
/**
 * function takes client sessionId
 * sessionId is used to match message sender,
 * then deletes client sessionID on server side, and emits
 * message to confirm logout request
 * 
 * @param {string} sessionId 
 */
function logOut(sessionId) {
  console.log(SESSIONDATA[sessionId].userId + " logout");
  delete SESSIONDATA[sessionId];
}

httpServer.listen(PORT, HOST, () => {
  console.log(`Socket.IO server is active on host: ${HOST}, port ${PORT}`);
  console.log("My chat room server. Version One.");
}
);


socketServer.on("connection", (socket) => {
  socket.on("newuser", (data) => {
    const username = data.username;
    const password = data.password;

    newUser(username, password, socket);
  });

  socket.on("login", (data) => {
    const username = data.username;
    const password = data.password;
    userLogin(username, password, socket, socketServer);
  });

  socket.on("message", (data) => {
    const sessionId = data.sessionId;
    const message = data.message;
    const recepient = data.recepient;


    if (recepient == "all") {
      newMsg(sessionId, message, socketServer);
      return;
    }

    newDirMsg(sessionId, message, recepient, socket);
  })
  socket.on("who", ()=>{
    who(socket);
  });

  socket.on("logout", (data) => {
    logOut(data.sessionId);
  });
});

