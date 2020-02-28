/**
 * Configuration and validation.
 * @module core/schema
 */
const Ajv = require('ajv');
const path = require('path');
const deepmerge = require('deepmerge');
const yaml = require('../util/yaml');

/**
 * A magic string for reformating comment lines in the YAML output.
 * @access private
 */
const MAGIC = 'c823d4d4';

/**
 * Default value for the primitive types.
 * @access private
 */
const PRIMITIVE_DEFAULTS = {
    'null': null,
    'boolean': false,
    'number': 0,
    'integer': 0,
    'string': '',
    'array': [],
    'object': {}
};

/**
 * The default value wrapper class.
 */
class DefaultValue {

    /**
     * @param {any} value The wrapped default value.
     * @param {string} description A description of the contained value. Used to produce
     * the comment string.
     */
    constructor(value, description) {
        this.value = value;
        this.description = description;
    }

    /**
     * Merge current default value with another default value.
     * <p>
     * The <code>description</code> property of the input will always override the description of current
     * default value if it exists.
     * If the <code>value</code> properties of the input and current object are both array, the input
     * <code>value</code> will be concatenated to the current <code>value</code>.
     * If the <code>value</code> properties of the input and current object are both object, the input
     * <code>value</code>'s property will override the property of the current
     * {@link module:core/schema~DefaultValue} <code>value</code> if they have the
     * same property name.
     * Otherwise, <code>deepmerge</code> will be used to merge the <code>value</code> property of input
     * with it of the current object, unless the <code>value</code> does not exist on the input object.
     *
     * @param {any} source The input object to be merged with.
     * @returns {module:core/schema~DefaultValue} The merge operation will modify the wrapped value in
     * place. <code>this</code> will be returned.
     */
    merge(source) {
        if ('description' in source && source.description) {
            this.description = source.description;
        }
        if ('value' in source && source.value) {
            if (this.value instanceof DefaultValue) {
                this.value.merge(source.value);
            } else if (Array.isArray(this.value) && Array.isArray(source.value)) {
                this.value.concat(...source.value);
            } else if (typeof this.value === 'object' && typeof source.value === 'object') {
                for (const key in source.value) {
                    this.value[key] = source.value[key];
                }
            } else {
                this.value = deepmerge(this.value, source.value);
            }
        }
        return this;
    }

    /**
     * Duplicate the current default value.
     *
     * @returns {module:core/schema~DefaultValue} A new instance of the current default value.
     */
    clone() {
        const result = new DefaultValue(this.value, this.description);
        if (result.value instanceof DefaultValue) {
            result.value = result.value.clone();
        } else if (Array.isArray(result.value)) {
            result.value = [].concat(...result.value);
        } else if (typeof result.value === 'object') {
            result.value = Object.assign({}, result.value);
        }
        return result;
    }

    /**
     * Create a new array with comments inserted as new elements right before each child element.
     * <p>
     * If current wrapped value is an array and some of its elements are instances of
     * {@link module:core/schema~DefaultValue}, the element's description will be inserted as a new child
     * right before the element.
     * The element itself will also be converted into its commented version using the <code>toCommented</code>
     * method.
     *
     * @returns {Array} A new array with comments and the original elements in the commented form.
     */
    toCommentedArray() {
        return [].concat(...this.value.map(item => {
            if (item instanceof DefaultValue) {
                if (typeof item.description !== 'string' || !item.description.trim()) {
                    return [item.toCommented()];
                }
                return item.description.split('\n').map((line, i) => {
                    return MAGIC + i + ': ' + line;
                }).concat(item.toCommented());
            }
            return [item];
        }));
    }

    /**
     * Create a new object with comments inserted as new properties right before every original properties.
     * <p>
     * Works similar to {@link module:core/schema~DefaultValue#toCommentedArray}.
     *
     * @returns {Object} A new object with comments and the original property values in the commented form.
     */
    toCommentedObject() {
        if (this.value instanceof DefaultValue) {
            return this.value.toCommented();
        }
        const result = {};
        for (const key in this.value) {
            const item = this.value[key];
            if (item instanceof DefaultValue) {
                if (typeof item.description === 'string' && item.description.trim()) {
                    item.description.split('\n').forEach((line, i) => {
                        result[MAGIC + key + i] = line;
                    });
                }
                result[key] = item.toCommented();
            } else {
                result[key] = item;
            }
        }
        return result;
    }

    /**
     * Call {@link module:core/schema~DefaultValue#toCommentedArray} or
     * {@link module:core/schema~DefaultValue#toCommentedObject} based on the type of the wrapped value.
     * <p>
     * If neither applies, directly return the wrapped value.
     *
     * @returns {any} The commented object/array, or the original wrapped value.
     */
    toCommented() {
        if (Array.isArray(this.value)) {
            return this.toCommentedArray();
        } else if (typeof this.value === 'object' && this.value !== null) {
            return this.toCommentedObject();
        }
        return this.value;
    }

    /**
     * Create the YAML string with all the comments from current default value.
     *
     * @returns {string} The formatted YAML string.
     */
    toYaml() {
        const regex = new RegExp('^(\\s*)(?:-\\s*\\\')?' + MAGIC + '.*?:\\s*\\\'?(.*?)\\\'*$', 'mg');
        return yaml.stringify(this.toCommented()).replace(regex, '$1# $2');// restore comments
    }
}

