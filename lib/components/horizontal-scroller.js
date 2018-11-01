export class HorizontalScrollerComponent {
  constructor(scroller) {
    this.$scroller = $(scroller);
    this.scroller = this.$scroller[0];
    this.$scrollLeft = this.$scroller.parent().find('.scroll-left');
    this.$scrollRight = this.$scroller.parent().find('.scroll-right');

    this.$scrollLeft.on('click', () => {
      var currentLeft = this.$scroller.scrollLeft();
      var third = this.$scroller.width() * (3/5);
      var by = currentLeft - third;
      if (this.scroller.scroll) {
        this.scroller.scroll({ left: by, top: 0, behavior: 'smooth'});
      } else {
        this.$scroller.scrollLeft(by);
      }
    });
    this.$scrollRight.on('click', () => {
      var currentLeft = this.$scroller.scrollLeft();
      var third = this.$scroller.width() * (3/5);
      var by = currentLeft + third;
      if (this.scroller.scroll) {
        this.scroller.scroll({ left: by, top: 0, behavior: 'smooth'});
      } else {
        this.$scroller.scrollLeft(by);
      }
    });

    this.showHideScrollButtons();
    this.$scroller.on('scroll', () => {
      this.showHideScrollButtons();
    });
  }

  showHideScrollButtons() {
    var currentLeft = this.$scroller.scrollLeft();
    var maxLeft = this.scroller.scrollWidth - this.$scroller.width() - 1;

    if (currentLeft <= 0) {
      this.$scrollLeft.hide();
    } else {
      this.$scrollLeft.show();
      this.$scrollLeft.css('display', 'flex');
    }

    if (currentLeft >= maxLeft) {
      this.$scrollRight.hide();
    } else {
      this.$scrollRight.show();
      this.$scrollRight.css('display', 'flex');
    }
  }
}
