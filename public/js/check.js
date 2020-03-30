/* global L fetchJSON */

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

const SCALAR_E7 = 0.0000001;

async function process(file) {
  let chunkrequestlist = [];
  let pts = JSON.parse(await file.text()).locations.map(loc => {
    const l =  {
      lat: loc.latitudeE7 * SCALAR_E7,
      lng: loc.longitudeE7 * SCALAR_E7,
      tmprl: loc.timestampMS / (1000 * 60 * 60 * (100))
    };
    // Each chunk is a square 10th of a degree
    chunkrequestlist.push({
      lat: Math.round(l.lat*10)/10,
      lng: Math.round(l.lng*10)/10,
      tmprl: Math.round(l.tmprl*10)/10,
    });
    return l;
  });

  let chunks = chunkrequestlist.map(chr => await fetchJSON(chr));
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