/* eslint-disable no-use-before-define */
class Schema {
    constructor(loader, def) {
        if (!(loader instanceof SchemaLoader)) {
            throw new Error('loader must be an instance of SchemaLoader');
        }
        if (typeof def !== 'object') {
            throw new Error('schema definition must be an object');
        }
        this.loader = loader;
        this.def = def;
        this.compiledSchema = null;
    }

    validate(obj) {
        if (!this.compiledSchema) {
            this.compiledSchema = this.loader.compileValidator(this.def.$id);
        }
        return this.compiledSchema(obj) ? true : this.compiledSchema.errors;
    }

    getArrayDefaultValue(def) {
        let value;
        const defaultValue = new DefaultValue(null, def.description);
        if ('items' in def && typeof def.items === 'object') {
            const items = Object.assign({}, def.items);
            delete items.oneOf;
            value = this.getDefaultValue(items);
        }
        if ('oneOf' in def.items && Array.isArray(def.items.oneOf)) {
            defaultValue.value = def.items.oneOf.map(one => {
                if (!(value instanceof DefaultValue)) {
                    return this.getDefaultValue(one);
                }
                return value.clone().merge(this.getDefaultValue(one));
            });
        } else {
            if (!Array.isArray(value)) {
                value = [value];
            }
            defaultValue.value = value;
        }
        return defaultValue;
    }

    getObjectDefaultValue(def) {
        const value = {};
        if ('properties' in def && typeof def.properties === 'object') {
            for (const property in def.properties) {
                value[property] = this.getDefaultValue(def.properties[property]);
            }
        }
        const defaultValue = new DefaultValue(value, def.description);
        if ('oneOf' in def && Array.isArray(def.oneOf) && def.oneOf.length) {
            defaultValue.merge(this.getDefaultValue(def.oneOf[0]));
            defaultValue.description = def.description;
        }
        return defaultValue;
    }

    getTypedDefaultValue(def) {
        let defaultValue;
        const type = Array.isArray(def.type) ? def.type[0] : def.type;
        if (type === 'array') {
            defaultValue = this.getArrayDefaultValue(def);
        } else if (type === 'object') {
            defaultValue = this.getObjectDefaultValue(def);
        } else if (type in PRIMITIVE_DEFAULTS) {
            if ('nullable' in def && def.nullable) {
                defaultValue = new DefaultValue(null, def.description);
            } else {
                defaultValue = new DefaultValue(PRIMITIVE_DEFAULTS[type], def.description);
            }
        } else {
            throw new Error(`Cannot get default value for type ${type}`);
        }
        // referred default value always get overwritten by its parent default value
        if ('$ref' in def && def.$ref) {
            defaultValue = this.getReferredDefaultValue(def).merge(defaultValue);
        }
        return defaultValue;
    }

    getReferredDefaultValue(def) {
        const schema = this.loader.getSchema(def.$ref);
        if (!schema) {
            throw new Error(`Schema ${def.$ref} is not loaded`);
        }
        return this.getDefaultValue(schema.def).merge({ description: def.description });
    }

    getDefaultValue(def = null) {
        if (!def) {
            def = this.def;
        }
        if ('const' in def) {
            return new DefaultValue(def.const, def.description);
        }
        if ('default' in def) {
            return new DefaultValue(def.default, def.description);
        }
        if ('examples' in def && Array.isArray(def.examples) && def.examples.length) {
            return new DefaultValue(def.examples[0], def.description);
        }
        if ('type' in def && def.type) {
            return this.getTypedDefaultValue(def);
        }
        // $ref only schemas
        if ('$ref' in def && def.$ref) {
            return this.getReferredDefaultValue(def);
        }
    }
}

class SchemaLoader {
    constructor() {
        this.schemas = {};
        this.ajv = new Ajv({ nullable: true });
    }

    getSchema($id) {
        return this.schemas[$id];
    }

    addSchema(def) {
        if (!Object.prototype.hasOwnProperty.call(def, '$id')) {
            throw new Error('The schema definition does not have an $id field');
        }
        this.ajv.addSchema(def);
        this.schemas[def.$id] = new Schema(this, def);
    }

    removeSchema($id) {
        this.ajv.removeSchema($id);
        delete this.schemas[$id];
    }

    compileValidator($id) {
        return this.ajv.compile(this.schemas[$id].def);
    }
}

function traverseObj(obj, targetKey, handler) {
    if (Array.isArray(obj)) {
        for (const child of obj) {
            traverseObj(child, targetKey, handler);
        }
    } else if (typeof obj === 'object') {
        for (const key in obj) {
            if (key === targetKey) {
                handler(obj[key]);
            } else {
                traverseObj(obj[key], targetKey, handler);
            }
        }
    }
}

SchemaLoader.load = (rootSchemaDef, resolveDirs = []) => {
    if (!Array.isArray(resolveDirs)) {
        resolveDirs = [resolveDirs];
    }
    resolveDirs.push(path.join(__dirname, '../schema/'));

    const loader = new SchemaLoader();
    loader.addSchema(rootSchemaDef);

    function handler($ref) {
        if (typeof $ref !== 'string') {
            throw new Error('Invalid schema reference id: ' + JSON.stringify($ref));
        }
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
            if (typeof def !== 'object' || def.$id !== $ref) {
                continue;
            }
            loader.addSchema(def);
            traverseObj(def, '$ref', handler);
            return;
        }
        throw new Error('Cannot find schema definition ' + $ref + '.\n'
            + 'Please check if the file exists and its $id is correct');
    }

    traverseObj(rootSchemaDef, '$ref', handler);
    return loader;
};

module.exports = {
    Schema,
    SchemaLoader,
    DefaultValue
};
