/**
 * Utility functions for HTML text.
 * @module util/html
 */
const { stripHTML } = require('hexo-util');

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/**
 * Decode the character references in HTML text, such as <code>&amp;amp;</code>,
 * <code>&amp;#39;</code> and <code>&amp;#x1F600;</code>.
 * <p>
 * Numeric references and the named ones that Markdown renderers output are decoded. Other named
 * references are kept as they are.
 *
 * @param {string} str HTML text.
 * @returns {string} The text.
 */
function decodeHTML(str) {
  return str.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    const char = ENTITIES[entity.toLowerCase()];
    return char === undefined ? match : char;
  });
}

/**
 * Convert HTML to plain text on one line, for example to index or describe a page.
 *
 * @param {string} html HTML.
 * @returns {string} The text, with the tags removed, the character references decoded, and the
 * whitespace collapsed.
 */
function toPlainText(html) {
  return decodeHTML(stripHTML(html || ''))
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { decodeHTML, toPlainText };
