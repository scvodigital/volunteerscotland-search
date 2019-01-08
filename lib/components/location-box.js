import {MDCTextFieldIcon} from '@material/textfield/icon';

require('imports-loader?define=>false!typeahead.js/dist/typeahead.jquery.min.js');
const Bloodhound = require('imports-loader?define=>false!typeahead.js/dist/bloodhound.min.js');

export class LocationBoxComponent {
  constructor(textbox) {
    this.textbox = $(textbox);
    this.config = this.textbox.data('location-search');
    this.lat = $(this.config.latSelector);
    this.lng = $(this.config.lngSelector);
    this.la = $(this.config.laSelector);
    this.ls = $(this.config.locationServicesSelector);

    this.icon = new MDCTextFieldIcon(this.ls[0]);
    this.defaultOption = null;

    this.bloodhound = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: {
        url: '/geo-lookup?q=%QUERY',
        wildcard: '%QUERY',
        transform: (res) => {
          this.defaultOption = (Array.isArray(res) && res.length > 0) ? res[0] : null;
          return res;
        }
      }
    });

    this.textbox.typeahead(null, {
      name: 'location',
      display: 'display',
      source: this.bloodhound
    });

    this.textbox
      .on('typeahead:select', (ev, suggestion) => {
        this.autocompleted = true;
        console.log('typeahead:select', ev, suggestion);
        this.typeaheadSelect(ev, suggestion);
      })
      .on('typeahead:autocomplete', (ev, suggestion) => {
        this.autocompleted = true;
        console.log('typeahead:autocomplete', ev, suggestion);
        this.typeaheadSelect(ev, suggestion);
      })
      .on('blur', (ev) => {
        var menuOpen =
          this.textbox.parent().find('.tt-open').length > 0 &&
          this.textbox.parent().find('.tt-empty').length === 0;
        console.log('Menu open', menuOpen);
        if (this.autocompleted) {
          ev.preventDefault();
        } else if (menuOpen && this.defaultOption) {
          ev.preventDefault();
          this.typeaheadSelect(ev, this.defaultOption);
        }
        this.autocompleted = false;
      })
      .on('keydown', (ev) => {
        switch (ev.keyCode) {
          case (9):
            var menuOpen =
              this.textbox.parent().find('.tt-open').length > 0 &&
              this.textbox.parent().find('.tt-empty').length === 0;
            console.log('Menu open', menuOpen);
            if (this.autocompleted) {
              ev.preventDefault();
            } else if (menuOpen && this.defaultOption) {
              ev.preventDefault();
              this.typeaheadSelect(ev, this.defaultOption);
            }
            break;
          case (13):
            var menuOpen =
              this.textbox.parent().find('.tt-open').length > 0 &&
              this.textbox.parent().find('.tt-empty').length === 0;
            console.log('Menu open', menuOpen);
            if (this.autocompleted) {
              ev.preventDefault();
            } else if (menuOpen && this.defaultOption) {
              ev.preventDefault();
              this.typeaheadSelect(ev, this.defaultOption);
            }
            break;
        }
        this.autocompleted = false;
      });

    const comp = this;

    this.ls.css('z-index', 500).on('click', (evt) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const suggestion = {
            display: lat + ',' + lon,
            point: {
              lat: lat,
              lon: lon
            }
          };

          var url = 'https://api.postcodes.io/outcodes?lat=' + lat + '&lon=' + lon;
          $.getJSON(url, (place) => {
            if (!place.result || place.result.length === 0) return;
            const result = place.result[0];
            suggestion.display =
              result.admin_district && result.admin_district[0] ||
              result.outcode ||
              result.country && result.country[0] ||
              'Current location';
            comp.typeaheadSelect(evt, suggestion);
          });
        });
      }
    });
  }

  typeaheadSelect(ev, suggestion) {
    // console.log('typeaheadSelect', ev, suggestion);
    if (suggestion && suggestion.point && suggestion.point.lat) {
      this.textbox.typeahead('val', suggestion.display);
      this.lat.val(suggestion.point.lat);
      this.lng.val(suggestion.point.lon);
      this.la.val(suggestion.district);
    } else {
      this.textbox.typeahead('val', '');
      this.lat.val('');
      this.lng.val('');
      this.la.val('');
    }
    this.textbox.typeahead('close');
  }
}