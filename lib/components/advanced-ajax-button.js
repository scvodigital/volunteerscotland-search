import domManipulator from '../dom-manipulator';
import * as jsonLogic from 'json-logic-js';
import 'whatwg-fetch';

export class AdvancedAjaxButtonComponent {
  get stateName() {
    return this.$button.data('ajax-state') || null;
  }

  set stateName(newState) {
    this.$button.data('ajax-state', newState);
  }

  get stateConfig() {
    if (this.config.states) {
      if (this.config.states[this.stateName]) {
        return this.config.states[this.stateName];
      } else {
        return this.config.states[Object.keys(this.config.states)[0]];
      }
    } else {
      return this.config;
    }
  }
  
  constructor(button) {
    this.$button = $(button);
    this.config = this.$button.data('advanced-ajax-button');

    if (this.stateConfig.initial) {
      const context = { config: this.stateConfig };
      domManipulator(this.stateConfig.initial, this.$button[0], context);
    }

    this.$button.on('click', () => {
      this.doAjax();
    });
  }
  
  async doAjax() {
    const root = this.$button[0];
    const config = JSON.parse(JSON.stringify(this.stateConfig));
    const method = config.method && config.method.toUpperCase() || 'GET';

    let data = null;
    if (config.postBody && typeof config.postBody === 'object') {
      data = JSON.stringify(config.postBody, null, 4);
    } else if (config.postBody) {
      data = config.postBody;
    }

    const options = {
      method: method,
      dataType: config.responseType || 'html',
      body: data || undefined,
      headers: config.headers || undefined
    };

    if (config.before) {
      domManipulator(config.before, root, { config, options }); 
    }

    let response, body, error;
    try {
      response = await fetch(config.url, options)
      
      if (config.responseType.indexOf('json') > -1) {
        body = await response.json();
      } else {
        body = { text: await response.text() };
      }
      
      if (config.success) {
        const context = { config, options, body };
        domManipulator(config.success, root, context);
      }
    } catch(err) {
      console.error('Failed to Ajax', err);
      error = err;
      if (config.error) {
        const context = { config, options, body };
        domManipulator(config.error, root, context); 
      }
    }

    if (typeof config.newState === 'string') {
      this.stateName = config.newState;
    } else if (typeof config.newState === 'object') {
      const context = { config, options, body, error };
      const output = jsonLogic.apply(config.newState, context);
      this.stateName = output;
    }

    if (this.stateConfig.initial) {
      const context = { config: this.stateConfig, options, body };
      domManipulator(this.stateConfig.initial, root, context);
    }

    if (config.after) {
      const context = { config, options, body };
      domManipulator(config.after, root, context);
    }
  }
}