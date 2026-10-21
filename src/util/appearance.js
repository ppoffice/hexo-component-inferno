/**
 * Utility functions for inline scripts that follow the appearance of the page.
 * @module util/appearance
 */

/**
 * Get a JavaScript expression that is true when the page looks dark.
 * <p>
 * A theme can set the appearance of a page with the <code>data-appearance</code> attribute of
 * <code>&lt;html&gt;</code>: <code>dark</code> always looks dark, <code>auto</code> looks dark when
 * the system prefers a dark color scheme, and any other value, or no attribute, looks light.
 *
 * @returns {string} The JavaScript expression.
 *
 * @example
 * const js = `var theme = ${isDark()} ? 'dark' : 'light';`;
 */
function isDark() {
  return `(function (appearance) {
    return appearance === 'dark' || (appearance === 'auto' && !!window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  })(document.documentElement.getAttribute('data-appearance'))`;
}

/**
 * Get a JavaScript expression for the appearance of the page: <code>'dark'</code>,
 * <code>'auto'</code>, or <code>'light'</code>.
 *
 * @returns {string} The JavaScript expression.
 * @see module:util/appearance.isDark
 */
function getAppearance() {
  return `(function (appearance) {
    return appearance === 'dark' || appearance === 'auto' ? appearance : 'light';
  })(document.documentElement.getAttribute('data-appearance'))`;
}

module.exports = { isDark, getAppearance };
