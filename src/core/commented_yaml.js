/**
 * Serialize the comment markers produced by DefaultValue as YAML comments.
 * @module core/commented_yaml
 */
const yaml = require('../util/yaml');

/** A magic string for reformatting comment lines in the YAML output. */
const MAGIC = 'c823d4d4';

/**
 * @param {any} value The commented object or array.
 * @returns {string} The formatted YAML string.
 */
function stringify(value) {
  // The YAML writer may quote comments. Parse them rather than removing quotes by hand.
  const property = new RegExp(`^(\\s*)(['"]?)${MAGIC}.*?\\2: (.*)$`);
  const element = new RegExp(`^(\\s*)- (.*${MAGIC}.*)$`);
  const comment = (indent, text) => `${indent}# ${text === null || text === undefined ? '' : text}`;
  return yaml
    .stringify(value)
    .split('\n')
    .map((line) => {
      let match = property.exec(line);
      if (match) {
        return comment(match[1], yaml.parse(match[3]));
      }
      match = element.exec(line);
      if (match) {
        const text = String(yaml.parse(match[2]));
        return comment(match[1], text.slice(text.indexOf(': ') + 2));
      }
      return line;
    })
    .join('\n');
}

module.exports = { MAGIC, stringify };
