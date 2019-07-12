import * as mdc from 'material-components-web';

import { ScreenSizeMonitor } from './screen-size-monitor';
import { AdvancedCheckboxListComponent } from './components/advanced-checkbox-list';
import { AdvancedAjaxButtonComponent } from './components/advanced-ajax-button';
import { AjaxButtonComponent } from './components/ajax-button';
import { AjaxFormComponent } from './components/ajax-form';
import { AjaxRadioButtonComponent } from './components/ajax-radio-button';
import { AnchoredMenuComponent } from './components/anchored-menu';
import { MapComponent } from './components/map';
import { MapClusteredComponent } from './components/map-clustered';
import { SimpleMdeComponent } from './components/simple-mde';
import { TabBarComponent } from './components/tab-bar';
import { TypeaheadComponent } from './components/typeahead';
import { HorizontalScrollerComponent } from './components/horizontal-scroller';
import { SnackbarComponent } from './components/snackbar';
import { LocationBoxComponent } from './components/location-box';

// const bump = require('./bump.js');

const $ = require('jquery');

window.mdc = mdc;

export class ComponentsInitialiser {
  constructor(options = {}) {
    this.options = {
      themes: {
        primary: {
          background: '#ffffff',
          text: '#000000'
        },
        secondary: {
          background: '#fafafa',
          text: '#000000'
        },
        success: {
          background: '#007700',
          text: '#ffffff'
        },
        warning: {
          background: '#aa6600',
          text: '#ffffff'
        },
        error: {
          background: '#880000',
          text: '#ffffff'
        }
      },
      displayModes: [
        { name: 'mobile', min: 0, max: 599 },
        { name: 'tablet', min: 600, max: 959 },
        { name: 'desktop', min: 960, max: 20000 }
      ]
    }
    $.extend(this.options, options);

    this.resizeMonitor = new ScreenSizeMonitor(this.options.displayModes);
    this.resizeMonitor.registerListener(this.resized.bind(this));
  }

  resized(displayMode) {
    // console.log('RESIZED:', this, displayMode);
  }

