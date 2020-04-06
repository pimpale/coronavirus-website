/* global L fetchJson apiUrl */

let map = null;

/**
 * loads the map
 */
function loadmap() {
  map = L.map('mapid');
  map.setView([0, 0], 2);

  const osm = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: ('Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'),
    maxZoom: 18,
    minZoom: 2,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoicGltcGFsZSIsImEiOiJjazhkbzk4NTIwdHkzM21vMWFiNHI' +
      'zZ3BiIn0.nLv4P71SFh4TIANuwJ8I9A',
  });

  osm.addTo(map);

  const drawnItems = L.featureGroup().addTo(map);

  map.addControl(new L.Control.Draw({
    position: 'topright',
    edit: {
      featureGroup: drawnItems,
      poly: {
        allowIntersection: false,
      },
    },
    draw: {
      featureGroup: drawnItems,
      polyline: false,
      polygon: false,
      circle: false,
      marker: false,
      rectangle: true,
      circlemarker: false,
    },
  }));

  map.on(L.Draw.Event.CREATED, function(event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);
  });
}


$(() => {
  $('input[name="daterange"]').daterangepicker({
    opens: 'left',
  }, (start, end, label) => {
    // TODO
    console.log('A new date selection was made: ' + start.format('YYYY-MM-DD') +
      ' to ' + end.format('YYYY-MM-DD'));
  });
});

const SCALAR_E7 = 10e-8;

/**
 * Converts a latitude, longitude, and timestamp into reasonably sized
 * chunks with a minimum and maximum lat, lng, and tmp
 * @param {number} latitude the latitude
 * @param {number} longitude the longitude
 * @param {int} timestamp the timestamp in milliseconds since 1970
 * @return {Object} an object containing the minimum and maximum parameters
 */
function chunkify(latitude, longitude, timestamp) {
  // round up 1 decimal place
  const latlngTrunc = (x) => Math.trunc(x * 10);
  const latlngRoundD = (x) => latlngTrunc(x) / 10;
  const latlngRoundU = (x) => (latlngTrunc(x) + 1) / 10;
  const timestampTrunc = (x) => Math.trunc(x / 10e5);
  const timestampRoundD = (x) => timestampTrunc(x) * 10e5;
  const timestampRoundU = (x) => (timestampTrunc(x) + 1) * 10e5;
  return {
    latMin: latlngRoundD(latitude),
    latMax: latlngRoundU(latitude),
    lngMin: latlngRoundD(longitude),
    lngMax: latlngRoundU(longitude),
    tmpMin: timestampRoundD(timestamp),
    tmpMax: timestampRoundU(timestamp),
  };
}

/**
 * Sends requests to the server
 * @param {File} file: the file to process
 */
async function process(file) {
  const chunkrequesturls = new Set();

  const pts = JSON.parse(await file.text()).locations.map((loc) => {
    const latitude = loc.latitudeE7 * SCALAR_E7;
    const longitude = loc.longitudeE7 * SCALAR_E7;
    const timestamp = loc.timestampMs;

    if (Math.random() > 0.999) {
      // let marker = L.marker([latitude, longitude]).addTo(map);
    }

    // while we're processing this, we need to generate a list of chunks.
    // these chunks represent the area * time we will ask for data
    // Each chunk is a square 10th of a degree
    // SCALAR_E1
    const chunk = chunkify(latitude, longitude, timestamp);
    chunkrequesturls.add(`${apiUrl()}/downloadchunk/` +
      `?lat_min=${chunk.latMin}` +
      `&lat_max=${chunk.latMax}` +
      `&lng_min=${chunk.lngMin}` +
      `&lng_max=${chunk.lngMax}` +
      `&tmp_min=${chunk.tmpMin}` +
      `&tmp_max=${chunk.tmpMax}`);

    // return the transformed object
    return {
      latitude: latitude,
      longitude: longitude,
      timestamp: timestamp,
    };
  });

  const chunks = Array.from(chunkrequesturls).map((cru) => fetchJson(cru));
  console.log(chunks);
}


/**
 * when the file handler loads a file, we process it
 */
function loadfilehandler() {
  $('#customFile').change(async function() {
    await process(this.files[0]);
  });
}

$(document).ready(async function() {
  loadmap();
  loadfilehandler();
});
