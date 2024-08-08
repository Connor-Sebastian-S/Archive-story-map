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

  // Create the Leaflet map
  var map = L.map('map', {
    center: mapCenter,
    zoom: 15,
    scrollWheelZoom: false,
    zoomControl: false
  });

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

  map.attributionControl.setPrefix('');

  // Load the GeoJSON data
  $.getJSON('map.geojson', function(data) {
    // Sort the features by the 'year' property (convert year to Date object for accurate sorting)
    data.features.sort(function(a, b) {
      return new Date(a.properties.year) - new Date(b.properties.year);
    });

    var geojson = L.geoJson(data, {
      onEachFeature: function (feature, layer) {
        (function(layer, properties) {
          var numericMarker = L.ExtraMarkers.icon({
            icon: 'fa-number',
            number: feature.properties['id'],
            markerColor: 'blue'
          });
          layer.setIcon(numericMarker);

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

          var areaTop = -100;
          var areaBottom = 0;

          // Recalculate areaTop and areaBottom based on the current order of elements
          $('div#contents').children().each(function(index, element) {
            if (element.id === 'container' + feature.properties['id']) {
              areaBottom = areaTop + $(element).height();
              return false; // break loop
            }
            areaTop += $(element).height() + imageContainerMargin;
          });

          $('div#contents').scroll(function() {
            if ($(this).scrollTop() >= areaTop && $(this).scrollTop() < areaBottom) {
              $('.image-container').removeClass("inFocus").addClass("outFocus");
              $('div#container' + feature.properties['id']).addClass("inFocus").removeClass("outFocus");

              map.flyTo([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], feature.properties['zoom']);
              TIMESLIDER.setDate(feature.properties['year']);
            }
          });

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
