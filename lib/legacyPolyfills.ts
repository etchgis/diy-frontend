// Polyfills for older signage browsers (Chrome 63+) that Next.js does not cover. Next.js already
// polyfills flat, flatMap, fromEntries, at and hasOwn. This runs inline in <head>, before the
// webpack runtime script exists in the document, so it must stay ES5.
export const legacyPolyfills = `
(function () {
  var w = window;
  function def(obj, name, fn) {
    if (!obj[name]) Object.defineProperty(obj, name, { value: fn, configurable: true, writable: true });
  }

  if (typeof globalThis === 'undefined') w.globalThis = w;

  def(Promise, 'allSettled', function (items) {
    return Promise.all(Array.from(items, function (p) {
      return Promise.resolve(p).then(
        function (value) { return { status: 'fulfilled', value: value }; },
        function (reason) { return { status: 'rejected', reason: reason }; }
      );
    }));
  });

  // Minimal AbortController (Chrome 66+). fetch on these browsers ignores the signal.
  if (!w.AbortController) {
    var AbortSignal = function () {
      this.aborted = false;
      this.reason = undefined;
      this.onabort = null;
      this._listeners = [];
    };
    AbortSignal.prototype.addEventListener = function (type, fn) {
      if (type === 'abort') this._listeners.push(fn);
    };
    AbortSignal.prototype.removeEventListener = function (type, fn) {
      this._listeners = this._listeners.filter(function (l) { return l !== fn; });
    };
    AbortSignal.prototype.dispatchEvent = function (event) {
      if (this.onabort) this.onabort(event);
      this._listeners.slice().forEach(function (l) { l.call(this, event); }, this);
      return true;
    };
    AbortSignal.prototype.throwIfAborted = function () {
      if (this.aborted) throw this.reason;
    };
    w.AbortSignal = AbortSignal;
    w.AbortController = function () {
      this.signal = new AbortSignal();
    };
    w.AbortController.prototype.abort = function (reason) {
      var s = this.signal;
      if (s.aborted) return;
      s.aborted = true;
      s.reason = reason === undefined ? new DOMException('This operation was aborted', 'AbortError') : reason;
      s.dispatchEvent({ type: 'abort', target: s });
    };
  }

  // Polling stand-in for ResizeObserver: reports size changes every 500ms and on window resize.
  if (!w.ResizeObserver) {
    w.ResizeObserver = function (callback) {
      var self = this;
      var targets = [];
      var timer = null;
      function check() {
        var changed = [];
        targets.forEach(function (t) {
          var r = t.el.getBoundingClientRect();
          if (r.width !== t.w || r.height !== t.h) {
            t.w = r.width;
            t.h = r.height;
            changed.push({ target: t.el, contentRect: r });
          }
        });
        if (changed.length) callback(changed, self);
      }
      this.observe = function (el) {
        if (targets.some(function (t) { return t.el === el; })) return;
        targets.push({ el: el, w: -1, h: -1 });
        if (!timer) {
          timer = setInterval(check, 500);
          w.addEventListener('resize', check);
        }
        setTimeout(check, 0);
      };
      this.unobserve = function (el) {
        targets = targets.filter(function (t) { return t.el !== el; });
      };
      this.disconnect = function () {
        targets = [];
        clearInterval(timer);
        timer = null;
        w.removeEventListener('resize', check);
      };
    };
  }
})();
`;
