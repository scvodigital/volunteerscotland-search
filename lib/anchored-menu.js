import { MDCMenu } from '@material/menu';

export class AnchoredMenuComponent {
  constructor(menu) {
    this.$menu = $(menu);
    this.menu = new MDCMenu(this.$menu[0]);
    this.$trigger = $(this.$menu.data('menu-trigger'));
    this.$trigger.on('click', (evt) => {
      this.menu.open = !this.menu.open;
    });

    // HACK: Temporary menu fix https://github.com/material-components/material-components-web/issues/3486
    
    this.$menu.find('a').on('click', evt => {
      const url = $(evt.currentTarget).attr('href');
      console.log('URL:', url);
      window.location.href = url;
    });    
  }
}
