/**
 * Utility functions for building inline scripts that load external scripts without blocking the page.
 * @module util/script
 */

/**
 * Convert a value to JavaScript code that can be put in an inline <code>&lt;script&gt;</code>.
 * <p>
 * Unlike <code>JSON.stringify</code> alone, it escapes <code>&lt;</code>, so that a value containing
 * <code>&lt;/script&gt;</code>, such as a page title, cannot end the inline script, and the line
 * separators U+2028 and U+2029, which older browsers do not allow in JavaScript strings.
 *
 * @param {any} value A value that can be converted to JSON.
 * @returns {string} The JavaScript code.
 *
 * @example
 * toJs('</script>'); // '"\\u003c/script>"'
 */
function toJs(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

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
function loadScripts(urls, code, attrs = {}) {
  return `(function () {
    var urls = ${toJs([].concat(urls))};
    var attrs = ${toJs(attrs)};
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
}

/**
 * Build an inline script that adds an external script to an element, for example the client script of
 * a comment system that reads its options from the attributes of its own <code>&lt;script&gt;</code>
 * tag.
 * <p>
 * The external script is added every time the inline script runs. Unlike a <code>&lt;script&gt;</code>
 * tag in the page, which PJAX runs again without its attributes and outside of its element, it keeps
 * its attributes and stays in the element. It is added after the inline script has finished, so that
 * PJAX, which runs the scripts of the new page right after switching to it, does not run it again.
 *
 * @param {string} selector CSS selector of the element to add the external script to.
 * @param {string} url URL of the external script.
 * @param {Object} attrs Attributes to set on the external script element.
 * @param {Object} [dynamicAttrs] More attributes, whose values are JavaScript expressions evaluated by
 * the inline script, for example to choose a theme in the browser.
 * @returns {string} The inline JavaScript code.
 *
 * @example
 * appendScript('#comments-thread', 'https://comments.example.com/client.js', { repo: 'user/repo' }, {
 *   theme: "window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'",
 * });
 */
function appendScript(selector, url, attrs, dynamicAttrs = {}) {
  const dynamic = Object.keys(dynamicAttrs)
    .map((name) => `attrs[${toJs(name)}] = ${dynamicAttrs[name]};`)
    .join('\n    ');
  return `(function () {
    var element = document.querySelector(${toJs(selector)});
    if (!element) {
      return;
    }
    var attrs = ${toJs(attrs)};
    ${dynamic}
    var script = document.createElement('script');
    for (var name in attrs) {
      script.setAttribute(name, attrs[name]);
    }
    script.src = ${toJs(url)};
    script.async = true;
    setTimeout(function () {
      element.appendChild(script);
    });
  })();`;
}

module.exports = loadScripts;
module.exports.appendScript = appendScript;
module.exports.toJs = toJs;
