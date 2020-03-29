// Imports
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

let msglist = [];

// serve static files
app.use(express.static('public'));

// configure to use body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let idCounter = 0;

app.get('/api/new-message/', function(req, res) {
  let username = req.query.username;
  let message = req.query.message;

  if(username != null && message != null) {
    let msg = {
      id: idCounter,
      date: Date.now(),
      username: username,
      message: message,
    };
    msglist.push(msg);
    idCounter++;
  }
  res.end()
});

app.get('/api/get-message/', function(req, res) {
  // get dates in milliseconds
  let mindate = req.query.min == null ? new Date(0) : new Date(parseInt(req.query.min, 10));
  let maxdate = req.query.max == null ? new Date() : new Date(parseInt(req.query.max, 10));
  // filter by dates
  res.send(msglist.filter(msg => msg.date >= mindate && msg.date <= maxdate));

  res.end();
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
