import 'leaflet';
import 'mapbox.js';
import 'leaflet.markercluster';

export class MapClusteredComponent {
    constructor(mapContainer) {
        this.$mapContainer = $(mapContainer);
        this.mapContainer = this.$mapContainer[0];
        /**
         * Options:
         * "circle" : details of a circle - lat, lng, radius(m), color
         * "center" : lat and lng
         */

        this.options = this.$mapContainer.data('map-clustered-options');

        const initialLat = (this.options.center && this.options.center.lat) ? this.options.center.lat : 55.94528820000001;
        const initialLng = (this.options.center && this.options.center.lng) ? this.options.center.lng : -3.200755699999945;
        const initialZoom = this.options.zoom || 9;

        this.map = L.map(this.mapContainer, {
            fullscreenControl: true,
            scrollWheelZoom: false,
            trackResize: false
        }).setView([initialLat, initialLng], initialZoom);
        var osmAttrib = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
        L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
            attribution: osmAttrib,
            minZoom: 5,
            maxZoom: 17,
            opacity: 0.9
        }).addTo(this.map);
        L.control.scale().addTo(this.map);


        var searchArea;
        var searchAreaShown = false;
        if (this.options.circle) {
            if (this.options.circle.radius > 0) {
                searchArea = L.circle(
                    [this.options.circle.lat, this.options.circle.lng],
                    {
                        radius: this.options.circle.radius * 1000,
                        color: this.options.circle.color,
                        fillColor: this.options.circle.color,
                        fillOpacity: 0.02
                    }
                ).addTo(this.map);
                searchAreaShown = true;
            }
        }

        this.markerGroup = new L.markerClusterGroup(
            {showCoverageOnHover: false}
        );

        this.mapMarkers = [];

        var $markers = this.$mapContainer.find('marker');

        $markers.each((i, o) => {
            var $o = $(o);
            let iconClasses = [];
            ($o.data('icon-class') || '').split(' ').forEach(iconClassName => {
                if (iconClassName && marker.iconClasses.indexOf(iconClassName) === -1) {
                    iconClasses.push(iconClassName);
                }
            });
            $o.hide();
            var iconType = iconClasses.join(" ");
            var marker = L.marker([$o.data('lat'), $o.data('lng')]);
            marker.bindPopup($o.html()).on('popupopen', () => {});
            this.mapMarkers.push(marker);
            this.markerGroup.addLayer(marker);
        });

        this.map.addLayer(this.markerGroup);

        if (!this.options.center) {
            let bounds;
            if (searchAreaShown) {
                bounds = searchArea.getBounds();
            } else if (this.markerGroup.getLayers().length > 0) {
                bounds = this.markerGroup.getBounds();
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
