"use strict"

var dateLastUpdate = 0;
var feedList = [];

function appendFeed(username, message, id)
{
  var table = document.getElementById("message-feed");
  if(table.rows.length < 1) {
    clearFeed();
  }
  if(!feedList.includes(id)) {
    table.insertRow(1).innerHTML=
      ('<tr>' +
      '<td>' + username+ '</td>' +
      '<td>' + message + '</td>' +
      '</tr>');
    feedList.push(id);
  }
}

function clearFeed()
{
  feedList = [];
  document.getElementById('message-feed').innerHTML =
            '<tr class="dark-gray">' +
              '<td>Name</td>' +
              '<td>Message</td>' +
            '</tr>';
}

//gets new data from server and inserts it at the beginning
function updateFeed() {
  $.ajax({
    url: thisUrl()+'/api/get-message/?min='+dateLastUpdate,
    type: 'GET',
    success: result => {
      console.log(result);
      result.forEach(msg => appendFeed(msg.username, msg.message, msg.id));
    },
    error: error => console.log('request failed'),
  });
  dateLastUpdate = Date.now();
}

//actually sends http request to server
function sendMessage(username, message) {
  var url = thisUrl()+'/api/new-message/?username='+encodeURI(username)+'&message='+encodeURI(message);
  $.ajax({
    url: url,
    type: 'GET',
    success: result => undefined,
    error: error => console.log(error),
  });
}

function attemptMessageSubmit() {
  var userNameTextBox = document.getElementById('user-name-textbox');
  var messageTextBox = document.getElementById('message-textbox');
  var username = userNameTextBox.value;
  var message = messageTextBox.value;
    if(isValidString(username) && isValidString(message)) {
    sendMessage(username, message);
    setTimeout(updateFeed, 250);
    messageTextBox.value = '';
  }
}

function grayOutOrangeButton(element) {
  element.classList().remove("deep-orange");
  element.classList().add("gray");
}

function orangeGrayButton(element) {
  element.classList().remove("gray");
  element.classList().add("deep-orange");
}

function setDate(tstamp) {
  dateLastUpdate = tstamp;
}

$(document).ready(function() {
  sendMessage('welcome-agent', 'Welcome to this messaging server. Stay dank');
  updateFeed();
});



$(document).ready(function () {
  var tbox = document.getElementById('message-textbox');
  tbox.addEventListener('keydown', function (event) {
    if (event.keyCode === 13) {
      attemptMessageSubmit();
    }
  });

  setInterval(updateFeed, 1000);
});

