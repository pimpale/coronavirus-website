/* global L fetchJson apiUrl */

$(function () {
  $('input[name="daterange"]').daterangepicker({
    opens: 'left'
  }, function (start, end, label) {
    console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
  });
});

function loadmap() {
  let leafletmap = L.map('mapid');
  leafletmap.setView([0, 0], 2);
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    minZoom: 2,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoicGltcGFsZSIsImEiOiJjazhkbzk4NTIwdHkzM21vMWFiNHIzZ3BiIn0.nLv4P71SFh4TIANuwJ8I9A'
  }).addTo(leafletmap);
}


$(function () {
  $('input[name="daterange"]').daterangepicker({
    opens: 'left'
  }, function (start, end, label) {
    // TODO
    console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
  });
});

const SCALAR_E7 = 10e-7;

async function process(file) {
  let activechunks = new Set();

  let pts = JSON.parse(await file.text()).locations.map(loc => {
    let latitude = loc.latitudeE7 * SCALAR_E7;
    let longitude = loc.longitudeE7 * SCALAR_E7;
    let temporal = loc.timestampMs / (1000 * 60 * 60);

    // Each chunk is a square 10th of a degree
    // SCALAR_E1
    activechunks.add({
      lat: Math.round(latitude * 10),
      lng: Math.round(longitude * 10),
      tmprl: Math.round(temporal.tmprl * 10),
    });

    return {
      lat: latitude,
      lng: longitude,
      tmprl: temporal,
    };
  });

  let chunks = activechunks.values().map(chr => 
    fetchJson(`${apiUrl()}/downloadchunk/?chunk_lat=${chr.lat}&chunk_lng=${chr.lng}&chunk_tmprl=${chr.tmprl}`)
  );
}


function loadfilehandler() {
  $('#customFile').change(async function () {
    await process(this.files[0]);
  });
}

$(document).ready(async function () {
  loadmap();
  loadfilehandler();
});
