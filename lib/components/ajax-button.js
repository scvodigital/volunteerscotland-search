var S = require('string');
var flatten = require('flat');

export class AjaxButtonComponent {
  constructor(button, snackbar) {
    this.$button = $(button);
    this.snackbar = snackbar;
    this.config = this.$button.data('ajax-button');
    this.request = {
      url: this.config.url,
      method: ['POST', 'GET', 'PUT', 'DELETE'].indexOf(this.config.method.toUpperCase()) > -1 ? this.config.method.toUpperCase() : 'GET',
      dataType: this.config.responseType || 'html',
      success: this.successHandler.bind(this),          
      error: this.errorHandler.bind(this),
      data: this.config.postBody
    };

    this.$button.on('click', (evt) => {
      $.ajax(this.request);
    });
  }

  successHandler(response, status, xhr) {
    if (typeof response === 'object') {
      response = flatten(response);
    }

    if (this.config.successMessage) {
      const successMessage = S(this.config.successMessage).template(response).s;
      this.snackbar.show({
        message: successMessage
      });
    }
    
    if (this.config.successCallback) {
      window[this.config.successCallback].call(this, response, status, xhr);
    }
  }

  errorHandler(xhr, status, error) {
    try {
      error = JSON.parse(error);
    } catch(err) {
      console.error('Not a JSON error response', error, err);
    }

    const context = {
      status: status,
      error: typeof error === 'object' ? flatten(error) : error
    }

    if (this.config.failureMessage) {
      const failureMessage = S(this.config.failureMessage).template(context).s;
      this.snackbar.show({
        message: failureMessage,
        theme: 'error'
      });
    }

    if (this.config.failureCallback) {
      window[this.config.failureCallback].call(this, xhr, status, err);
    }
  }
}