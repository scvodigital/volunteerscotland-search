import * as mdc from 'material-components-web';

export class SnackbarComponent {
  constructor(themes) {
    this.themes = themes;
    this.$snackbar = $('<div>')
      .addClass('mdc-snackbar mdc-elevation--z10')
      .attr({
        'aria-live': 'assertive',
        'aria-atomic': true,
        'aria-hidden': true,
        'id': 'app-snackbar'
      })
      .appendTo('body');
    this.$snackbarText = $('<div>')
      .addClass('mdc-snackbar__text')
      .appendTo(this.$snackbar);
    this.$snackbarActionWrapper = $('<div>')
      .addClass('mdc-snackbar__action-wrapper')
      .appendTo(this.$snackbar);
    this.$snackbarActionButton = $('<button>')
      .addClass('mdc-snackbar__action-button')
      .attr('type', 'button')
      .appendTo(this.$snackbarActionWrapper);
    this.$snackbar.data('defaultCss', {
      'background-color': this.$snackbar.css('background-color'),
      'color': this.$snackbar.css('color')
    });

    this.snackbar = new mdc.snackbar.MDCSnackbar(this.$snackbar[0]);
  }

  show(options) {
    let theme = this.themes.primary;
    if (options.theme) {
      if (this.themes.hasOwnProperty(options.theme)) {
        theme = this.themes[options.theme];
      }
      delete options.theme;
    }

    this.$snackbar.css({
      color: theme.text,
      backgroundColor: theme.background
    });

    this.snackbar.show(options);
  }
}
