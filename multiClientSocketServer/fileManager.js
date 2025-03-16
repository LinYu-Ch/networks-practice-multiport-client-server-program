/*
Helper modules for server side code. 
utilized to handle asynchronous operations
which are more confusing to understand
*/

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'users.txt');

// Check if the given username and password exist in the file
function userExists(username, callback) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return callback(err, false);
    }

    // Regular expression to match (username, password) pairs
    const regex = /\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      const fileUsername = match[1].trim();
      if (fileUsername === username) {
        return callback(null, true);
      }
    }
    callback(null, false);
  });
}

function passwordMatch(username, password, callback) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return callback(err, false);
    }

    // Regular expression to match (username, password) pairs
    const regex = /\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      const fileUsername = match[1].trim();
      const filePassword = match[2].trim();
      if (fileUsername === username && filePassword === password) {
        return callback(null, true);
      }
    }
    callback(null, false);
  });
}

// Add a new user entry to the file
function addUser(username, password, callback) {
  const newEntry = `(${username}, ${password})`;

  fs.readFile(filePath, 'utf8', (err, data) => {
    let updatedData;
    if (err) {
      // make new file if file isn't found
      if (err.code === 'ENOENT') {
        updatedData = newEntry + "\n";
      } else {
        return callback(err);
      }
    } else {
      updatedData = data.trim() ? data.trim() + "\n" + newEntry + "\n" : newEntry + "\n";
    }

    fs.writeFile(filePath, updatedData, 'utf8', (err) => {
      if (err) {
        return callback(err);
      }
      // Successful write
      callback(null);
    });
  });
}

module.exports = {
  userExists,
  passwordMatch,
  addUser,
};
