// Imports
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

let mapdata = {};

// serve static files
app.use(express.static('public'));

// configure to use body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.get('/api/uploadlocation/', function (req, res) {
  let latitude = req.query.lat;
  let longitude = req.query.lng;
  let temporal = req.query.tmprl;

  let chunk = {
    chunk_lat: Math.round(latitude * 10),
    chunk_lng: Math.round(longitude * 10),
    chunk_tmprl: Math.round(temporal * 10),
  }

  let loc = {
    lat: latitude,
    lng: longitude,
    tmprl: temporal
  };

  if (chunk in mapdata) {
    mapdata[chunk].push(loc);
  } else {
    mapdata[chunk] = [loc];
  }

  res.end()
});

app.get('/api/downloadchunk/', function (req, res) {

  let chunk = {
    chunk_lat: req.query.chunk_lat,
    chunk_lng: req.query.chunk_lng,
    chunk_tmprl: req.query.chunk_tmprl,
  }

  res.send(mapdata[chunk]);
  res.end()
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
