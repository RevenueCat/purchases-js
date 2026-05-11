// Or configuring DOM elements that your app expects on startup
document.body.innerHTML = `<div id="app"></div>`;

// jsdom does not implement window.matchMedia; provide a stub so Svelte
// components that call it (e.g. for prefers-color-scheme) don't throw.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

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
