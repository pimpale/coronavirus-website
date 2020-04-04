'use strict';
// Imports
const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const compression = require('compression');

let client;
let db;
let app;


/**
 * Takes a post request, and loads the body into the mongodb
 * Dont call manually
 * @param {req} req The express request
 * @param {res} res The express response
 */
function uploadLocations(req, res) {
  db.insertMany(req.body.map((x) => ({
    latitude: x.latitude,
    longitude: x.longitude,
    timestamp: x.timestamp,
    ip: req.ip,
  })), (err, _) => {
    if (err) {
      throw err;
    }
  });
  res.end();
}

/**
 * Takes a get request and gives all the files in the chunk
 * Dont call manually
 * @param {req} req The express request
 * @param {res} res The express response
 */
function downloadChunk(req, res) {
  const chunk = {
    chunk_lat: req.query.chunk_lat,
    chunk_lng: req.query.chunk_lng,
    chunk_tmprl: req.query.chunk_tmprl,
  };
  console.log('got here!:', chunk);

  res.send(mapdata[chunk]);
  res.end();
}

/**
 * Initializes the mongodb database, creating collections if they don't
 * already exist also initializes express
 */
async function initialize() {
  // Initialize mongodb connection
  client = await mongodb.MongoClient.connect(`mongodb://localhost`, {useNewUrlParser: true, useUnifiedTopology: true});
  db = client.db('test');

  // If we haven't initialized a collection, do so now
  if (!await db.listCollections({name: 'locations'}).hasNext()) {
    await db.createCollection('locations', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['latlng', 'longitude', 'timestamp', 'ip'],
          properties: {
            latitude: {
              bsonType: 'double',
              description: 'the latitude of this point',
            },
            longitude: {
              bsonType: 'double',
              description: 'the longitude of this point',
            },
            timestamp: {
              bsonType: 'long',
              description: 'the milliseconds since 1970 of this point',
            },
            ip: {
              bsonType: 'string',
              description: 'ip address of the submitter',
            },
          },
        },
      },
    });
    await db.locations.createIndex({latitude: 1, longitude: 1, timestamp: 1});
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
  app.use(express.static('webapp'));
}

/**
 * Executes the tasks of the app
 */
async function main() {
  await initialize();
  app.listen(8080, () => console.log(`App started successfully!`));
}

main();
