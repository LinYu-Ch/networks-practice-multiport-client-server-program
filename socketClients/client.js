/*
Project Description:
Implementation of a simple chat room that includes a client and a server that utilizes
the socket API.

The current scirpt is the main entry point for the client side code utilized in implementing
the simple client
*/

const io = require("socket.io-client");
const socket = io("http://127.0.0.1:10890");

const sessionData = {
    userName: null,
    sessionId: null
}

const readLine = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
})

// checks the user input string for matches for valid function calls
function inputStringToCommand(inputString) {
    const validFunctions = ["login", "newuser", "send", "logout", "who"];
    let signature, rest;
    [signature, ...rest] = inputString.split(" ");

    const inputPayload = {
        command: signature,
        body: rest
    }
    
    if (validFunctions.includes(signature)) return inputPayload;
    return null;
}

// function handles terminal input operations, and calls
// associated matching functions
function getInput() {
    readLine.question('>', (input) => {
    let commandPayload = inputStringToCommand(input);
    
    // invalid input handling
    if (commandPayload === null) {
        console.log(">Invalid Command, please input a valid command");
        getInput();
        return;
    }

    // Matching data to functions
    const commandSinature = commandPayload.command;
    const commandBody = commandPayload.body;

    // Matching to function signatures
    if (commandSinature === "newuser") {
        const username = commandBody[0];
        const password = commandBody[1];
        newuser(username, password);
    }
    if (commandSinature === "login") {
        const username = commandBody[0];
        const password = commandBody[1];
        login(username, password);
    }
    if (commandSinature === "send") {
        const type = commandBody[0];
        const message = commandBody.slice(1).join(" ");
        send(message, type);
    }
    if (commandSinature === "logout") {
        logout();
    }
    if (commandSinature === "who") {
        who();
    }

    return;
    });
}

// accepts username and password, emits request to server
function login(username, password) {
    if (sessionData.sessionId != null) {
        console.log(">Denied, user is already logged in");
        getInput();
        return;
    }

    socket.emit("login", {
        username: username,
        password: password
    });
}

// accepts username and password, emits request to server
function newuser(username, password) {
    if (sessionData.sessionId != null) {
        console.log(">Denied, user is already logged in");
        getInput();
        return;
    }

    if (username == undefined || password == undefined) {
        console.log(">Invalid Input, please input a username and password");
        getInput();
        return;
    }

    if (username.length < 3 || username.length > 32) {
        console.log(">Invalid Input, please input a username between 3 and 32 characters");
        getInput();
        return;
    }

    if (password.length < 4 || password.length > 8) {
        console.log(">Invalid Input, please input a password between 4 and 8 characters");
        getInput();
        return;
    }

    socket.emit("newuser", {
        username: username,
        password: password
    });
}

// accepts message string, emits message to server along with
// established session ID
function send(message, type) {
    if (sessionData.sessionId == null) {
        console.log(">Denied. Please login first");
        getInput();
        return;
    }

    if (type == undefined) {
        console.log(">Denied. Please input a recepient");
        getInput();
        return;
    }

    if (message.length < 1 || message.length > 256) {
        console.log(">Invalid Input, please input a message between 1 and 256 characters");
        getInput();
        return;
    }


    socket.emit("message", {
        sessionId: sessionData.sessionId,
        recepient: type,
        message: message,
    });
    getInput();
}

// getter for currently logged in users
function who(){
    socket.emit("who");
}

// logs current session user out, program remains operational
function logout() {
    if (sessionData.sessionId == null) {
        console.log(">Denied. Please login first.");
        getInput();
        return;
    }

    console.log(`> ${sessionData.userName} left.`);
    socket.emit("logout", {
        sessionId: sessionData.sessionId,
    });
    sessionData.sessionId = null;
    sessionData.userName = null;
    getInput();
}

socket.on("connect", () => {
  console.log(">My chat room client. Version One. \n");
  sessionData.sessionId = null;
  sessionData.userName = null;
  getInput();
});

// special listener for session handshake confirmation
// defines sessionID
socket.on("sessionHandshake", (data) => {
    sessionData.userName = data.username;
    sessionData.sessionId = data.sessionId;
    console.log("> login confirmed");
    getInput();
});

// listener for misc messages server sends, confirmation messages
// and server side service denial messages 
socket.on("message", (data) => { 
    console.log(">", data);
    getInput();
});







