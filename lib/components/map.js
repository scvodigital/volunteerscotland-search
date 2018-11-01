import 'leaflet';
import 'mapbox.js';

export class MapComponent {
  constructor(mapContainer) {
    this.$mapContainer = $(mapContainer);
    this.mapContainer = this.$mapContainer[0];
    this.options = this.$mapContainer.data('map-options');
    if (!window.popupPager) {
      window.popupPager = function (pager, direction) {
        var currentPage = $(pager).find('.map-content:visible');
        var nextPage = currentPage;
        if (direction === 'next') {
          var nextElement = currentPage.next();
          if (!nextElement || nextElement.length === 0) {
            nextPage = $(pager).children().first();
          } else {
            nextPage = nextElement;
          }
        } else if (direction === 'back') {
          var prevElement = currentPage.prev();
          if (!prevElement || prevElement.length === 0) {
            nextPage = $(pager).children().last();
          } else {
            nextPage = prevElement;
          }
        }
        currentPage.hide();
        nextPage.show();
      }
    }

    const initialLat = (this.options.center && this.options.center.lat) ? this.options.center.lat : 55.94528820000001;
    const initialLng = (this.options.center && this.options.center.lng) ? this.options.center.lng : -3.200755699999945;
    const initialZoom = this.options.zoom || 9;

    this.map = L.map(this.mapContainer, {
      fullscreenControl: true,
      scrollWheelZoom: false,
      trackResize: true
    }).setView([initialLat, initialLng], initialZoom);
    var osmAttrib = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
    L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
      attribution: osmAttrib,
      minZoom: 6,
      maxZoom: 18,
      opacity: 0.8
    }).addTo(this.map);
    L.control.scale().addTo(this.map);

    // console.log(options.circle);
    var searchArea;
    var searchAreaShown = false;
    if (this.options.circle) {
      if (this.options.circle.radius > 0) {
        searchArea = L.circle(
          [this.options.circle.lat, this.options.circle.lng],
          {
            radius: this.options.circle.radius*1000,
            color: this.options.circle.color,
            fillColor: this.options.circle.color,
            fillOpacity: 0.1
          }
        ).addTo(this.map);
        searchAreaShown = true;
      }
    }

    var $markers = this.$mapContainer.find('marker');
    var markers = {};

    $markers.each((i, o) => {
      var $o = $(o);
      var key = $o.data('lat') + ',' + $o.data('lng');
      if (!markers.hasOwnProperty(key)) {
        markers[key] = {
          position: {
            lat: $o.data('lat'),
            lng: $o.data('lng')
          },
          classes: [],
          contents: [],
          iconClasses: []
        };
      }
      markers[key].contents.push($o.html());
      ($o.data('class') || '').split(' ').forEach(className => {
        if (className && markers[key].classes.indexOf(className) === -1) {
          markers[key].classes.push(className);
        }
      });
      ($o.data('icon-class') || '').split(' ').forEach(iconClassName => {
        if (iconClassName && markers[key].iconClasses.indexOf(iconClassName) === -1) {
          markers[key].iconClasses.push(iconClassName);
        }
      });
      $o.hide();
    });

    var markerGroup = new L.featureGroup();
    var markerPositions = Object.keys(markers);

    for (var p = 0; p < markerPositions.length; p++) {
      var markerPosition = markerPositions[p];
      var markerItem = markers[markerPosition];
      var iconType = markerItem.iconClasses.join(' ');
      var icon = L.divIcon({
        html: '<i class="marker-icon fas fa-map-marker' + iconType + '"></i><span class="map-marker-overlay' + iconType + '">' + markerItem.contents.length  + '</span>',
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -42],
        className: 'vacancy_icon'
      });
      var marker = L.marker([markerItem.position.lat, markerItem.position.lng], {icon: icon}).addTo(this.map);
      var html;
      if (markerItem.contents.length > 1) {
        var id = 'popup-pager-' + p;
        var content = $('<div>');
        var pager = $('<div>')
        .attr('id', id)
        .addClass('popup-pager')
        .append(markerItem.contents.join('\n'))
        .appendTo(content);
        var back = $('<a>')
        .attr('href', 'javascript:popupPager("#' + id + '", "back")')
        .addClass('scroll-button pager pager-left')
        .append('<span class="fas fa-fw fa-angle-left fa-2x"></span>')
        .appendTo(content);
        var next = $('<a>')
        .attr('href', 'javascript:popupPager("#' + id + '", "next")')
        .addClass('scroll-button pager pager-right')
        .append('<span class="fas fa-fw fa-angle-right fa-2x"></span>')
        .appendTo(content);
        back.on('click', function(evt) {
          var pager = $(evt.currentTarget).parent();
          popupPage(pager, 'back');
        });
        next.on('click', function(evt) {
          var pager = $(evt.currentTarget).parent();
          popupPage(pager, 'next');
        });
        html = content.html();
      } else {
        html = markerItem.contents[0];
      }
      marker.bindPopup(html);
      markerGroup.addLayer(marker);
    }

    if (!this.options.center) {
      let bounds;
      if (searchAreaShown) {
        bounds = searchArea.getBounds();
      } else if (markerGroup.getLayers().length > 0) {
        bounds = markerGroup.getBounds();
      }
      if (bounds) {
        bounds.pad(0.1);
        this.map.fitBounds(bounds);
      }
    }
  }

  redraw() {
    this.map.invalidateSize()
  }
}
