import "@babel/polyfill";
import 'leaflet';
import 'mapbox.js';
import { default as Headroom } from 'headroom.js';
import * as mdc from 'material-components-web';
import { ComponentsInitialiser } from '../../lib/components-initialiser';
import { Auth } from '../../lib/firebase-auth';

import * as cookieInfoScript from '../../lib/cookie-info-script' ;

export class VolunteerScotlandSearch {
  constructor(firebaseConfig) {
    this.firebaseConfig = firebaseConfig;
    this.auth = new Auth(this.firebaseConfig, '/upgrade-token?token={idToken}', 'gi_cookie');

    this.displayMode = null;
    this.displayModes = [
      { name: 'mobile', min: 0, max: 599 },
      { name: 'tablet', min: 600, max: 959 },
      { name: 'desktop', min: 960, max: 20000 }
    ];

    this.maps = {};

    this.ie = navigator.appName.indexOf('Microsoft') > -1 || navigator.userAgent.indexOf('Trident') > -1;
    this.occasionalDrawers = Array.from(document.querySelectorAll('.mdc-drawer--occasional')).map(el => {
      return {
        element: el,
        mdc: null
      };
    });

    $(window).on('resize', () => {
      this.windowResized();
    });
    this.windowResized();

    this.componentsInitialiser = new ComponentsInitialiser();
    this.componentsInitialiser.initialise();

    this.initialSort = $('[name="sort"]').val() || "";

    // Filter button code?
    // Filter button container code
    this.filterButtonContainerOuter = $('#filter-container-outer');
    this.filterButtonContainerInner = $('#filter-container-inner');
    this.filterIndicator = $('#filter-indicator');
    this.filterButton = $('#perm-search-submit');
    if (this.filterButton.length > 0) {
      this.filterButtonFixed = false;
      this.filterButtonFrame = window.requestAnimationFrame(() => { this.handleFilterButton() });
    }
    this.searchInitialState = $('.search-form').serialize();
    this.searchLastState = this.searchInitialState;
    this.searchLastStateArray = $('.search-form').serializeArray();
    this.searchLastStateSelectors = this.searchLastStateArray
      .filter(field => { return field.name !== 'keywords'; })
      .map(field => '[name="' + field.name + '"][value="' + field.value + '"]');

    // // Headroom
    // var header = document.querySelector("header.top-bar-stuck");
    // var headroom  = new Headroom(header, {
    //   "offset": 100,
    //   "tolerance": 5
    // });
    // headroom.init();


    $('.search-form').on('change.acl', (evt) => {
      const hasKeywords = !!$('[name="keywords"]').val();
      const hasLocation = !!$('[name="lat"]').val();

      if (hasLocation && !hasKeywords) {
        $('[name="sort"]').val('distance');
      } else {
        $('[name="sort"]').val(this.initialSort);
      }

      //let hasOther = false;
      //const ignore = ['sort', 'location', 'distance', 'lat', 'lng'];
      //const formState = $(evt.currentTarget).serializeArray();
      //for (const field of formState) {
      //  if (ignore.indexOf(field.name) === -1 && !!field.value) {
      //    hasOther = true;
      //  }
      //}
      //if (hasLocation && !hasOther) {
      //  $('[name="sort"]').val('distance');
      //}
    });

    // Headroom
    // var header = document.querySelector("header.top-bar-stuck");
    // var headroom  = new Headroom(header, {
    //   "offset": 138,
    //   "tolerance": 5
    // });
    // headroom.init();

    const ci = new cookieinfo();
    ci.options.message = "We use cookies to track anonymous usage statistics and do not collect any personal information that can be used to identify you. By continuing to visit this site you agree to our use of cookies.";
    ci.options.fontFamily = "'Open Sans',Helvetica,Arial,sans-serif";
    ci.options.bg = "#fff";
    ci.options.link = "#00a0af";
    ci.options.divlink = "#fff";
    ci.options.divlinkbg = "#00a0af";
    ci.options.position = "bottom";
    ci.options.acceptOnScroll = "true";
    ci.options.moreinfo = "/cookies";
    ci.options.cookie = "CookieInfoScript";
    ci.options.textAlign = "left";
    ci.options.fontFamily = "Rambla";
    ci.run();
  }