  initialise() {
    mdc.autoInit();

    // Think we just need the one global snackbar
    this.snackbar = new SnackbarComponent(this.options.themes);

    this.advancedAjaxButtons = [];
    $('[data-advanced-ajax-button]').each((i, o) => {
      const advancedAjaxButton = new AdvancedAjaxButtonComponent(o);
      this.advancedAjaxButtons.push(advancedAjaxButton);
    });

    this.ajaxButtons = [];
    $('[data-ajax-button]').each((i, o) => {
      const ajaxButton = new AjaxButtonComponent(o, this.snackbar);
      this.ajaxButtons.push(ajaxButton);
    });

    this.ajaxRadioButtons = [];
    $('[data-ajax-radio-button]').each((i, o) => {
      const ajaxRadioButton = new AjaxRadioButtonComponent(o, this.snackbar);
      this.ajaxRadioButtons.push(ajaxRadioButton);
    });

    this.tabBars = [];
    $('[data-tab-bar]').each((i, o) => {
      const tabBar = new TabBarComponent(o);
      tabBar.tabBar.listen("MDCTabBar:activated", this.redraw.bind(this));
      this.tabBars.push(tabBar);
    });

    this.simpleMdes = [];
    $('textarea[data-simple-mde]').each((i, o) => {
      const simpleMde = new SimpleMdeComponent(o);
      this.simpleMdes.push(simpleMde);
    });

    this.ajaxForms = [];
    $('form[data-ajax-form]').each((i, o) => {
      const ajaxForm = new AjaxFormComponent(o, this.snackbar);
      this.ajaxForms.push(ajaxForm);
    });

    $('[data-countdown]').each((i, o) => {
      var date = $(o).data('countdown');
      var expired = $(o).data('countdown-expired') || 'Expired';
      var countDownDate = new Date(date).getTime();

      var x = setInterval(function() {
        var now = new Date().getTime();

        var distance = countDownDate - now;
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        var display = days + (days === 1 ? ' day ' : ' days ') +
          hours + (hours === 1 ? ' hour ' : ' hours ') +
          minutes + (minutes === 1 ? ' minute ' : ' minutes ') +
          seconds + (seconds === 1 ? ' second ' : ' seconds ');


        $(o).html(display);

        if (distance < 0) {
          clearInterval(x);
          $(o).html(expired);
        }
      }, 1000);
    });

    this.sliders = [];
    $('[data-slider]').each((i, o) => {
      const slider = new mdc.slider.MDCSlider(o);
      var valueHolder = $(o).attr('data-slider-value-target');
      var displayHolder = $(o).attr('data-slider-display-target');
      slider.listen('MDCSlider:change', () => {
        var $valueHolder = $(valueHolder);
        $valueHolder.attr("value", slider.value);
        var $displayHolder = $(displayHolder);
        $displayHolder.text(slider.value);
      });
      // If in a drawer, redraw this when it's opened, otherwise it'll bug out.
      var drawerParent = $(o).parents('.mdc-drawer');
      if (drawerParent.length){
        drawerParent[0].addEventListener('MDCDrawer:opened', () => {
          slider.layout();
        });
      }
      this.sliders.push(slider);
    });

    this.advancedCheckboxLists = [];
    $('[data-advanced-checkbox-list]').each((i, o) => {
      const advancedCheckboxList = new AdvancedCheckboxListComponent(o);
      this.advancedCheckboxLists.push(advancedCheckboxList);
    });

    $('[data-mdc-auto-init="MDCTextField"][novalidate]').each((i, o) => {
      var foundation = o.MDCTextField.foundation_;
      foundation.useCustomValidityChecking = true;
      $(o).find('input').on('blur', () => {
        o.MDCTextField.valid = true;
      });
    });

    this.anchoredMenus = [];
    $('[data-menu-trigger]').each((i, o) => {
      const anchoredMenu = new AnchoredMenuComponent(o);
      this.anchoredMenus.push(anchoredMenu);
    });

    $('[data-restricted]').each((i, o) => {
      const $o = $(o);
      const data = $o.data();
      const restrictedOptions = data.restrictedOptions || 'ig';
      const regex = new RegExp(data.restricted, restrictedOptions);
      $o.on('keypress', (evt) => {
        if (!evt.key.match(regex)) {
          evt.preventDefault();
        }
      });
    });

    $('[data-check-valid]').each((i, o) => {
      const $o = $(o);
      const $form = $o.parents('form');
      $form.on('submit', (evt) => {
        const valid = evt.currentTarget.checkValidity();
        if (!valid) {
          evt.currentTarget.reportValidity();
          evt.preventDefault();
        }
      });
    });

    // Dialog activator buttons
    $('[data-dialog-target]').each((i, o) => {
      var selector = $(o).attr('data-dialog-target');
      var dialogEl = $(selector)[0];
      $(o).on('click', function() {
        dialogEl.MDCDialog.open();
      });
    });

    // Temporary drawer buttons
    $('[data-drawer-target]').each((i, o) => {
      var selector = $(o).attr('data-drawer-target');
      var drawerEl = $(selector)[0];
      var drawerType = $(selector).attr('data-mdc-auto-init');
      if (drawerType) {
        $(o).on('click', function() {
          drawerEl[drawerType].open = !drawerEl[drawerType].open;
        });
      }
    });

    // Collapsibles
    $('[data-collapse-target]').off('click').on('click', (evt) => {
      // console.log('Collapse click:', evt);
      var $el = $(evt.currentTarget);
      var selector = $el.attr('data-collapse-target');
      var $target = $(selector);
      // var $caption = $el.find('.mdc-typography--caption');
      var iconSelector = $el.attr('data-collapse-icon');
      var $icon = iconSelector ? $(iconSelector) : $el.find('.far');
      if ($target.is(':visible')) {
        $target.hide();
        // $caption.show();
        $icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
      } else {
        $target.show();
        // $caption.hide();
        $icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
      }
      var inverse = $el.attr('data-collapse-inverse');
      if (inverse){
        var $target = $(inverse);
        if ($target.is(':visible')) $target.hide();
        else $target.show();
      }
      // Fix for render issue
      $(window).on('scroll', () => {
        if ($target.is(':visible')) {
          $target.children().hide().show(0);
        }
      });
    });

    /**
    * Checkbox collapsible list which shows checked checkboxes when off, and all checkboxes when on. Relies on CSS
    * classes checkbox-toggle-display-checked, checkbox-toggle-display-all
    */
    $('[data-checkbox-collapse-target]')
      .off('click')
      .on('click', (evt) => {
        var $target = $($(evt.currentTarget).attr('data-checkbox-collapse-target'));
        var $icon = $(evt.currentTarget).find('.far');
        if ($target.hasClass('checkbox-toggle-display-all')) {
          $target.removeClass('checkbox-toggle-display-all').addClass('checkbox-toggle-display-checked');
          $icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
        } else {
          $target.removeClass('checkbox-toggle-display-checked').addClass('checkbox-toggle-display-all');
          $icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
        }
      });
    // Adds checked to an mdc checkbox's relevant mdc-form-field so that they can be manipulated by css.
    $('.mdc-form-field input[type="checkbox"]')
      .on('change', function(evt) {
        $(evt.currentTarget).parents('.mdc-form-field').toggleClass('checked', evt.currentTarget.checked);
      })
      .each(function(i, o) {
        $(o).parents('.mdc-form-field').toggleClass('checked', o.checked);
      });
    /* */

    // Ajax Chips
    $('[data-ajax-chip]').each((i, o) => {
      var $chip = $(o);
      var options = $chip.data('ajax-chip');
      var chip = new mdc.chips.MDCChip(o);

      options.onUrl = options.onUrl || options.toggleUrl;
      options.offUrl = options.offUrl || options.onUrl;
      options.onData = options.onData || options.toggleData || null;
      options.offData = options.offData || options.onData;
      options.onMethod = options.onMethod || options.toggleMethod || 'GET';
      options.offMethod = options.offMethod || options.onMethod;

      $chip.on('click', () => {
        if (!$chip.data('disabled')) {
          $chip.data('disabled', true);
          $chip.css('opacity', 0.5);
          var selected = $chip.hasClass('mdc-chip--selected');
          var ajax = {
            url: selected ? options.offUrl || options.onUrl : options.onUrl,
            method: selected ? options.offMethod || options.onMethod : options.onMethod,
            data: selected ? options.offData || options.onData || null : options.onData || null,
            dataType: 'html',
            success: () => {
              if (options.onClasses) {
                var selectors = Object.keys(options.onClasses);
                for (var s = 0; s < selectors.length; ++s) {
                  var selector = selectors[s];
                  var cssClass = options.onClasses[selector];
                  $(selector)[selected ? 'removeClass' : 'addClass'](cssClass);
                }
              }
              if (options.offClasses) {
                var selectors = Object.keys(options.offClasses);
                for (var s = 0; s < selectors.length; ++s) {
                  var selector = selectors[s];
                  var cssClass = options.offClasses[selector];
                  $(selector)[!selected ? 'removeClass' : 'addClass'](cssClass);
                }
              }
              // $chip.find('.mdc-chip__icon--leading')[selected ? 'removeClass' : 'addClass']('mdc-chip__icon--leading-hidden');

              $chip.find('.mdc-chip__text').text(!selected ? options.onText : options.offText);
              chip.foundation_.setSelected(!selected);
              $chip.data('disabled', false);
              $chip.css('opacity', 1);
            },
            error: () => {
              console.error('Failed toggle', options, arguments);
              $chip.data('disabled', false);
              $chip.css('opacity', 1);
            }
          };
          $.ajax(ajax);
        }
      });
    });

    $('[data-toggle-link]').each((i, o) => {
      var $link = $(o);
      var options = $link.data('toggle-link');

      options.onUrl = options.onUrl || options.toggleUrl;
      options.offUrl = options.offUrl || options.onUrl;
      options.onData = options.onData || options.toggleData || null;
      options.offData = options.offData || options.onData;
      options.onMethod = options.onMethod || options.toggleMethod || 'GET';
      options.offMethod = options.offMethod || options.onMethod;

      $link.on('click', () => {
        if (!$link.data('disabled')) {
          $link.data('disabled', true);
          $link.css('opacity', 0.5);
          var selected = $link.hasClass('toggle-link--selected');
          var ajax = {
            url: selected ? options.offUrl || options.onUrl : options.onUrl,
            method: selected ? options.offMethod || options.onMethod : options.onMethod,
            data: selected ? options.offData || options.onData || null : options.onData || null,
            dataType: 'html',
            success: () => {
              if (options.onClasses) {
                var selectors = Object.keys(options.onClasses);
                for (var s = 0; s < selectors.length; ++s) {
                  var selector = selectors[s];
                  var cssClass = options.onClasses[selector];
                  var $element = selector === '_self' ? $link : $(selector);
                  $element[selected ? 'removeClass' : 'addClass'](cssClass);
                }
              }
              if (options.offClasses) {
                var selectors = Object.keys(options.offClasses);
                for (var s = 0; s < selectors.length; ++s) {
                  var selector = selectors[s];
                  var cssClass = options.offClasses[selector];
                  var $element = selector === '_self' ? $link : $(selector);
                  $element[!selected ? 'removeClass' : 'addClass'](cssClass);
                }
              }

              $link.find('.toggle-link__text').text(!selected ? options.onText : options.offText);
              if (selected) {
                $link.removeClass('toggle-link--selected');
              } else {
                $link.addClass('toggle-link--selected');
              }
              $link.data('disabled', false);
              $link.css('opacity', 1);
            },
            error: () => {
              console.error('Failed toggle', options, arguments);
              $link.data('disabled', false);
              $link.css('opacity', 1);
            }
          };
          $.ajax(ajax);
        }
      });
    });

    this.maps = [];
    $('[data-map-options]').each((i, o) => {
      const mapComponent = new MapComponent(o);
      this.maps.push(mapComponent);
    });

    this.mapClustereds = [];
    $('[data-map-clustered-options]').each((i, o) => {
      const mapClusteredComponent = new MapClusteredComponent(o);
      this.mapClustereds.push(mapClusteredComponent);
    });

    this.typeaheads = [];
    $('[data-typeahead]').each((i, o) => {
      const typeahead = new TypeaheadComponent(o);
      this.typeaheads.push(typeahead);
    });

    this.horizontalScrollers = [];
    $('.scrolling-grid').each((i, o) => {
      const horizontalScroller = new HorizontalScrollerComponent(o);
      this.horizontalScrollers.push(horizontalScroller);
    });

    this.locationBoxes = [];
    $('[data-location-search]').each((i, o) => {
      const locationBox = new LocationBoxComponent(o);
      this.locationBoxes.push(locationBox);
    });
  }

