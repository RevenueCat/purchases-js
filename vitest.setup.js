// Or configuring DOM elements that your app expects on startup
document.body.innerHTML = `<div id="app"></div>`;

if (!Element.prototype.animate) {
  Element.prototype.animate = () => ({
    cancel: () => {},
    play: () => {},
    pause: () => {},
    finish: () => {},
  });
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
