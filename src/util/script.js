/**
 * A utility function for building inline scripts that load external scripts without blocking the page.
 * @module util/script
 */

/**
 * Build an inline script that loads external scripts asynchronously and in order, and then runs the
 * given code.
 * <p>
 * A script that is already on the page is not added again. If it has finished loading, or it was not
 * added by this function, the next one is loaded, or the code runs, right away. This lets the inline
 * script be run again, for example by PJAX after switching pages, without loading the external scripts
 * twice.
 *
 * @param {string|string[]} urls URL(s) of the external scripts to load, in order.
 * @param {string} code JavaScript code to run after all external scripts are loaded.
 * @param {Object} [attrs] Extra attributes to set on the external script elements.
 * @returns {string} The inline JavaScript code.
 *
 * @example
 * <script dangerouslySetInnerHTML={{ __html: loadScripts('/path/to/lib.js', 'lib.init();') }} />
 */
module.exports = function (urls, code, attrs = {}) {
  return `(function () {
    var urls = ${JSON.stringify([].concat(urls))};
    var attrs = ${JSON.stringify(attrs)};
    function run() {
      ${code}
    }
    function load(i) {
      if (i >= urls.length) {
        run();
        return;
      }
      var script = null;
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].getAttribute('src') === urls[i]) {
          script = document.scripts[j];
          break;
        }
      }
      if (script && script.getAttribute('data-loaded') !== 'false') {
        load(i + 1);
        return;
      }
      if (!script) {
        script = document.createElement('script');
        script.src = urls[i];
        script.async = true;
        script.setAttribute('data-loaded', 'false');
        for (var name in attrs) {
          script.setAttribute(name, attrs[name]);
        }
        script.addEventListener('load', function () {
          this.setAttribute('data-loaded', 'true');
        });
        document.head.appendChild(script);
      }
      script.addEventListener('load', function () {
        load(i + 1);
      });
    }
    load(0);
  })();`;
};
