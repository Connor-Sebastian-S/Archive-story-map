var imageContainerMargin = 70;  // Margin + padding

// This watches for the scrollable container
var scrollPosition = 0;
$('div#contents').scroll(function() {
  scrollPosition = $(this).scrollTop();
});

const startDate = '1200' + '-01-01';
const endDate = '2024' + '-12-31';
const initDate = '1700' + '-01-01';
var mapCenter = [56.563729541410666, -3.584791427303605];


function initMap() {

  // This creates the Leaflet map with a generic start point, because code at bottom automatically fits bounds to all markers
  var map = L.map('map', {
    center: mapCenter,
    zoom: 15,
    scrollWheelZoom: false,
    zoomControl: false
  });

  // This displays a base layer map (other options available)
  // var lightAll = new L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  //   attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  // }).addTo(map);

  var ohmLayer = new L.MapboxGL({
      attribution: "OpenHistoricalMap",
      style: OHM_MAP_STYLE,
      accessToken: "no-token"
  });

  ohmLayer.addTo(map);

  map.dragging.disable();
  map.touchZoom.disable();
  map.doubleClickZoom.disable();
  map.scrollWheelZoom.disable();
  map.boxZoom.disable();
  map.keyboard.disable();

  const tsoptions = {
      vectorLayer: ohmLayer,
      vectorSourceName: 'osm',
      range: [startDate, endDate],
      date: initDate,
      stepInterval: 1,
      stepAmount: '1year',
      onDateChange: function (date) {
          dateChange(date);
      },
      onRangeChange: function (range) {},
      onReady: function () {document.querySelector('.leaflet-ohm-timeslider-datereadout span[data-timeslider="datereadout"]').textContent = initDate;  },
      autoplayIsRunning: function () {},
      autoplayPause: function () {},
      autoplayStart: function () {},
      autoplayStartBackwards: function () {}
  };

  TIMESLIDER = new L.Control.OHMTimeSlider(tsoptions).addTo(map);


  // This customizes link to view source code; add your own GitHub repository
  map.attributionControl
  .setPrefix('');

  // This loads the GeoJSON map data file from a local folder
  $.getJSON('map.geojson', function(data) {
    var geojson = L.geoJson(data, {
      onEachFeature: function (feature, layer) {
        (function(layer, properties) {
          // This creates numerical icons to match the ID numbers
          // OR remove the next 6 lines for default blue Leaflet markers
          var numericMarker = L.ExtraMarkers.icon({
            icon: 'fa-number',
            number: feature.properties['id'],
            markerColor: 'blue'
          });
          layer.setIcon(numericMarker);

          // This creates the contents of each chapter from the GeoJSON data. Unwanted items can be removed, and new ones can be added
          var containerSource = $("#container-template").html();
          var containerTemplate = Handlebars.compile(containerSource);

          var output = {
            "containerId": 'container' + feature.properties['id'],
            "chapter": feature.properties['chapter'],
            "imgSrc": feature.properties['image'],
            "srcHref": feature.properties['source-link'],
            "srcText": feature.properties['source-credit'],
            "description": feature.properties['description'],
            "year": feature.properties['year']
          }
          var html = containerTemplate(output);
          $('#contents').append(html);

          var i;
          var areaTop = -100;
          var areaBottom = 0;

          // Calculating total height of blocks above active
          for (i = 1; i < feature.properties['id']; i++) {
            areaTop += $('div#container' + i).height() + imageContainerMargin;
          }

          areaBottom = areaTop + $('div#container' + feature.properties['id']).height();

          $('div#contents').scroll(function() {
            if ($(this).scrollTop() >= areaTop && $(this).scrollTop() < areaBottom) {
              $('.image-container').removeClass("inFocus").addClass("outFocus");
              $('div#container' + feature.properties['id']).addClass("inFocus").removeClass("outFocus");

              map.flyTo([feature.geometry.coordinates[1], feature.geometry.coordinates[0] ], feature.properties['zoom']);
              TIMESLIDER.setDate(feature.properties['year']);
            }
          });

          // Make markers clickable
          layer.on('click', function() {
            $("div#contents").animate({scrollTop: areaTop + "px"});
          });

        })(layer, feature.properties);
      }
    });

    $('div#container1').addClass("inFocus");
    $('#contents').append("<div class='space-at-the-bottom'><a href='#space-at-the-top'><i class='fa fa-chevron-up'></i></br><small>Top</small></a></div>");
    map.fitBounds(geojson.getBounds());
    geojson.addTo(map);
  });
}

initMap();
