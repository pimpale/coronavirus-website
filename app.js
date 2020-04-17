/* globals require */

'use strict';
// Imports
const express = require('express');
const sqlite3 = require('better-sqlite3');
const bodyParser = require('body-parser');
const compression = require('compression');
const {check, validationResult} = require('express-validator');

let db;
let app;

function locToBox(loc) {
  return {
    lat_min: loc.latitude - 0.1,
    lat_max: loc.latitude + 0.1,
    lng_min: loc.longitude - 0.1,
    lng_max: loc.longitude + 0.1,
    ts_min: loc.timestamp,
    ts_max: loc.timestamp + 10e7, // 27.7 hours after you leave
    true_lat: loc.latitude,
    true_lng: loc.longitude,
    true_ts: loc.timestamp,
  }
}

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


  const upload = db.transaction(function(locations, ip, email, infect_start) {
    const upload_id = db.prepare('INSERT INTO uploads(id, ip, email, infect_start) VALUES(null, ?, ?, ?)').run(ip, email, infect_start);
    const insertLocBox = db.prepare('INSERT INTO locations_cache' +
      '(id, lat_min, lat_max, lng_min, lng_max, ts_min, ts_max, true_lat, true_lng, true_ts, upload_id) ' +
      'VALUES(null, $lat_min, $lat_max, $lng_min, $lng_max, $ts_min, $ts_max, $true_lat, $true_lng, $true_ts, ?)');
    for (const loc of locations) {
      insertLocBox.run(
        upload_id, // upload_id
        locToBox(loc), // the data
      );
    }
  });

  // TODO what if no email or ip?
  upload(req.body.locs, req.ip, req.body.email, req.body.infect_start);

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

  // intersections is a Map<timestamp, Array of intersections>
  const locs = req.body.locs;
  let intersections = [];

  const intersectingBoxes = db.prepare('SELECT l.true_lat, l.true_lng, l.true_ts, u.infect_start ' +
    'FROM locations l INNER JOIN uploads u ON l.upload_id = u.id ' +
    'WHERE l.lat_min < $latitude AND l.lat_max > $latitude ' +
    'AND l.lng_min < $longitude AND l.lng_max > $longitude ' +
    'AND l.ts_min < $timestamp AND l.ts_max > $timestamp');
  for(let i = 0; i < locs.length; i++) {
    const loc = locs[i];
    for(const intersection of intersectingBoxes.all(loc)) {
      intersection['contact'] = loc;
      intersections.push(intersection);
    }
  }

  res.send(intersections);
  res.end();
}

/**
 * Initializes the mongodb database, creating collections if they don't
 * already exist also initializes express
 */
async function initialize() {
  // Initialize mongodb connection
  db = new sqlite3('./database.sqlite3');

  app = express();
  // configure to use body parser
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

  app.use(compression());
  // Add methods
  app.post('/api/uploadlocations/', [
    check('locs.*.latitude', 'must be valid latitude in float form').isFloat(),
    check('locs.*.longitude', 'must be valid longitude in float form').isFloat(),
    check('locs.*.timestamp', 'must be valid timestamp in ms since 1970').isInt(),
    check('infect_start').isInt(),
    check('email').isEmail(),
  ], uploadLocations);
  app.post('/api/checklocations/', [
    // Ensure user puts in all of the necessary values
    check('locs.*.latitude', 'must be valid latitude in float form').isFloat(),
    check('locs.*.longitude', 'must be valid longitude in float form').isFloat(),
    check('locs.*.timestamp', 'must be valid timestamp in ms since 1970').isInt(),
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
