require('imports-loader?define=>false!typeahead.js/dist/typeahead.jquery.min.js');
const Bloodhound = require('imports-loader?define=>false!typeahead.js/dist/bloodhound.min.js');

var S = require('string');
var flatten = require('flat');

export class TypeaheadComponent {
  constructor(textbox) {
    this.textbox = $(textbox);
    this.config = this.textbox.data('typeahead');
    this.$form = this.textbox.parents('form');
    this.datasets = {};
    const typeaheadArgs = [this.config.typeaheadOptions];
     
    console.log('Datasets before:', this.config.datasets);
    this.config.datasets = this.config.datasets.filter(Boolean);
    console.log('Datasets after:', this.config.datasets);
    for (const dataset of this.config.datasets) {
      dataset.items = dataset.items.filter(Boolean);
      for (const item of dataset.items) {
        item.datasetName = dataset.name;
      }
      const engine = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: dataset.items
      });
      dataset.source = engine;
      typeaheadArgs.push(dataset);
      this.datasets[dataset.name] = dataset;
    }

    this.instance = this.textbox.typeahead.apply(this.textbox, typeaheadArgs);
    this.instance
      .on('typeahead:select', (ev, suggestion) => {
        this.autocompleted = true;
        this.typeaheadSelect(ev, suggestion);
      })
      .on('typeahead:autocomplete', (ev, suggestion) => {
        this.autocompleted = true;
        this.typeaheadSelect(ev, suggestion);
      })
      .on('keydown', (ev) => {
        switch (ev.keyCode) {
          case (9):
            if (this.autocompleted) ev.preventDefault();
            break;
          case (13):
            if (this.autocompleted) ev.preventDefault();
            var val = this.textbox.val();
            if (val) {
              this.textbox.typeahead('val', val);
              setTimeout(() => { this.textbox.focus() }, 100);
            }
            break;
        }
        this.autocompleted = false;
      });
  }

  typeaheadSelect(ev, suggestion) {
    const dataset = this.datasets[suggestion.datasetName];

    for (const output of this.config.outputs) {
      const outputName = 'output_' + output.type;
      if (this[outputName]) {
        this[outputName](output.options, suggestion, dataset);
      }  
    }

    this.textbox.typeahead('val', '').typeahead('close');
    this.$form.trigger('change');
    setTimeout(() => { this.textbox.focus(); }, 100);
  }

  output_element(options, item, dataset) {
    const context = flatten({
      item: item,
      dataset: dataset
    });

    const test = S(options.containerSelectorTemplate).dasherize().s;
    const containerSelector = S(options.containerSelectorTemplate).template(context).s;
    const $container = $(containerSelector);
    if (options.testSelectorTemplate) {
      const testSelector = S(options.testSelectorTemplate).template(context).s;
      if ($container.find(testSelector).length > 0) return;
    }

    const elementHtml = S(options.template).template(context).s;
    const $element = $(elementHtml);
    $container.append($element);

    if (options.removeSelectorTemplate) {
      const removeSelector = S(options.removeSelectorTemplate).template(context).s;
      const $remove = $(removeSelector);
      $remove.on('click', () => {
        $element.remove();
      });
    }    
  }

  output_prop(options, item, dataset) {
    const context = flatten({
      item: item,
      dataset: dataset
    });

    const selector = S(options.selectorTemplate).template(context).s;
    const elements = $(selector);
    const value = S(options.valueTemplate).template(context).s;
    elements.prop(options.prop, value);
  }
}