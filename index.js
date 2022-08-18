const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');

const jwt = require('jsonwebtoken'); // how to use?
const cors = require('cors');
const helmet = require('helmet'); // how to use?
var bcrypt = require('bcryptjs');

const app = express();
app.use('/public', express.static(path.join(__dirname, 'static')));
app.use(bodyParser.urlencoded({ extended: false }), cors({ origin: 'http://localhost:3000' }));

var id = 0;
var username = 'Not logged in';

function sanitize(input) {
  for (let i = 0; i < input.length; i++) {
    if (input[i] == "'" || input[i] == '"' || input[i] == "?") {
      return false;p
    }
  }
  return input.length >= 5;
}

let db = new sqlite3.Database('usersdb.db', (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  } else {
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, salt TEXT)', (err) => {
      if (err) {
        console.error(err.message);
        res.send('An unknown error occurred.<br/><a href="/">Go back.</a>');
      }
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.get('/create', (req, res) => { // C
  if (id == 0) {
    res.sendFile(path.join(__dirname, 'static', 'create.html'));
  } else {
    res.send('You cannot create an account while logged in.<br/><a href="/">Click to go back.</a>');
  }
})

app.get('/read', (req, res) => { // R
  if (id == 0) {
    res.send('You are currently not logged in.<br/><a href="/">Click to go back.</a>');
  } else {
    res.send(`Username: ${username}<br/>(ID ${id})<br/><a href="/">Go back.</a>`);
  }
  let sql = 'SELECT * FROM users';
  db.all(sql, (err, rows)=>{ // show all in console
    if (err) {
      console.error(err.message);
      res.send('An unknown error occurred.<br/><a href="/">Go back.</a>');
    } else {
      console.log(rows.length + " items");
      for (let i in rows) {
        console.log(rows[i]);
      }
    }
  });
});

app.get('/update', (req, res) => { // U
  if (id == 0) {
    res.send('You are currently not logged in.<br/><a href="/">Click to go back.</a>');
  } else {
    res.sendFile(path.join(__dirname, 'static', 'update.html'));
  }
});

app.get('/delete', (req, res) => { // D
  if (id == 0) {
    res.send('You are currently not logged in.<br/><a href="/">Go back.</a>');
  } else {
    res.sendFile(path.join(__dirname, 'static', 'delete.html'));
  }
});

app.get('/loginout', (req, res) => {
  if (id == 0) {
    res.sendFile(path.join(__dirname, 'static', 'login.html'));
  } else {
    id = 0;
    username = 'Not logged in';
    res.send('You have been logged out.<br/><a href="/">Go back.</a>');
  }
});

app.get('/upun', (req, res) => {
  if (id == 0) {
    res.send('You are currently not logged in.<br/><a href="/">Go back.</a>');
  } else {
    res.sendFile(path.join(__dirname, 'static', 'upuser.html'));
  }
});

app.get('/uppwd', (req, res) => {
  if (id == 0) {
    res.send('You are currently not logged in.<br/><a href="/">Go back.</a>');
  } else {
    res.sendFile(path.join(__dirname, 'static', 'uppass.html'));
  }
});

app.post('/createacc', (req, res) => {
  let sql = 'INSERT INTO users (username, password, salt) VALUES (?,?,?)';
  let salt = bcrypt.genSaltSync(10);
  if (sanitize(req.body.un) && sanitize(req.body.pwd)) {
    db.run(sql, [req.body.un, bcrypt.hashSync(req.body.pwd, salt), salt], (err) => {
      if (err) {
        res.send('This username is already taken.<br/><a href="/create">Click to go back to account creation.</a>');
      } else {
        res.send('Your account has been created. You are now logged in.<br/><a href="/">Go back.</a>');
        username = req.body.un;
        db.all('SELECT * FROM users WHERE username = ?', username, (err, rows) => {
          if (err) {
            console.error(err.message);
            res.send('An unknown error occurred.<br/><a href="/">Go back.</a>');
          } else {
            console.log(rows);
            id = rows[0]["id"];
          }
        });
      }
    });
  } else {
    res.send('Your username and/or password is not valid for at least one of:<ul><li>Not being at least 5 characters long</li><li>Not meeting character restrictions</li></ul><a href="/create">Go back to account creation.</a>');
  }
});

app.post('/login', (req, res) => {
  if (!sanitize(req.body.un)) {
    res.sendFile(path.join(__dirname, 'static', 'fail.html'));
  } else {
    let sql = 'SELECT * FROM users WHERE username = ?';
    db.all(sql, req.body.un, (err, rows) => {
      if (rows.length == 0) {
        res.sendFile(path.join(__dirname, 'static', 'fail.html'));
      } else {
        if (!sanitize(req.body.pwd) || rows[0]["password"] !== bcrypt.hashSync(req.body.pwd, rows[0]["salt"])) {
          res.sendFile(path.join(__dirname, 'static', 'fail.html'));
        } else {
          id = rows[0]["id"];
          username = req.body.un;
          res.send('Successfully logged in.<br/><a href="/">Go back to the homepage.</a>');
          console.log(rows[0]);
        }
      }
    });
  }
});

app.post('/del', (req, res) => {
  if (!sanitize(req.body.pwd)) {
    res.send('Failed to delete your account.<br/><a href="/delete">Go back to deletion.</a>');
  } else {
    let sql = 'SELECT * FROM users WHERE id = ?';
    db.all(sql, id, (err, rows) => {
      if (err) {
        console.error(err.message);
        res.send('An unknown error occurred.<br/><a href="/">Go back.</a>');
      } else if (rows.length == 0) {
        res.send('Failed to delete your account.<br/><a href="/delete">Go back to deletion.</a>');
      } else {
        if (rows[0]["password"] == bcrypt.hashSync(req.body.pwd, rows[0]["salt"])) {
          db.run('DELETE FROM users WHERE id = ?', id, (err) => {
            if (err) {
              console.error(err.message);
              res.send('An unknown error occurred.<br/><a href="/">Go back.</a>');
            } else {
              id = 0;
              username = 'Not logged in';
              res.send('Successfully deleted your account.<br/><a href="/">Go back to the homepage.</a>');
            }
          });
        } else {
          res.send('Failed to delete your account.<br/><a href="/delete">Go back to deletion.</a>');
        }
      }
    });
  }
});

app.post('/newun', (req, res) => {
  if (!sanitize(req.body.un)) {
    res.send('Failed to change username: username breaks at least one of the character restrictions.<br/><a href="/upun">Choose another username.</a>');
  } else {
    let sql = 'UPDATE users SET username = ? WHERE id = ?';
    db.run(sql, [req.body.un, id], (err) => {
      if (err) {
        res.send('Failed to change username: username is already taken.<br/><a href="/upun">Choose another username.</a>');
      } else {
        username = req.body.un;
        res.send(`Successfully changed your username to ${req.body.un}.<br/><a href="/">Go back.</a>`);
      }
    });
  }
});

app.post('/newpwd', (req, res) => {
  if (!sanitize(req.body.opass)) {
    res.send('Failed to change password: incorrect password entered.<br/><a href="/uppwd">Try again.</a>');
  } else {
    let sql = 'SELECT * FROM users WHERE id = ?';
    db.all(sql, id, (err, rows) => {
      console.log(rows);
      if (err) {
        console.error(err.message);
        res.send('An unknown error occurred.<br/><a href="/">Go back.</a>');
      } else if (rows[0]["password"] != bcrypt.hashSync(req.body.opass, rows[0]["salt"])) {
        res.send('Failed to change password: incorrect password entered.<br/><a href="/uppwd">Try again.</a>');
      } else {
        if (!sanitize(req.body.npass)) {
          res.send('Failed to change password: does not meet restrictions.<br/><a href="/uppwd">Try again.</a>');
        } else {
          db.run('UPDATE users SET password = ? WHERE id = ?', [bcrypt.hashSync(req.body.npass, rows[0]["salt"]), id], (err)=>{
            if (err) {
              console.error(err.message);
              res.send('An unknown error occurred.<br/><a href="/">Go back.</a>');
            } else {
              res.send('Successfully changed password!<br/><a href="/">Go back.</a>');
            }
          });
        }
      }
    });
  }
});

app.listen(3000);
