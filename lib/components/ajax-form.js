
export class AjaxFormComponent {
  constructor(form, snackbar) {
    this.$form = $(form);
    this.form = this.$form[0];
    this.snackbar = snackbar;
    this.config = this.$form.data('ajax-form');

    var url = this.$form.attr('action');
    var method = this.$form.attr('method').toUpperCase() || 'GET';

    this.requestTemplate = {
      url: url,
      method: ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) > -1 ? method : 'GET',
      dataType: this.config.responseType || 'html'
    };

    this.$form.submit(this.submit.bind(this));
  }

  submit(evt) {
    evt.preventDefault();
    var request = $.extend({}, this.requestTemplate);

    if (this.method === 'GET') {
      request.url += (request.url.indexOf('?') > -1 ? '&' : '') + this.$form.serialize();
    } else {
      var data = {};
      var params = this.$form.serializeArray();
      for (var p = 0; p < params.length; p++) {
        var param = params[p];
        if (!data.hasOwnProperty(param.name)) {
          data[param.name] = param.value;
        } else {
          if (!$.isArray(data[param.name])) {
            data[param.name] = [data[param.name]];
          }
          data[param.name].push(param.value);
        }
      }
      request.data = data;
    }

    request.success = this.successHandler.bind(this);
    request.error = this.errorHandler.bind(this);

    console.log('REQUEST:', request);
    $.ajax(request);
  }
  
  successHandler(response, status, xhr) {
    if (typeof response === 'object') {
      response = this.flatten(response);
    }

    console.log('SUCCESS', this);

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
      error: typeof error === 'object' ? this.flatten(error) : error
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

  flatten(object, separator = '.') {
    const isValidObject = value => {
      if (!value) {
        return false
      }

      const isArray  = Array.isArray(value)
      const isObject = Object.prototype.toString.call(value) === '[object Object]'
      const hasKeys  = !!Object.keys(value).length

      return !isArray && isObject && hasKeys
    }

    const walker = (child, path = []) => {

      return Object.assign({}, ...Object.keys(child).map(key => isValidObject(child[key])
        ? walker(child[key], path.concat([key]))
        : { [path.concat([key]).join(separator)] : child[key] })
      )
    }

    return Object.assign({}, walker(object))
  }
}