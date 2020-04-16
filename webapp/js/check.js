/* global moment sleep L apiUrl fetchJson */

const globalMinTimestamp = moment('2017').valueOf();
const globalMaxTimestamp = moment('2018').valueOf();

// the map
let map = null;

// The {latitude, longitude, timestamp} groups
let points = null;

// list of all markers
let markers = [];

// the square areas created by the user
let exclusionZones = [];
let minTimestamp = globalMinTimestamp;
let maxTimestamp = globalMaxTimestamp;

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
      edit:false,
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

  function genExclusionZones() {
    exclusionZones = [];
    drawnItems.eachLayer((l) => {
      exclusionZones.push(l.getBounds());
    })
  }

  map.on(L.Draw.Event.CREATED, async function (event) {
    if(!rendering) {
      drawnItems.addLayer(event.layer);
      genExclusionZones();
      await renderMap();
    }
  });

  map.on(L.Draw.Event.DELETED, async function (event) {
    if(!rendering) {
      drawnItems.removeLayer(event.layer);
      genExclusionZones();
      await renderMap();
    }
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

let rendering = false;

function getValidPoints() {
   return points
    .filter((x) => x.timestamp >= minTimestamp && x.timestamp < maxTimestamp)
    .filter((loc) => {
      for (const box of exclusionZones) {
        if (box.contains([loc.latitude, loc.longitude])) {
          return false
        }
      }
      return true;
    });
}

/**
 * Renders the markers on the map, making sure to ignore areas that are covered
 * with a block. Also ignores the areas outside of the given time range Domain: [minT, maxT)
 */
async function renderMap() {
  rendering = true;
  // clean map
  for (let i = 0; i < markers.length; i++) {
    map.removeLayer(markers[i]);
  }
  markers = [];

  $('#map-progress-div').show();

  $('#map-daterange').data('ionRangeSlider').update({
    block: true,
  });

  // Calculate the points that fit within these places
  const renderable_points = getValidPoints();
  // get the length
  const renderable_points_length = renderable_points.length;

  $('#instruction2-counter').html(`${(renderable_points_length/10e4).toFixed(2)}/10.00 Megabytes Used`)
  if(renderable_points/10e4 < 10) {
    $('#instruction2-confirm').prop('disabled', false);
  } else {
    $('#instruction2-confirm').prop('disabled', true);
  }

  let lastlatlng = null
  for (let i = 0; i < renderable_points_length; i++) {
    // get current location
    let loc = renderable_points[i]
    const latlng = [loc.latitude, loc.longitude]
    if (lastlatlng != null) {
      if (Math.hypot(latlng[0] - lastlatlng[0], latlng[1] - lastlatlng[1]) < 0.01) {
        continue;
      }
      lastlatlng = latlng;
    } else {
      lastlatlng = latlng;
    }

    await sleep(1);
    $('#map-progress').css('width', `${(i * 100.0) / renderable_points_length}%`);
    addMarker(latlng, moment(loc.timestamp).format('MMM D, hh:ss a'));
  }

  $('#map-daterange').data('ionRangeSlider').update({
    block: false,
  });

  $('#map-progress-div').hide();
  $('#map-progress').css('width', '0%');
  rendering = false;
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
  $('#instruction2-confirm').prop('disabled', false);
  $('#mapinfo-subtext').html(`Use the slider below to select the date ranges
    you want to check. Use the rectangle tool to block areas from the upload.
    Note that your data must be under 10MB for upload.`);

  // corona didn't really get started till 2020
  points = JSON.parse(await file.text()).locations
    .filter((loc) => loc.timestampMs >= minTimestamp && loc.timestampMs < maxTimestamp)
    .map((loc) => ({
      latitude: loc.latitudeE7 * 10e-8,
      longitude: loc.longitudeE7 * 10e-8,
      timestamp: parseInt(loc.timestampMs),
    }));

  $('#mapdiv').show();

  await renderMap();

  $('#instruction2-confirm').button().click(async function() {
    await instruction3();
  })
}

async function instruction3() {
  const ret = fetchJson(`${apiUrl()}/checklocations/`, {
    method:'post',
    body: JSON.stringify(getValidPoints)
  });
  console.log(ret);
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
      minTimestamp = $('#map-daterange').data('from')
      maxTimestamp = $('#map-daterange').data('to')
      await renderMap();
    },
  });
}

$(document).ready(async function () {
  loadmap();
  loadslider();
  // begin the process
  await instruction0();
});
