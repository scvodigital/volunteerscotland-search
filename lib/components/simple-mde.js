import * as SimpleMDE from 'simplemde';

export class SimpleMdeComponent {
  constructor(textarea) {
    this.$textarea = $(textarea);
    this.textarea = this.$textarea[0];
    this.options = this.$textarea.data('simple-mde');
    this.options.element = this.textarea;
    this.mdeEditor = new SimpleMDE.default(this.options);
  }

  redraw() {
    this.mdeEditor.codemirror.refresh();
  }
}
