/**
 * Default value wrappers, merging, and comment annotation, independent of schema loading/validation.
 * @module core/default_value
 */
const { typeOf, hasOwnProperty } = require('./schema_util');
const { MAGIC, stringify } = require('./commented_yaml');

/** The default value wrapper class. */
class DefaultValue {
  /**
   * @param {any} value The wrapped default value.
   * @param {string} description A description used to produce the comment string.
   */
  constructor(value, description) {
    this.value = value;
    this.description = description;
  }

  /**
   * Duplicate this wrapper, shallow-copying its wrapped arrays and objects.
   * @returns {DefaultValue} A new wrapper.
   */
  clone() {
    const result = new DefaultValue(this.value, this.description);
    if (result.value instanceof DefaultValue) {
      result.value = result.value.clone();
    } else if (typeOf(result.value) === 'array') {
      result.value = [].concat(result.value);
    } else if (typeOf(result.value) === 'object') {
      result.value = Object.assign({}, result.value);
    }
    return result;
  }

  /** Unwrap nested wrappers, preferring the innermost non-empty description. */
  flatten() {
    if (this.value instanceof DefaultValue) {
      this.value.flatten();
      if (hasOwnProperty(this.value, 'description') && this.value.description) {
        this.description = this.value.description;
      }
      this.value = this.value.value;
    }
  }

  /**
   * Merge a wrapper with the same value type, concatenating arrays and assigning object properties.
   * @param {DefaultValue} source The wrapper to merge.
   */
  merge(source) {
    if (hasOwnProperty(source, 'value') && source.value !== null) {
      this.flatten();
      if (source.value instanceof DefaultValue) {
        source = source.clone();
        source.flatten();
      }
      if (typeOf(source.value) === typeOf(this.value)) {
        if (typeOf(this.value) === 'array') {
          this.value = this.value.concat(source.value);
        } else if (typeOf(this.value) === 'object') {
          Object.keys(source.value).forEach((key) => {
            this.value[key] = source.value[key];
          });
        } else {
          this.value = source.value;
        }
      } else if (typeOf(this.value) === 'undefined' || typeOf(this.value) === 'null') {
        this.value = source.value;
      }
    }
    if (hasOwnProperty(source, 'description') && source.description) {
      this.description = source.description;
    }
  }

  /**
   * Insert description markers before each wrapped array element.
   * @returns {Array} A new array of comments and annotated values.
   */
  toCommentedArray() {
    return [].concat(
      ...this.value.map((item) => {
        if (item instanceof DefaultValue) {
          if (typeOf(item.description) !== 'string' || !item.description.trim()) {
            return [item.toCommented()];
          }
          return item.description
            .split('\n')
            .map((line, i) => {
              return MAGIC + i + ': ' + line;
            })
            .concat(item.toCommented());
        } else if (typeOf(item) === 'array' || typeOf(item) === 'object') {
          return new DefaultValue(item).toCommented();
        }
        return [item];
      }),
    );
  }

  /**
   * Insert description markers before each wrapped object property.
   * @returns {Object} A new object of comments and annotated values.
   */
  toCommentedObject() {
    if (this.value instanceof DefaultValue) {
      return this.value.toCommented();
    }
    const result = {};
    for (const key in this.value) {
      const item = this.value[key];
      if (item instanceof DefaultValue) {
        if (typeOf(item.description) === 'string' && item.description.trim()) {
          item.description.split('\n').forEach((line, i) => {
            result[MAGIC + key + i] = line;
          });
        }
        result[key] = item.toCommented();
      } else if (typeOf(item) === 'array' || typeOf(item) === 'object') {
        result[key] = new DefaultValue(item).toCommented();
      } else {
        result[key] = item;
      }
    }
    return result;
  }

  /**
   * Annotate arrays and objects with comment markers, or return a primitive value unchanged.
   * @returns {any} The annotated value.
   */
  toCommented() {
    if (typeOf(this.value) === 'array') {
      return this.toCommentedArray();
    } else if (typeOf(this.value) === 'object') {
      return this.toCommentedObject();
    }
    return this.value;
  }

  /**
   * Create YAML including the descriptions of nested values as comments.
   * @returns {string} The formatted YAML string.
   */
  toYaml() {
    return stringify(this.toCommented());
  }
}

module.exports = DefaultValue;
