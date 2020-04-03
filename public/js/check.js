/* global L fetchJson apiUrl */

$(function () {
  $('input[name="daterange"]').daterangepicker({
    opens: 'left'
  }, function (start, end, label) {
    console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
  });
});

function loadmap() {


  /*
  let osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  let osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  let osm = L.tileLayer(osmUrl, {maxZoom: 18, attribution: osmAttrib});
  let map = new L.Map('mapid', {center: new L.LatLng(51.505, -0.04), zoom: 13});
  let drawnItems = L.featureGroup().addTo(map);
  */


  let map = L.map('mapid');
  map.setView([0, 0], 2);

  let osm = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    minZoom: 2,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoicGltcGFsZSIsImEiOiJjazhkbzk4NTIwdHkzM21vMWFiNHIzZ3BiIn0.nLv4P71SFh4TIANuwJ8I9A'
  });

  osm.addTo(map);

  let drawnItems = L.featureGroup().addTo(map);

  map.addControl(new L.Control.Draw({
    position: 'topright',
    edit: {
      featureGroup: drawnItems,
      poly: {
        allowIntersection: false
      }
    },
    draw: {
      featureGroup: drawnItems,
      polyline: false,
      polygon: false,
      circle: false,
      marker: false,
      rectangle: true,
      circlemarker: false
    }
  }));

  map.on(L.Draw.Event.CREATED, function (event) {
    let layer = event.layer;

    drawnItems.addLayer(layer);
  });
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
  let chunkrequesturls = new Set();

  let pts = JSON.parse(await file.text()).locations.map(loc => {
    let latitude = loc.latitudeE7 * SCALAR_E7;
    let longitude = loc.longitudeE7 * SCALAR_E7;
    let temporal = loc.timestampMs / (1000 * 60 * 60 * 24);

    // Each chunk is a square 10th of a degree
    // SCALAR_E1
    chunkrequesturls.add(`${apiUrl()}/downloadchunk/?chunk_lat=${
      Math.round(latitude * 10)
      }&chunk_lng=${
      Math.round(longitude * 10)
      }&chunk_tmprl=${
      Math.round(temporal * 10)
      }`);
    return {
      lat: latitude,
      lng: longitude,
      tmprl: temporal,
    };
  });

  console.log(chunkrequesturls);

  let chunks = [];
  chunkrequesturls.forEach(chr => chunks.push(fetchJson(chr)));
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
