/**
 * Utility functions for translations.
 * @module util/i18n
 */

/**
 * Translate a key with the <code>__</code> helper of Hexo, or use the fallback text when the theme has
 * no translation for the key, in which case Hexo returns the key itself.
 *
 * @param {Function} __ The <code>__</code> helper function of Hexo.
 * @param {string} key The translation key.
 * @param {string} fallback The text to use without a translation.
 * @returns {string} The translated text.
 *
 * @example
 * translate(helper.__, 'widget.more', 'More');
 */
function translate(__, key, fallback) {
  const text = typeof __ === 'function' ? __(key) : null;
  return text && text !== key ? text : fallback;
}

module.exports = { translate };
