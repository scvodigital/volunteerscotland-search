import * as mdc from 'material-components-web';

export class SnackbarComponent {
  constructor(themes) {
    this.themes = themes;
    this.$snackbar = $('<div>')
      .addClass('mdc-snackbar mdc-elevation--z10')
      .attr('id', 'app-snackbar')
      .appendTo('body');
    this.$snackbarSurface = $('<div>')
      .addClass('mdc-snackbar__surface')
      .appendTo(this.$snackbar);
    this.$snackbarLabel = $('<div>')
      .addClass('mdc-snackbar__label')
      .attr({ 'role': 'status', 'aria-live': 'polite' })
      .appendTo(this.$snackbarSurface);
    this.$snackbarActions = $('<div>')
      .addClass('mdc-snackbar__actions')
      .appendTo(this.$snackbarSurface);
    this.$snackbar.data('defaultCss', {
      'background-color': this.$snackbar.css('background-color'),
      'color': this.$snackbar.css('color')
    });

    this.snackbar = new mdc.snackbar.MDCSnackbar(this.$snackbar[0]);
  }

  show(options) {
    this.$snackbarLabel.html(options.message);
    this.snackbar.open();
  }
}