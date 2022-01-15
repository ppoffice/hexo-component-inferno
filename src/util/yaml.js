/**
 * Custom YAML parse and stringify functions.
 * @module util/yaml
 */
const yaml = require('js-yaml');

// output null as empty in yaml
const YAML_SCHEMA = yaml.DEFAULT_SCHEMA.extend({
  implicit: [
    new yaml.Type('tag:yaml.org,2002:null', {
      kind: 'scalar',
      resolve(data) {
        if (data === null) {
          return true;
        }
        const max = data.length;
        return (
          (max === 1 && data === '~') ||
          (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'))
        );
      },
      construct: () => null,
      predicate: (object) => object === null,
      represent: {
        empty: () => '',
      },
      defaultStyle: 'empty',
    }),
  ],
});

module.exports = {
  /**
   * Parse a YAML string into a JavaScript value.
   *
   * @param {string} str YAML string.
   * @returns {any} JavaScript object or primitive value.
   */
  parse(str) {
    return yaml.load(str);
  },

  /**
   * Dump the YAML string of a JavaScript value.
   *
   * @param {any} object JavaScript object or primitive value.
   * @returns {string} YAML string.
   */
  stringify(object) {
    return yaml.dump(object, {
      indent: 4,
      lineWidth: 1024,
      schema: YAML_SCHEMA,
    });
  },
};
