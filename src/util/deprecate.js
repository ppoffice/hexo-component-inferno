/**
 * Utility functions for warning about deprecated components.
 * @module util/deprecate
 */

const warned = new Set();

/**
 * Print a warning about a deprecated component, once per component.
 * <p>
 * Components are rendered for every page, so the warning is only printed the first time.
 *
 * @param {string} name Name of the component, such as <code>share.addthis</code>.
 * @param {string} message Why the component is deprecated, and what to use instead.
 * @example
 * deprecate('share.addthis', 'Service shut down. Use AddToAny or ShareThis.');
 */
function deprecate(name, message) {
  if (warned.has(name)) {
    return;
  }
  warned.add(name);
  // eslint-disable-next-line no-console
  console.warn(`hexo-component-inferno: ${name} is deprecated. ${message}`);
}

module.exports = { deprecate };
