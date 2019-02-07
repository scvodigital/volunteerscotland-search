import { MDCCheckbox } from '@material/checkbox';

export class AdvancedCheckboxListComponent {
  constructor(element) {
    this.$element = $(element);
    this.name = this.$element.data('advanced-checkbox-list');
    this.$triggers = this.$element.find('[data-acl-collapse-trigger]');
    this.$icons = this.$element.find('[data-acl-collapse-icon-collapsed]');
    this.$clearButtons = this.$element.find('[data-acl-clear]');
    this.$form = this.$element.parents('form');
    this.children = [];
    this.collapsed = true;

    this.$triggers.on('click.acl', () => {
      this.toggle();
    });

    this.$form.on('change.acl', () => {
      for (const group of this.children) {
        group.refresh();
      }
    });

    this.$clearButtons.on('click.acl', (evt) => {
      for (const group of this.children) {
        group.checkbox.checked = false;
        for (const item of group.children) {
          item.checkbox.checked = false;
        }
        group.refresh();
      }
      evt.stopPropagation();
    });

    this.loadChildren();
    this.refresh();

    this.$element[0].AdvancedCheckboxList = this;
  }

  loadChildren() {
    for (const child of this.children) {
      child.destroy();   
    }
    this.children = [];
    this.$element.find('[data-advanced-checkbox-group]').each((i, o) => {
      const child = new AdvancedCheckboxGroup(o, this);
      this.children.push(child);
    });
  }

  toggle() {
    this.collapsed = !this.collapsed;
    this.refresh();
  }

  refresh() {
    let any = false;
    if (this.collapsed) {
      for (const group of this.children) {
        if (group.state !== 'none') {
          any = true;
        }
        if (group.state !== 'none' && !group.hidden) {
          group.$element.show();
          if (group.state === 'all') {
            group.$indicator.show().html('(all ' + group.children.length + ' selected)');
          }
        } else {
          group.$element.hide();
          group.$indicator.hide();
        }
        for (const item of group.children) {
          if (!item.checkbox.checked || (group.state === 'all' && !group.hidden)) {
            item.$element.hide();
          } else {
            item.$element.show();
          }
        }
      }
    } else {
      for (const group of this.children) {
        if (group.state !== 'none') {
          any = true;
        }
        if (!group.hidden) {
          group.$element.show();
          group.$indicator.hide();
        }
        for (const item of group.children) {
          item.$element.show();
        }
      }
    }

    for (const group of this.children) {
      if (!group.hidden) {
        group.checkbox.foundation_.adapter_.forceLayout();
      }
      for (const item of group.children) {
        item.checkbox.foundation_.adapter_.forceLayout();
      }
    }

    this.$icons.each((i, o) => {
      const show = $(o).data(this.collapsed ? 'acl-collapse-icon-collapsed' : 'acl-collapse-icon-open');
      const hide = $(o).data(this.collapsed ? 'acl-collapse-icon-open' : 'acl-collapse-icon-collapsed');
      $(o).removeClass(hide).addClass(show);
    });

    if (any) {
      this.$clearButtons.show(); 
    } else {
      this.$clearButtons.hide();
    }

    this.$element.find('.mdc-list').css('display', 'block');
  }
}

export class AdvancedCheckboxGroup {
  get state() {
    const total = this.children.length;
    let count = 0; 
    for (const child of this.children) {
      if (child.checkbox.checked) {
        count++;
      }
    }
    if (total === count) {
      return 'all';
    } else if (count > 0) {
      return 'some';
    } else {
      return 'none';
    }
  }

  constructor(element, parent) {
    this.$element = $(element);
    this.parent = parent;
    this.name = this.$element.data('advanced-checkbox-group'); 
    this.checkbox = new MDCCheckbox(this.$element.find('.mdc-checkbox')[0]);
    this.$checkbox = this.$element.find('input[type="checkbox"]');
    this.$indicator = this.$element.find('[data-advanced-checkbox-group-indicator]');
    this.hidden = this.$element.hasClass('checkbox-list-parent-hidden');
    this.children = [];

    this.$checkbox.on('change.acl', () => {
      this.toggle(); 
    });

    this.loadChildren();
    this.refresh();

    this.$element[0].AdvancedCheckboxGroup = this;
  }

  loadChildren() {
    for (const child of this.children) {
      child.destroy();
    }
    this.children = [];
    this.parent.$element.find('[data-advanced-checkbox-group-parent="' + this.name + '"]').each((i, o) => {
      const child = new AdvancedCheckboxItem(o, this);
      this.children.push(child);
    });
  }

  destroy() {
    this.checkbox.destroy();
    this.$checkbox.off('change.acl');
  }

  toggle() {
    switch (this.state) {
      case('all'): 
        for (const child of this.children) {
          child.checkbox.checked = false;
        }
        break;
      default:
        for (const child of this.children) {
          child.checkbox.checked = true;
        }
    }
    this.refresh();
  }

  refresh() {
    switch (this.state) {
      case('all'): 
        this.checkbox.indeterminate = false; 
        this.checkbox.checked = true; 
        break;
      case('some'):
        this.checkbox.indeterminate = true; 
        break;
      case('none'):
        this.checkbox.indeterminate = false; 
        this.checkbox.checked = false; 
        break;
    }
    this.parent.refresh();
  }
}

export class AdvancedCheckboxItem {
  constructor(element, parent) {
    this.$element = $(element);
    this.parent = parent;
    this.checkbox = new MDCCheckbox(this.$element.find('.mdc-checkbox')[0]);
    this.$checkbox = this.$element.find('input[type="checkbox"]');

    this.$checkbox.on('change.acl', () => {
      this.parent.refresh();
    });

    this.$element[0].AdvancedCheckboxItem = this;
  }

  destroy() {
    this.checkbox.destroy();
    this.$checkbox.off('change.acl');
  }
}