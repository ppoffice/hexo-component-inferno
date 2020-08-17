/**
 * Custom YAML parse and stringify functions.
 * @module util/yaml
 */
const yaml = require('js-yaml');
const YamlType = require('js-yaml/lib/js-yaml/type');
const YamlSchema = require('js-yaml/lib/js-yaml/schema');

// output null as empty in yaml
const YAML_SCHEMA = new YamlSchema({
  include: [require('js-yaml/lib/js-yaml/schema/default_full')],
  implicit: [
    new YamlType('tag:yaml.org,2002:null', {
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
    return yaml.safeLoad(str);
  },

  /**
   * Dump the YAML string of a JavaScript value.
   *
   * @param {any} object JavaScript object or primitive value.
   * @returns {string} YAML string.
   */
  stringify(object) {
    return yaml.safeDump(object, {
      indent: 4,
      lineWidth: 1024,
      schema: YAML_SCHEMA,
    });
  },
};