  // initialiseGMapsDependents(apiKey) {
  //   $('[data-location-search-blah]').each((i, o) => {
  //     const $o = $(o);
  //     const options = $o.data('location-search');
  //     const $lat = $(options.latSelector);
  //     const $lng = $(options.lngSelector);
  //     const $ls = $(options.locationServicesSelector);
  //
  //     var autocomplete = new google.maps.places.Autocomplete(o, options.googleMapsOptions);
  //     autocomplete.addListener('place_changed', function(evt) {
  //       var place = this.getPlace();
  //       if (place.geometry.location) {
  //         if (place.formatted_address) {
  //           $o.val(place.formatted_address);
  //         } else {
  //           $o.val("Current location");
  //         }
  //         $lat.val(place.geometry.location.lat());
  //         $lng.val(place.geometry.location.lng());
  //       }
  //     });
  //
  //     $o.on('focus', function(evt) {
  //       if ($lat.val() !== '') {
  //         $(o).val('');
  //         $lat.val('');
  //         $lng.val('');
  //       }
  //     }).on('blur', function(evt) {
  //       if ($lat.val() === '') {
  //         $o.val('');
  //       }
  //     });
  //
  //     $ls.on('mouseup', function(evt) {
  //       if (navigator.geolocation) {
  //         navigator.geolocation.getCurrentPosition(function(position) {
  //           var lat = position.coords.latitude;
  //           var lng = position.coords.longitude;
  //
  //           $lat.val(lat);
  //           $lng.val(lng);
  //
  //           var url = 'https://api.postcodes.io/outcodes?lat=' + lat + '&lon=' + lng;
  //           $.getJSON(url, (place) => {
  //             if (!place.result || place.result.length === 0) return;
  //             const result = place.result[0];
  //             let locality =
  //             result.admin_district && result.admin_district[0] ||
  //             result.outcode ||
  //             result.country && result.country[0] ||
  //             'Current location';
  //             locality = locality.replace(/\s?city(\sof\s)?/gi, '');
  //             $o.val(locality);
  //           });
  //         });
  //       }
  //     });
  //   }).on('keypress', function(evt) {
  //     if (evt.which === 13) {
  //       evt.preventDefault();
  //       return false;
  //     }
  //   });
  // }

  redraw() {
    for (var map of this.maps) {
      map.redraw();
    }
    for (var map of this.mapClustereds) {
      map.redraw();
    }
    for (var simpleMde of this.simpleMdes) {
      simpleMde.redraw();
    }
  }
}