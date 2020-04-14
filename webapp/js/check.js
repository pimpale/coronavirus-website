/* global moment sleep L fetchJson apiUrl */

const minTimestamp = moment('2017').valueOf();
const maxTimestamp = moment('2018').valueOf();

// the map
let map = null;

// The {latitude, longitude, timestamp} groups
let points = null;


// list of all markers
let markers = [];

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

  map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    drawnItems.addLayer(layer);
  });
}

function addMarker(latlng, html) {
  let marker = new L.Marker(latlng);
  map.addLayer(marker);
  if (html != null) {
    marker.bindPopup(html);
  }
  markers.push(marker);
}


/**
 * renderMap: Renders the markers on the map, making sure to ignore areas that are covered
 * with a block. Also ignores the areas outside of the given time range Domain: [minT, maxT)
 * @param minT {int} minimum time in ms to render
 * @param maxT {int} maximum time in ms to render
 */
async function renderMap(minT, maxT) {
  $('#map-progress-div').show();

  $('#map-daterange').data('ionRangeSlider').update({
    block: true,
  });

  // Calculate the points that fit within these places
  const timely_points = points.filter((x) => x.timestamp >= minT && x.timestamp < maxT);
  const timely_points_length = timely_points.length;

  let lastloc = null

  for (let i = 0; i < timely_points.length; i++) {
    // get current location
    let loc = timely_points[i]
    if (lastloc != null) {
      if (Math.hypot(loc.latitude - lastloc.latitude, loc.longitude - lastloc.longitude) > 0.01) {
        await sleep(1);
        $('#map-progress').css('width', `${(i * 100.0)/timely_points_length}%`);
        addMarker([loc.latitude, loc.longitude], moment(loc.timestamp).format('MMM D, hh:ss a'));
      }
      lastloc = loc;
    } else {
      addMarker([loc.latitude, loc.longitude]);
      lastloc = loc;
    }
  }

  $('#map-daterange').data('ionRangeSlider').update({
    block: false,
  });

  $('#map-progress-div').hide();
  $('#map-progress').css('width', '0%');
}

/**
 * totally clean
 */
function cleanMap() {
  for(let i = 0; i < markers.length; i++) {
    map.removeLayer(markers[i]);
  }
  markers = [];
}

/**
 * Instruction step 0
 */
async function instruction0() {
  $('#mapdiv').hide();
  $('#mapinfo-title').html('Map');
  $('#mapinfo-subtext').html('Complete step 1 in order to load your data.');
  $('#instruction1-selectfile').prop('disabled', true);
  await instruction1();
}

/**
 * when the file handler loads a file, we process it
 */
async function instruction1() {
  // when a file is uploaded
  $('#customFile').change(async function () {
    const f = this.files[0];
    // enable the button and set a listener
    $('#instruction1-selectfile').prop('disabled', false);
    $('#instruction1-selectfile').button().click(async function () {
      $('#instruction1-selectfile').prop('disabled', true);
      await instruction2(f);
    });
  });
}

/**
 * we initialize the methods for the user to begin excluding data
 */
async function instruction2(file) {
  $('#mapinfo-title').html('Your Locations');
  $('#mapinfo-subtext').html(`Use the slider below to select the date ranges
    you want to check. Use the rectangle tool to exclude areas from the check.
    Note that your data must be under 10MB for upload`);

  // corona didn't really get started till 2020
  points = JSON.parse(await file.text()).locations
    .filter((loc) => loc.timestampMs >= minTimestamp && loc.timestampMs < maxTimestamp)
    .map((loc) => ({
      latitude: loc.latitudeE7 * 10e-8,
      longitude: loc.longitudeE7 * 10e-8,
      timestamp: parseInt(loc.timestampMs),
    }));

  $('#mapdiv').show();

  await renderMap(minTimestamp, maxTimestamp);
}

function loadslider() {
  $('#map-daterange').ionRangeSlider({
    skin: 'round',
    type: 'double',
    grid: true,
    min: minTimestamp,
    max: maxTimestamp,
    from: minTimestamp,
    to: maxTimestamp,
    prettify: (ts) => moment(ts).format('MMM D, YYYY'),
    onFinish: async function () {
      // retrieve the millisecond range permitted
      const to = $('#map-daterange').data('to')
      const from = $('#map-daterange').data('from')
      cleanMap();
      await renderMap(from, to);
    },
  });
}

$(document).ready(async function () {
  loadmap();
  loadslider();
  // begin the process
  await instruction0();
});