  handleFilterButton() {
    window.cancelAnimationFrame(this.filterButtonFrame);
    const bottom = $(window).scrollTop() + $(window).height();
    const filterButtonHeight = this.filterButtonContainerInner.outerHeight();
    const filterButtonContainerTop = this.filterButtonContainerOuter.offset().top;
    if (filterButtonContainerTop + filterButtonHeight > bottom && !this.filterButtonFixed) {
      const filterButtonContainerWidth = this.filterButtonContainerOuter.innerWidth();
      this.filterButtonContainerInner.addClass('filter-button-fixed');
      this.filterButtonContainerOuter.css('height', filterButtonHeight);
      this.filterButtonContainerInner.css('width', filterButtonContainerWidth);
      this.filterButtonFixed = true;
      this.filterIndicator.css({
        'bottom': filterButtonHeight,
        'left': (filterButtonContainerWidth / 2) - (this.filterIndicator.outerWidth() / 2)
      });
    } else if (filterButtonContainerTop + filterButtonHeight <= bottom && this.filterButtonFixed) {
      this.filterButtonContainerInner.removeClass('filter-button-fixed');
      this.filterButtonContainerOuter.css('height', 'auto');
      this.filterButtonContainerInner.css('width', '100%');
      this.filterButtonFixed = false;
      this.filterIndicator.hide();
    }

    const searchNewState = $('.search-form').serialize();
    if (searchNewState !== this.searchLastState) {
      if (searchNewState !== this.searchInitialState) {
        this.filterButton.prop('disabled', false);
        this.filterButton.removeClass('mdc-button--disabled');
      } else {
        this.filterButton.prop('disabled', true);
        this.filterButton.addClass('mdc-button--disabled');
      }

      //find change
      const searchNewStateArray = $('.search-form').serializeArray();
      const searchNewStateSelectors = searchNewStateArray
        .filter(field => { return (field.name !== 'keywords' && field.name !== 'location'); })
        .map(field => '[name="' + field.name + '"][value="' + field.value + '"]');

      for (const selector of searchNewStateSelectors) {
        if (this.searchLastStateSelectors.indexOf(selector) === -1) {
          const fieldTop = $(selector).offset().top;
          if (fieldTop > bottom && this.filterButtonFixed) {
            this.filterIndicator.hide().fadeTo(250, 0.8).delay(1000).fadeOut(250);
          }
        }
      }

      this.searchLastState = searchNewState;
      this.searchLastStateArray = searchNewStateArray;
      this.searchLastStateSelectors = searchNewStateSelectors;
    }

    this.filterButtonFrame = window.requestAnimationFrame(() => { this.handleFilterButton() });
  }


  windowResized() {
    var width = $(window).width();
    var newDisplayMode = null;
    this.displayModes.forEach(function(mode) {
      if (width >= mode.min && width < mode.max) {
        newDisplayMode = mode.name;
      }
    });
    if (newDisplayMode !== this.displayMode) {
      this.displayMode = newDisplayMode;
      this.displayModeChanged();
    }
    this.fie();
  }

  displayModeChanged() {
    // console.log('Display Mode!xs:', this.displayMode);
    this.occasionalDrawers.forEach(od => {
      var menuButton = $(od.element).data('menu-button');
      if (this.displayMode === 'desktop') {
        if (od.mdc) {
          od.mdc.destroy();
        }
        $(od.element).removeClass('mdc-drawer--modal');
        $(menuButton).off('click');
      } else {
        $(od.element).addClass('mdc-drawer--modal');
        od.mdc = mdc.drawer.MDCDrawer.attachTo(od.element);
        $(menuButton).on('click', () => { od.mdc.open = !od.mdc.open; });
      }
    });
  }

  fie() {
    if (!this.ie) return;
    $('.mdc-drawer--occasional .mdc-drawer__drawer').each(function(i, o) {
      var $o = $(o);
      var parentHeight = $o.parent().height();
      $o.css('height', parentHeight);
    });
  }

  setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; secure";
  }

  getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }

  disable(elements, disable) {
    disable = typeof disable === 'undefined' ? true : disable;
    for (var e = 0; e < elements.length; ++e) {
      var element = elements[e];
      var opacity = disable ? 0.5 : 1;
      $(element).prop('disabled', disable).css('opacity', opacity);
    }
  }

  snackbarShow(options) {
    console.log('DEPRECATED SNACKBARSHOW CALLED:', arguments);
  }

  popupPagerPage(pager, direction) {
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