export class ScreenSizeMonitor {
  constructor(displayModes) {
    this.listeners = [];
    this.displayMode = null;
    this.displayModes = displayModes;
    $(window).on('resize', () => {
      this.windowResized();
    });
    this.windowResized();
  }

  registerListener(listener) {
    this.listeners.push(listener);
    listener(this.displayMode);
  }

  windowResized() {
    var width = $(window).width();
    var newDisplayMode = null;
    this.displayModes.forEach(function(mode) {
      if (width >= mode.min && width < mode.max) {
        newDisplayMode = mode.name;
      }
    });
    if (newDisplayMode !== this.displayMode) {
      this.displayMode = newDisplayMode;
      for (var listener of this.listeners) {
        listener(this.displayMode);
      }
    }
  }
}
