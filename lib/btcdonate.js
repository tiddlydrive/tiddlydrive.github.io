/*
 *
 * Original popup magic from: http://jqueryfordesigners.com/coda-popup-bubbles.1.html
 *
 */
var btcdonate = function(options){

  if (!options) {
    options = {}
  }

  var qr = {
    fill:   options.fill   || "#f7931a",
    radius: options.radius || 0.3
  };

  // Wrap all links containing href="bitcoin:..." so that we can operate on them
  $("a[href^=bitcoin],a[data-btcaddress]")
    .addClass("btcdonate-trigger")
    .wrap('<span class="btcdonate"></span>');

  // Append the bubble and attach the hide/show effects for it
  $('.btcdonate').each(function () {

    // Options
    var distance       = 10;
    var time           = 250;
    var hideDelay      = 500;
    var hideDelayTimer = null;

    // Tracker
    var beingShown = false;
    var shown      = false;

    var trigger = $('.btcdonate-trigger', this).get(0);
    var address = $(trigger).attr("data-btcaddress") || $(trigger).attr("href");
    if (address.indexOf("bitcoin:")) {
      address = "bitcoin:" + address;
    }

    var $qr = $('<div class="btcdonate-qr"></div>')
      .qrcode({
        size: 128,
        fill: qr.fill,
        radius: qr.radius,
        text: address.replace("bitcoin:", ""),
        render: "image"
      });

    var $bubble = $('<div class="btcdonate-bubble"></div>')
      .css("opacity", 0)
      .append($qr)
      .append('<div class="btcdonate-address">' + address.replace("bitcoin:", "").replace(/\?.*/, "") + '</div>');

    $(this).append($bubble);

    // Set the mouseover and mouseout on both elements
    $([trigger, $bubble.get(0)]).mouseover(function () {

      var bubble_offset_vertical = ($bubble.height() + 25) * -1;
      var bubble_offset_horizontal = (($bubble.width() - $(trigger).width()) / 2) * -1;

      // Stops the hide event if we move from the trigger to the popup element
      if (hideDelayTimer) {
        clearTimeout(hideDelayTimer);
      }

      // Don't trigger the animation again if we're being shown, or already visible
      if (!beingShown && !shown) {

        beingShown = true;

        // reset position of popup box
        $bubble
          .css({
            top: bubble_offset_vertical,
            left: bubble_offset_horizontal,
            display: "block",
              position: "absolute"
          })
          .animate({
            top: '-=' + distance + 'px',
            opacity: 1
          }, time, 'swing', function() {
            beingShown = false;
            shown = true;
          });
      }

    }).mouseout(function () {

      // Reset the timer if we get fired again - avoids double animations
      if (hideDelayTimer) {
        clearTimeout(hideDelayTimer);
      }

      // Store the timer so that it can be cleared in the mouseover if required
      hideDelayTimer = setTimeout(function (){
        hideDelayTimer = null;
        $bubble.animate({
          top: '-=' + distance + 'px',
          opacity: 0
        }, time, 'swing', function () {
          // Once the animate is complete, set the tracker variables
          shown = false;
          // Hide the popup entirely after the effect (opacity alone doesn't do the job)
          $bubble.css('display', 'none');
        });
      }, hideDelay);

    });
  });

};
