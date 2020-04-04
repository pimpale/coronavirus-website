'use strict'
// Imports
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const assert = require('assert');

let client;
let db;
let app;


function uploadLocation(req, res) {
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
}

function downloadChunk(req, res) {
  let chunk = {
    chunk_lat: req.query.chunk_lat,
    chunk_lng: req.query.chunk_lng,
    chunk_tmprl: req.query.chunk_tmprl,
  }
  console.log('got here!:', chunk);

  res.send(mapdata[chunk]);
  res.end()
}

async function initialize() {
  client = await mongodb.MongoClient.connect(`mongodb://localhost:27017`, {useNewUrlParser: true, useUnifiedTopology: true});
  db = client.db('test');
  app = express();
  // configure to use body parser
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  // Add methods
  app.get('/api/uploadlocation/', uploadLocation);
  app.get('/api/downloadchunk/', downloadChunk);

  // serve static files
  app.use(express.static('public'));
}

async function main() {
  await initialize();
  app.listen(8080, () => console.log(`App started successfully!`));
  // Once we're done save files
  client.close();
}

main();
