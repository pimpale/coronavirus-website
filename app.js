'use strict'
// Imports
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const compression = require('compression')

let client;
let db;
let app;


function uploadLocations(req, res) {

  db.insertMany(req.body.map(x => ({ 
    latitude: x.latitude, 
    longitude: x.longitude, 
    timestamp: x.timestamp, 
    ip: req.ip
  })), (err, _) => {
    if(err) {
      throw err;
    }
  })



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
  // Initialize mongodb connection
  client = await mongodb.MongoClient.connect(`mongodb://localhost:27017`, {useNewUrlParser: true, useUnifiedTopology: true});
  db = client.db('test');

  // If we haven't initialized a collection, do so now
  if (!db.listCollections({name: 'locations'}).hasNext()) {
    db.createCollection("locations",
      {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["latlng", "longitude", "timestamp", "ip"],
            properties: {
              latitude: {
                bsonType: "number",
                description: "the latitude of this point"
              },
              longitude: {
                bsonType: "number",
                description: "the longitude of this point"
              },
              timestamp: {
                bsonType: "integer",
                description: "the milliseconds since 1970 of this point"
              },
              ip: {
                bsonType: "string",
                description: "ip address of the submitter"
              }
            }
          }
        }
      });
    db.locations.createIndex({latitude:1, longitude:1, timestamp:1});
  }

  app = express();
  // configure to use body parser
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.use(compression());
  // Add methods
  app.post('/api/uploadlocations/', uploadLocations);
  app.get('/api/downloadchunk/', downloadChunk);

  // serve static files
  app.use(express.static('public'));
}

async function main() {
  await initialize();
  app.listen(8080, () => console.log(`App started successfully!`));
}

main();
