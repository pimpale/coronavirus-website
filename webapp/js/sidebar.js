'use strict'

$(document).ready(function() {
  $('#sidebar-toggle').click(function() {
    $(this).blur();
    $('#sidebar').toggle();
    $('#content-wrapper').toggleClass('not-sidebar');
  });
});
