/**
 * Configuration and validation.
 * @module core/schema
 */
const Ajv = require('ajv');
const path = require('path');
const { MAGIC } = require('./commented_yaml');
const DefaultValue = require('./default_value');
const { typeOf, hasOwnProperty } = require('./schema_util');

/**
 * Deep copy a value of a JSON schema definition, so that changing a default value does not change the
 * definition, which other schemas may refer to.
 * @private
 */
function copy(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

/**
 * Default value for the primitive types.
 * @access private
 */
const PRIMITIVE_DEFAULTS = {
  null: null,
  boolean: false,
  number: 0,
  integer: 0,
  string: '',
  array: [],
  object: {},
};

function traverseObj(obj, targetKey, handler) {
  if (typeOf(obj) === 'array') {
    for (const child of obj) {
      traverseObj(child, targetKey, handler);
    }
  } else if (typeOf(obj) === 'object') {
    for (const key in obj) {
      if (key === targetKey) {
        handler(obj[key]);
      } else {
        traverseObj(obj[key], targetKey, handler);
      }
    }
  }
}

/* eslint-disable no-use-before-define */
/**
 * A class that can resolving referenced JSON schemas and create {@link module:core/schema~DefaultValue}s.
 */
class Schema {
  /**
   * @param {module:core/schema~SchemaLoader} loader JSON schema loader.
   * @param {Object} def The JSON schema definition.
   */
  constructor(loader, def) {
    if (!(loader instanceof SchemaLoader)) {
      throw new Error('loader must be an instance of SchemaLoader');
    }
    if (typeOf(def) !== 'object') {
      throw new Error('schema definition must be an object');
    }
    this.loader = loader;
    this.def = def;
    this.compiledSchema = null;
  }

  /**
   * Validate an object against the JSON schema.
   *
   * @param {any} obj Object to be validated.
   * @returns {boolean|Object} True if Object is valid, or validation errors.
   */
  validate(obj) {
    if (!this.compiledSchema) {
      this.compiledSchema = this.loader.compileValidator(this.def.$id);
    }
    return this.compiledSchema(obj) ? true : this.compiledSchema.errors;
  }

  /**
   * Create the {@link module:core/schema~DefaultValue} for an array-typed JSON schema.
   * <p>
   * Each possible type of the array elements defined in <code>oneOf</code> will be processed and a
   * {@link module:core/schema~DefaultValue} will be added to the result array.
   *
   * @param {Object} def JSON schema definition of the array.
   * @returns {@link module:core/schema~DefaultValue} The {@link module:core/schema~DefaultValue} for the
   * array definition.
   */
  getArrayDefaultValue(def) {
    const defaultValue = new DefaultValue(null, def.description);
    // all array elements have the same type, return the default value for that type
    if (typeOf(def.items) === 'object') {
      const items = Object.assign({}, def.items);
      delete items.oneOf;
      let value = this.getDefaultValue(items);
      // additionally, if each array element can be in one of the provided types in <code>oneOf</code>
      if (typeOf(def.items.oneOf) === 'array') {
        // for each <code>oneOf</code> element, return a {@link module:core/schema~DefaultValue}
        defaultValue.value = def.items.oneOf.map((one) => {
          // if the <code>items</code> definition also exists, merge it with the <code>oneOf</code>
          // {@link module:core/schema~DefaultValue}
          const clone = value.clone();
          clone.merge(this.getDefaultValue(one));
          return clone;
        });
      } else {
        if (typeOf(value) !== 'array') {
          value = [value];
        }
        defaultValue.value = value;
      }
    }
    return defaultValue;
  }

  /**
   * Create the {@link module:core/schema~DefaultValue} for an object-typed JSON schema.
   * <p>
   * The first possible type of the object element defined in <code>oneOf</code> will be processed and its
   * {@link module:core/schema~DefaultValue} will be merged with the {@link module:core/schema~DefaultValue}
   * created from the <code>properties</code> definition.
   *
   * @param {Object} def JSON schema definition of the object.
   * @returns {@link module:core/schema~DefaultValue} The {@link module:core/schema~DefaultValue} for the
   * object definition.
   */
  getObjectDefaultValue(def) {
    const value = {};
    if (typeOf(def.properties) === 'object') {
      for (const property in def.properties) {
        value[property] = this.getDefaultValue(def.properties[property]);
      }
    }
    const defaultValue = new DefaultValue(value, def.description);
    // only the first one of the possible types will be merged with {@link module:core/schema~DefaultValue}
    // for the <code>properties</code> definition.
    if (typeOf(def.oneOf) === 'array' && def.oneOf.length) {
      defaultValue.merge(this.getDefaultValue(def.oneOf[0]));
      defaultValue.description = def.description;
    }
    return defaultValue;
  }

  /**
   * Create the {@link module:core/schema~DefaultValue} for any typed JSON schema that is not purely defined
   * by its <code>$ref</code>.
   * <p>
   * If the definition also contains a <code>$ref</code>, the {@link module:core/schema~DefaultValue} for the
   * <code>$ref</code> definition will be merged to the {@link module:core/schema~DefaultValue} of the current
   * definition.
   * <p>
   * If <code>type</code> of the JSON schema is of primitive types, and the <code>nullable</code> is set to
   * <code>false</code> in the schema definition, primitive default values will be set insided the result
   * {@link module:core/schema~DefaultValue}.
   *
   * @param {Object} def JSON schema definition.
   * @returns {@link module:core/schema~DefaultValue} The {@link module:core/schema~DefaultValue} for the
   * definition.
   * @throws {Error} If <code>type</code> is undefined or it is 'array', 'object', or primitive types.
   */
  getTypedDefaultValue(def) {
    let defaultValue;
    const type = typeOf(def.type) === 'array' ? def.type[0] : def.type;
    if (type === 'array') {
      defaultValue = this.getArrayDefaultValue(def);
    } else if (type === 'object') {
      defaultValue = this.getObjectDefaultValue(def);
    } else if (hasOwnProperty(PRIMITIVE_DEFAULTS, type)) {
      if (hasOwnProperty(def, 'nullable') && def.nullable) {
        defaultValue = new DefaultValue(null, def.description);
      } else {
        defaultValue = new DefaultValue(PRIMITIVE_DEFAULTS[type], def.description);
      }
    } else {
      throw new Error(`Cannot get default value for type ${type}`);
    }
    // referred default value always get overwritten by its parent default value
    if (hasOwnProperty(def, '$ref') && def.$ref) {
      const refDefaultValue = this.getReferredDefaultValue(def);
      refDefaultValue.merge(defaultValue);
      defaultValue = refDefaultValue;
    }
    return defaultValue;
  }

  /**
   * Create the {@link module:core/schema~DefaultValue} for any JSON schema that is purely defined by its
   * <code>$ref</code>.
   *
   * @param {Object} def JSON schema definition.
   * @returns {@link module:core/schema~DefaultValue} The {@link module:core/schema~DefaultValue} for the
   * definition.
   */
  getReferredDefaultValue(def) {
    const schema = this.loader.getSchema(def.$ref);
    if (!schema) {
      throw new Error(`Schema ${def.$ref} is not loaded`);
    }
    const defaultValue = this.getDefaultValue(schema.def);
    defaultValue.merge({ description: def.description });
    return defaultValue;
  }

  /**
   * Create the {@link module:core/schema~DefaultValue} for any JSON schema.
   *
   * @param {Object} def JSON schema definition.
   * @returns {@link module:core/schema~DefaultValue} The {@link module:core/schema~DefaultValue} for the
   * definition.
   */
  getDefaultValue(def = null) {
    if (!def) {
      def = this.def;
    }
    if (hasOwnProperty(def, 'const')) {
      return new DefaultValue(copy(def.const), def.description);
    }
    if (hasOwnProperty(def, 'default')) {
      return new DefaultValue(copy(def.default), def.description);
    }
    if (
      hasOwnProperty(def, 'examples') &&
      typeOf(def.examples) === 'array' &&
      def.examples.length
    ) {
      return new DefaultValue(copy(def.examples[0]), def.description);
    }
    if (hasOwnProperty(def, 'type') && def.type) {
      return this.getTypedDefaultValue(def);
    }
    // $ref only schemas
    if (hasOwnProperty(def, '$ref') && def.$ref) {
      return this.getReferredDefaultValue(def);
    }
    throw new Error(
      'The following schema definition must have at least one of the ' +
        '["const", "default", "examples", "type", "$ref"] fields:\n' +
        JSON.stringify(def, null, 2),
    );
  }
}

/**
 * Class for loading JSON schema files from filesystems and creating validator.
 */
class SchemaLoader {
  constructor() {
    this.schemas = {};
    this.ajv = new Ajv({ allowUnionTypes: true });
  }

  /**
   * Get JSON schema definition by its <code>$id</code>.
   *
   * @param {string} $id JSON schema <code>$id</code>.
   * @returns {Object} JSON schema definition.
   */
  getSchema($id) {
    return this.schemas[$id];
  }

  /**
   * Add a JSON schema definition to the collection.
   *
   * @param {Object} JSON schema definition.
   * @throws {Error} If JSON schema definition does not have an <code>$id</code>.
   */
  addSchema(def) {
    if (!hasOwnProperty(def, '$id')) {
      throw new Error('The schema definition does not have an $id field');
    }
    this.ajv.addSchema(def);
    this.schemas[def.$id] = new Schema(this, def);
  }

  /**
   * Remove a JSON schema definition to the collection.
   *
   * @param {string} $id JSON schema <code>$id</code>.
   */
  removeSchema($id) {
    this.ajv.removeSchema($id);
    delete this.schemas[$id];
  }

  /**
   * Create a JSON schema validation function for a given schema identified by its <code>$id</code>.
   *
   * @param {*} $id $id JSON schema <code>$id</code>.
   * @returns {Function} JSON schema validation function.
   */
  compileValidator($id) {
    return this.ajv.compile(this.getSchema($id).def);
  }
}

/**
 * Create a {@link module:core/schema~SchemaLoader} and load all referred JSON schema from the resolve
 * directories.
 *
 * @param {Object} rootSchemaDef The root JSON schema definition.
 * @param {Array} resolveDirs Additional directories for resolving referred JSON schemas besides the
 * <code>lib/schema</code> folder in this library. Directory order matters.
 * @returns {@link module:core/schema~SchemaLoader} The schema loader with all referred schemas loaded.
 * @throws {Error} Referred schema not found in any of the resolve directories.
 */
SchemaLoader.load = (rootSchemaDef, resolveDirs = []) => {
  // A new array, so that the directories of the caller are not changed
  resolveDirs = [].concat(resolveDirs, path.join(__dirname, '../schema/'));

  const loader = new SchemaLoader();
  loader.addSchema(rootSchemaDef);

  function handler($ref) {
    if (loader.getSchema($ref)) {
      return;
    }
    for (const dir of resolveDirs) {
      let def;
      try {
        def = require(path.join(dir, $ref));
      } catch (e) {
        continue;
      }
      if (typeOf(def) !== 'object' || def.$id !== $ref) {
        continue;
      }
      loader.addSchema(def);
      traverseObj(def, '$ref', handler);
      return;
    }
    throw new Error(
      'Cannot find schema definition ' +
        $ref +
        '.\n' +
        'Please check if the file exists and its $id is correct',
    );
  }

  traverseObj(rootSchemaDef, '$ref', handler);
  return loader;
};

module.exports = {
  MAGIC,
  Schema,
  SchemaLoader,
  DefaultValue,
};
