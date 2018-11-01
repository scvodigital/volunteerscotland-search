import 'leaflet';
import 'mapbox.js';
import 'leaflet.markercluster';

export class MapClusteredComponent {
    constructor(mapContainer) {
        this.$mapContainer = $(mapContainer);
        this.mapContainer = this.$mapContainer[0];

        /**
         * Options for this one:
         * 1 -"query" : query parameters from the URL, to be passed back to the router during queries
         * 2 -"queryUrl" :  where does the map go to get its data?
         * 3 - "regionQueryUrl" : where does the map go to get its region definition?
         * 3 - "aggregationKey" : the name of the aspect which we're using for aggregations of numbers. May need a little modification
         */
        this.options = this.$mapContainer.data('map-clustered-options');


        this.savedGenParams = {};

        const initialLat = (this.options.query.lat) ? this.options.query.lat: 55.94528820000001;
        const initialLng = (this.options.query.lng) ? this.options.query.lng: -3.200755699999945;
        const regionZoomLimit = this.options.regionZoom || -1; // At and below this zoom we draw region maps. Highlands is so big, this needs to be 7.
        const initialZoom = 9;

        // Circle options
        if (this.options.query.distance && this.options.query.lat && this.options.query.lng){
            this.options.circle = {
                radius : this.options.query.distance,
                lat : this.options.query.lat,
                lng : this.options.query.lng,
                color : this.options.circleColor || "#009ddc"
            }
        }

        window.popupPager = function (pager, direction) {
            var currentPage = $(pager).find('.chosen');
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
            currentPage.removeClass("chosen");
            nextPage.addClass("chosen");
            nextPage.show();
        }


        // TODO - evil, any way of reading this from a handlebars template?
        this.makeMarker = function(mapObject){
            var markerString = "";
            markerString += '<div style="display:none;" data-map="fullMap" data-lat="' + mapObject.geo_coords.lat + '" data-lng="' + mapObject.geo_coords.lon + '" data-title="' + mapObject.title + '">';
            markerString += '<h3 class="mdc-typography--headline7"><a href="' + mapObject.URL + '">' + mapObject.title + '</a></h3>';
            if (mapObject.subtitle) markerString += '<div class="mdc-typography--body1 v-margin"><strong>' + mapObject.subtitle + '</strong></div>';
            markerString += '<div class="mdc-typography--body2"><a href="' + mapObject.URL + '" class="mdc-card__action">Find out more</a></div>';
            markerString += '</div>'
            return markerString;
        }

        this.map = L.map(this.mapContainer, {
            fullscreenControl: true,
            scrollWheelZoom: false,
            trackResize: false
        }).setView([initialLat, initialLng], initialZoom);
        var osmAttrib = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
        L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
            attribution: osmAttrib,
            minZoom: 6,
            maxZoom: 18,
            opacity: 0.8
        }).addTo(this.map);
        L.control.scale().addTo(this.map);

        // Don't try this with areas in the top of the arctic circle, or far pacific, but it should be okay for Scotland, Europe, Hawaii or just about anywhere else.
        var extendBounds = (ratio, bounds) => {
            var differenceLat = ((bounds._northEast.lat - bounds._southWest.lat) / 2) * ratio;
            var differenceLng = ((bounds._northEast.lng - bounds._southWest.lng) / 2) * ratio;
            return {
                _northEast : {lat : bounds._northEast.lat + differenceLat, lng : bounds._northEast.lng + differenceLng},
                _southWest : {lat : bounds._southWest.lat - differenceLat, lng : bounds._southWest.lng - differenceLng}
            };
        }

        var regenerationNeeded = () => {

            // if (!this.queriedBounds || !this.oldZoom) return true;
            // // have we moved through a zoom boundary.
            // if (
            //     (this.oldZoom > regionZoomLimit && this.map.getZoom() <= regionZoomLimit) ||
            //     (this.oldZoom <= regionZoomLimit && this.map.getZoom() > regionZoomLimit)){
            //     console.log("Redrawing - map type change");
            //     return true;
            // }
            // // are we over a boundary?
            // if (this.queriedBounds.contains(this.map.getBounds()) === false) {
            //         console.log("Redrawing - data limit change");
            //         return true;
            // }
            return false;

        }

        this.map.on('moveend', (e) => {
            if (regenerationNeeded()) generateMap();
            this.oldZoom = this.map.getZoom();
        });


        var searchArea;
        var searchAreaShown = false;
        if (this.options.circle ) {
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


        var loadRegions = (thenFunction) => {
            $.getJSON(this.options.regionQueryUrl, this.options.query, function(data){
                thenFunction(data);
            })
        }

        var loadMarkers = (thenFunction) => {
            // this.options.query.zoom = this.map.getZoom();
            this.queryBounds = this.map.getBounds().pad(10);
            this.options.query.bounds_ne_lat = this.queryBounds._northEast.lat;
            this.options.query.bounds_ne_lon = this.queryBounds._northEast.lng;
            this.options.query.bounds_sw_lat = this.queryBounds._southWest.lat;
            this.options.query.bounds_sw_lon = this.queryBounds._southWest.lng;
            this.options.query.regionZoom = regionZoomLimit;
            this.options.query.returnRegionsNotPoints = (this.map.getZoom() <= regionZoomLimit) ? true : null;
            $.getJSON(this.options.queryUrl, this.options.query, function(data){
                thenFunction(data);
            })
            // this.queriedBounds = this.queryBounds; // I.e. the bounds we've actually got results for atm, for redrawing.
        }

        var setMarkers = (results) => {
            var markers = {};
            for (var x = 0; x < results.length; x++){
                var markerDatum = results[x];
                var key = markerDatum.geo_coords.lat + "," + markerDatum.geo_coords.lon;
                if (!markers.hasOwnProperty(key)) {
                    markers[key] = {
                        position: {
                            lat: markerDatum.geo_coords.lat,
                            lng: markerDatum.geo_coords.lon
                        },
                        classes: [],
                        contents: [],
                        iconClasses: []
                    };
                }
                markers[key].contents.push(this.makeMarker(markerDatum))
                // ($o.data('class') || '').split(' ').forEach(className => {
                //     if (className && markers[key].classes.indexOf(className) === -1) {
                //         markers[key].classes.push(className);
                //     }
                // });
                // ($o.data('icon-class') || '').split(' ').forEach(iconClassName => {
                //      if (iconClassName && markers[key].iconClasses.indexOf(iconClassName) === -1) {
                //         markers[key].iconClasses.push(iconClassName);
                //     }
                // });
                // $o.hide();
            }
            return markers;
        }

        this.markerGroup = new L.markerClusterGroup();
        this.areaMarkerGroup = new L.featureGroup();

        this.mapMarkers = [];
        this.mapAreas = [];

        var cleanMap = () => {
            this.map.removeLayer(this.markerGroup);
            this.markerGroup = new L.markerClusterGroup();
            for(var j = 0; j < this.mapAreas.length; j++){
                this.map.removeLayer(this.mapAreas[j]);
            }
            this.map.removeLayer(this.areaMarkerGroup)
        }


        var setupMap = (markerData) => {
            if (markerData.points) makePointMap(markerData.points)
            if (markerData.areas && markerData.aggregations) makeAreaMap(markerData)
        };

        var makePointMap = (points) => {
            cleanMap();
            for (var p = 0; p < points.length; p++) {
                var point = points[p];
                point.contents = this.makeMarker(point);
                var marker = L.marker([point.geo_coords.lat, point.geo_coords.lon]);
                var html;
                    var id = 'popup-pager-' + p;
                    var content = $('<div>');

                    var pager = $('<div>')
                        .attr('id', id)
                        .addClass('popup-pager')
                        .append(point.contents)
                        .appendTo(content);
                    $(pager).children(":first").show();
                    $(pager).children(":first").addClass("chosen");
                    html = content.html();
                marker.bindPopup(html).on('popupopen', () => {
                });
                this.mapMarkers.push(marker);
                this.markerGroup.addLayer(marker);
            }
            this.map.addLayer(this.markerGroup);
            if (!this.options.center) {
                let bounds;
                if (this.markerGroup.getLayers().length > 0) {
                    bounds = this.markerGroup.getBounds();
                }
                if (bounds) {
                    bounds.pad(0.1);
                    this.map.fitBounds(bounds);
                }
            }
        }

        var makeAreaMap = (markerData) => {
            cleanMap();
            // Get individual polygons:
            for (var x = 0;  x < markerData.areas.length; x++){
                var area = markerData.areas[x];
                if (area.Id[0] !== "S") continue;
                var geoShape = area.shape;
                var areaPoly = L.geoJSON(geoShape).addTo(this.map);
                this.mapAreas.push(areaPoly);

                var aggregateValue = 0;
                var aggAreas = markerData.aggregations[this.options.aggregationKey].buckets;
                for (var z = 0; z < aggAreas.length; z++){
                    if (aggAreas[z].key === area.Id){
                        aggregateValue = aggAreas[z].doc_count
                        break;
                    }
                }
                var icon = L.divIcon({
                    html: '<i class="marker-icon fas fa-map-marker"></i><span class="map-marker-overlay large">' + aggregateValue  + '</span>',
                    iconSize: [50, 60],
                    iconAnchor: [15, 40],
                    className: 'vacancy_icon'
                });

                var marker = L.marker([area.point.lat, area.point.lon], {icon: icon}).on('click', function(e){
                    this._map.fitBounds(this.oneTimeBoundsObject);
                });
                aloha++;
                marker.aloha = aloha;
                marker.oneTimeBoundsObject = areaPoly.getBounds();
                this.mapMarkers.push(marker);
                this.areaMarkerGroup.addLayer(marker);
                this.map.addLayer(this.areaMarkerGroup);
            }
        }

        const mapTypes = {
            POINT_MAP : {generate : makePointMap},
            AREA_MAP : {generate : makeAreaMap}
        }

        var generateMap = () => {
            loadMarkers(setupMap);
        }

        if (this.options.circle) {
            let bounds;
            if (searchAreaShown) {
                bounds = searchArea.getBounds();
            } else if (markerGroup.getLayers().length > 0) {
                bounds = markerGroup.getBounds();
            }
            if (bounds) {
                this.map.fitBounds(bounds);
            }
        }   
        // We need something like the above for region.
        generateMap();

    }

    redraw() {
        this.map.invalidateSize()
    }

}
