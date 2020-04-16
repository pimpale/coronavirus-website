/* globals require */

'use strict';
// Imports
const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const compression = require('compression');
const {check, validationResult} = require('express-validator');

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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({errors: errors.array()});
    return;
  }

  db.collection('locations').insertMany(req.body.map((x) => ({
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
 * Takes a post request with all the user's locations
 * For each of them, does a query to compare the location
 * Will probably crash...
 * Dont call manually
 * @param {req} req The express request
 * @param {res} res The express response
 */
function checkLocations(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({errors: errors.array()});
    return;
  }

  const locs = req.body.map((loc) => ({
    latitude: {$gte: loc.latitude - 0.1, $lt: loc.latitude + 0.1},
    longitude: {$gte: loc.longitude - 0.1, $lt: loc.longitude + 0.1},
    timestamp: {$gte: loc.timestamp - 10e7, $lt: loc.timestamp},
  }));

  console.log(locs);

  const results = db.collection('locations').find({$or: locs}, {
    projection: {
      _id: 0,
      ip: 0,
    },
  }).toArray();

  res.send(results);
  res.end();
}

/**
 * Initializes the mongodb database, creating collections if they don't
 * already exist also initializes express
 */
async function initialize() {
  // Initialize mongodb connection
  client = await mongodb.MongoClient.connect(`mongodb://localhost`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
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
    await db.collection('locations').createIndex({
      latitude: 1,
      longitude: 1,
      timestamp: 1,
    });
  }

  app = express();
  // configure to use body parser
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

  app.use(compression());
  // Add methods
  app.post('/api/uploadlocations/', [
    check('*.latitude', 'must be valid latitude in float form').isFloat(),
    check('*.longitude', 'must be valid longitude in float form').isFloat(),
    check('*.timestamp', 'must be valid timestamp in ms since 1970').isInt(),
  ], uploadLocations);
  app.post('/api/checklocations/', [
    // Ensure user puts in all of the necessary values
    //check('*.latitude', 'must be valid latitude in float form').isFloat(),
    //check('*.longitude', 'must be valid longitude in float form').isFloat(),
    //check('*.timestamp', 'must be valid timestamp in ms since 1970').isInt(),
  ], checkLocations);

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
