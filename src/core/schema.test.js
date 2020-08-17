const { MAGIC, DefaultValue, Schema, SchemaLoader } = require('./schema');

const PRIMARY_INPUTS = [null, false, true, 0, 1, '', '1'];

describe('DefaultValue class tests', () => {
  describe('#clone()', () => {
    test('Clone DefaultValue', () => {
      PRIMARY_INPUTS.forEach((val) => {
        const result = new DefaultValue(val, 'source').clone();
        expect(result.description).toBe('source');
        expect(result.value).toBe(val);
      });

      let source = new DefaultValue([1, [2]], 'source');
      let result = source.clone();
      expect(result.value).not.toBe(source.value);
      expect(result.value).toEqual(source.value);
      expect(result.description).toBe(source.description);

      source = new DefaultValue({ a: 1, b: { c: 2 } }, 'source');
      result = source.clone();
      expect(result.value).not.toBe(source.value);
      expect(result.value).toEqual(source.value);
      expect(result.description).toBe(source.description);
    });

    test('Clone nested DefaultValue', () => {
      const source = new DefaultValue(new DefaultValue({ a: 1 }, 'child'), 'parent');
      const result = source.clone();
      expect(result.value instanceof DefaultValue).toBe(true);
      expect(result.value.value).not.toBe(source.value.value);
      expect(result.value.value).toEqual(source.value.value);
      expect(result.description).toBe(source.description);
      expect(result.value.description).toBe(source.value.description);
    });
  });

  describe('#flatten()', () => {
    test('Flatten nested DefaultValue', () => {
      const source = new DefaultValue(new DefaultValue({ a: 1 }, 'child'), 'parent');
      source.flatten();
      expect(source.description).toBe('child');
      expect(source.value).toEqual({ a: 1 });
    });

    test("Don't flatten DefaultValue is its value is not a DefaultValue", () => {
      const source = new DefaultValue({ value: new DefaultValue({ a: 1 }, 'child') }, 'parent');
      source.flatten();
      expect(source.description).toBe('parent');
      expect(source.value.value.description).toBe('child');
      expect(source.value.value.value).toEqual({ a: 1 });
    });
  });

  describe('#merge()', () => {
    test('Merge descriptions', () => {
      const target = new DefaultValue(true, 'val1');
      const source = new DefaultValue(true, 'val2');
      target.merge(source);
      expect(target.description).toBe('val2');
      source.description = '';
      target.merge(source);
      expect(target.description).toBe('val2');
      delete source.description;
      target.merge(source);
      expect(target.description).toBe('val2');
    });

    test('Merge another primary default value', () => {
      PRIMARY_INPUTS.forEach((val1) => {
        PRIMARY_INPUTS.forEach((val2) => {
          const target = new DefaultValue(val1);
          const source = new DefaultValue(val2);
          target.merge(source);
          if (typeof val1 === typeof val2 || val1 === null) {
            expect(target.value).toBe(val2);
          } else {
            expect(target.value).toBe(val1);
          }
        });
      });
    });

    test('Merge arrays', () => {
      const target = new DefaultValue([1, ['2']]);
      const source = new DefaultValue(['3', [4]]);
      target.merge(source);
      expect(target.value).toEqual([1, ['2'], '3', [4]]);
    });

    test('Merge objects', () => {
      const target = new DefaultValue({ a: 1, b: 2 });
      const source = new DefaultValue({ c: 3 });
      target.merge(source);
      expect(target.value).toEqual({ a: 1, b: 2, c: 3 });
      source.value = { a: 4, b: { d: 5 } };
      target.merge(source);
      expect(target.value).toEqual({ a: 4, b: { d: 5 }, c: 3 });
    });

    test('Recursive merge if .value is a DefaultValue', () => {
      const target = new DefaultValue(new DefaultValue({ a: 1 }));
      const source = new DefaultValue({ b: 2 });
      target.merge(source);
      expect(target.value).toEqual({ a: 1, b: 2 });
      source.value = new DefaultValue({ c: 3 }, 'child');
      target.merge(source);
      expect(target.description).toEqual('child');
      expect(target.value).toEqual({ a: 1, b: 2, c: 3 });
      target.value = { a: 1 };
      target.merge(source);
      expect(target.value).toEqual({ a: 1, c: 3 });
    });
  });

  describe('#toCommented()', () => {
    test('Primary DefaultValue', () => {
      PRIMARY_INPUTS.forEach((val) => {
        const source = new DefaultValue(val, 'source');
        expect(source.toCommented()).toBe(val);
      });
    });

    test('Nested DefaultValue', () => {
      const source = new DefaultValue(new DefaultValue(1, 'child'), 'parent');
      expect(source.toCommented()).toBe(1);
    });

    test('#toCommentedArray()', () => {
      const source = new DefaultValue(
        [
          0,
          new DefaultValue(1, 'child-1'),
          2,
          new DefaultValue(3, 'child-3\nchild-4'),
          new DefaultValue(4),
        ],
        'parent',
      );
      expect(source.toCommented()).toEqual(source.toCommentedArray());
      expect(source.toCommented()).toEqual([
        0,
        MAGIC + '0: child-1',
        1,
        2,
        MAGIC + '0: child-3',
        MAGIC + '1: child-4',
        3,
        4,
      ]);
    });

    test('#toCommentedObject()', () => {
      const source = new DefaultValue(
        {
          a: 0,
          b: new DefaultValue(1, 'child-1'),
          c: 2,
          d: new DefaultValue(3, 'child-3\nchild-4'),
        },
        'parent',
      );
      expect(source.toCommented()).toEqual(source.toCommentedObject());
      expect(source.toCommented()).toEqual({
        a: 0,
        [MAGIC + 'b0']: 'child-1',
        b: 1,
        c: 2,
        [MAGIC + 'd0']: 'child-3',
        [MAGIC + 'd1']: 'child-4',
        d: 3,
      });
    });

    test('Complex cases', () => {
      let source = new DefaultValue(
        {
          a: [0, new DefaultValue(1, 'child-1')],
        },
        'parent',
      );
      expect(source.toCommented()).toEqual({ a: [0, MAGIC + '0: child-1', 1] });
      source = new DefaultValue([0, { a: new DefaultValue(1, 'child-1') }], 'parent');
      expect(source.toCommented()).toEqual([0, { [MAGIC + 'a0']: 'child-1', a: 1 }]);
    });
  });

  describe('#toYaml()', () => {
    const source = new DefaultValue(
      {
        a: new DefaultValue(1, 'child-1'),
        b: new DefaultValue(2, 'child-2\nchild-3'),
        c: 0,
        d: [0, new DefaultValue(3, 'child-4')],
        e: { f: 4, g: new DefaultValue(5, 'child-5') },
        h: new DefaultValue(1),
      },
      'parent',
    );
    expect(source.toYaml()).toEqual(
      '# child-1\na: 1\n# child-2\n# child-3\nb: 2\nc: 0\nd:\n    - 0' +
        '\n    # child-4\n    - 3\ne:\n    f: 4\n    # child-5\n    g: 5\nh: 1\n',
    );
  });
});

describe('SchemaLoader class tests', () => {
  const loader = new SchemaLoader();
  const definitions = [
    require('../../fixture/schema/root'),
    require('../../fixture/schema/parent'),
    require('../../fixture/schema/child1'),
    require('../../fixture/schema/child2'),
  ];

  test('#addSchema()', () => {
    expect(Object.prototype.hasOwnProperty.call(loader.schemas, '')).toBe(false);
    definitions.forEach(loader.addSchema.bind(loader));
    definitions.forEach((def) => {
      expect(Object.prototype.hasOwnProperty.call(loader.schemas, def.$id)).toBe(true);
    });
    expect(Object.keys(loader.schemas).length).toBe(definitions.length);
    expect(() => {
      loader.addSchema(definitions[0]);
    }).toThrow();
    expect(() => {
      loader.addSchema({});
    }).toThrow();
  });

  test('#removeSchema()', () => {
    loader.removeSchema(definitions[0].$id);
    expect(Object.keys(loader.schemas).length).toBe(definitions.length - 1);
    expect(Object.prototype.hasOwnProperty.call(loader, definitions[0].$id)).toBe(false);
    loader.removeSchema(definitions[definitions.length - 1].$id);
    expect(Object.keys(loader.schemas).length).toBe(definitions.length - 2);
    expect(
      Object.prototype.hasOwnProperty.call(loader, definitions[definitions.length - 1].$id),
    ).toBe(false);

    loader.addSchema(definitions[0]);
    loader.addSchema(definitions[definitions.length - 1]);
  });

  test('#getSchema()', () => {
    expect(loader.getSchema(definitions[0].$id) instanceof Schema).toBe(true);
    expect(loader.getSchema(definitions[0].$id).def).toBe(definitions[0]);
    expect(loader.getSchema('')).toBeUndefined();
  });

  test('#compileValidator()', () => {
    const validate = loader.compileValidator(definitions[0].$id);
    expect(typeof validate).toBe('function');
    expect(validate({ parent: { prop1: '' } })).toBe(false);
    expect(validate.errors).toBeDefined();
    expect(validate.errors).not.toBeNull();
    expect(validate({ parent: [] })).toBe(true);
    expect(validate.errors).toBeNull();
  });

  test('SchemaLoader.load()', () => {
    let loader = SchemaLoader.load(definitions[0], '../../fixture/schema');
    definitions.forEach((def) => expect(loader.getSchema(def.$id) instanceof Schema).toBe(true));
    definitions.forEach((def) => expect(loader.getSchema(def.$id).def).toBe(def));

    loader = SchemaLoader.load({
      $id: '/root.json',
      type: 'object',
      properties: {
        ref: {
          $ref: '/comment/disqus.json',
        },
      },
    });
    expect(Object.keys(loader.schemas).length).toBe(2);
    expect(loader.getSchema('/comment/disqus.json').def).toEqual(
      require('../schema/comment/disqus.json'),
    );

    expect(() => {
      return SchemaLoader.load({
        $id: '/root.json',
        type: 'object',
        properties: {
          ref: {
            $ref: '/unknown.json',
          },
        },
      });
    }).toThrow();
  });
});

describe('Schema class tests', () => {
  const loader = new SchemaLoader();
  const definitions = [
    require('../../fixture/schema/root'),
    require('../../fixture/schema/parent'),
    require('../../fixture/schema/child1'),
    require('../../fixture/schema/child2'),
  ];
  definitions.forEach(loader.addSchema.bind(loader));

  test('.constructor()', () => {
    expect(() => {
      return new Schema();
    }).toThrow();
    expect(() => {
      return new Schema(loader);
    }).toThrow();
  });

  test('#validate()', () => {
    const schema = new Schema(loader, definitions[2]);
    expect(schema.validate({})).not.toBe(true);
    expect(schema.validate({ prop1: 'prop1', prop2: 'prop2' })).toBe(true);
  });

  test('#getArrayDefaultValue()', () => {
    const schema = new Schema(loader, {
      $id: '/example.json',
      type: 'array',
      items: {
        type: 'string',
        description: 'array element',
      },
    });
    let defaultValue = schema.getArrayDefaultValue(schema.def);
    expect(Array.isArray(defaultValue.value)).toBe(true);
    expect(defaultValue.value.length).toBe(1);
    expect(defaultValue.value[0] instanceof DefaultValue).toBe(true);
    expect(defaultValue.value[0].value).toBe('');
    expect(defaultValue.value[0].description).toBe('array element');

    schema.def.items.oneOf = [
      { type: 'string', const: 'hello' },
      { type: 'string', default: 'world', description: 'world element' },
    ];
    defaultValue = schema.getArrayDefaultValue(schema.def);
    expect(defaultValue.value.length).toBe(2);
    expect(defaultValue.value[0].value).toBe('hello');
    expect(defaultValue.value[1].value).toBe('world');
    expect(defaultValue.value[0].description).toBe('array element');
    expect(defaultValue.value[1].description).toBe('world element');
  });

  test('#getObjectDefaultValue()', () => {
    const schema = new Schema(loader, {
      $id: '/example.json',
      type: 'object',
      properties: {
        prop1: {
          type: 'string',
          description: 'prop1 description',
        },
        prop2: {
          type: 'number',
          description: 'prop2 description',
          default: 1,
        },
      },
    });
    let defaultValue = schema.getObjectDefaultValue(schema.def);
    expect(defaultValue.value.prop1 instanceof DefaultValue).toBe(true);
    expect(defaultValue.value.prop2 instanceof DefaultValue).toBe(true);
    expect(defaultValue.value.prop1.value).toBe('');
    expect(defaultValue.value.prop2.value).toBe(1);
    expect(defaultValue.value.prop1.description).toBe('prop1 description');
    expect(defaultValue.value.prop2.description).toBe('prop2 description');

    schema.def.oneOf = [
      {
        type: 'object',
        properties: {
          prop3: {
            type: 'boolean',
            description: 'prop3 description',
          },
        },
      },
      { type: 'object', properties: { prop4: { type: 'string' } } },
    ];
    defaultValue = schema.getObjectDefaultValue(schema.def);
    expect(defaultValue.value.prop3 instanceof DefaultValue).toBe(true);
    expect(defaultValue.value.prop3.value).toBe(false);
    expect(defaultValue.value.prop3.description).toBe('prop3 description');
    expect(Object.prototype.hasOwnProperty.call(defaultValue.value, 'prop4')).toBe(false);
  });

  test('#getReferredDefaultValue', () => {
    const schema = new Schema(loader, {
      $id: '/example.json',
      description: 'example schema',
      $ref: '/child1.json',
    });
    const defaultValue = schema.getReferredDefaultValue(schema.def);
    expect(defaultValue.description).toBe('example schema');
    expect(defaultValue.value.prop1 instanceof DefaultValue).toBe(true);
    expect(defaultValue.value.prop2 instanceof DefaultValue).toBe(true);
    expect(defaultValue.value.prop1.value).toBe('prop1');
    expect(defaultValue.value.prop2.value).toBe('');

    schema.def.$ref = '/unknown.json';
    expect(() => {
      return schema.getReferredDefaultValue({});
    }).toThrow();
  });

  describe('#getTypedDefaultValue()', () => {
    test('Primitives types', () => {
      const types = ['null', 'boolean', 'number', 'integer', 'string'];
      const defaultValues = [null, false, 0, 0, ''];
      types.forEach((type, i) => {
        [true, false].forEach((nullable) => {
          const schema = new Schema(loader, {
            $id: '/example.json',
            type: type,
            nullable: nullable,
          });
          let defaultValue = schema.getTypedDefaultValue(schema.def);
          if (nullable) {
            expect(defaultValue.value).toBe(null);
          } else {
            expect(defaultValue.value).toBe(defaultValues[i]);
          }

          // ref schema does not override default value of primitive types
          schema.$ref = '/child1.json';
          defaultValue = schema.getTypedDefaultValue(schema.def);
          if (nullable) {
            expect(defaultValue.value).toBe(null);
          } else {
            expect(defaultValue.value).toBe(defaultValues[i]);
          }
        });
      });

      const schema = new Schema(loader, {
        $id: '/example.json',
        type: 'unknown',
      });
      expect(() => {
        return schema.getTypedDefaultValue(schema.def);
      }).toThrow();
    });

    test('With $ref', () => {
      let schema = new Schema(loader, {
        $id: '/example.json',
        type: 'object',
        description: 'example schema',
        properties: {
          prop2: {
            type: 'string',
            const: 'hello',
          },
          prop3: {
            type: 'string',
            const: 'world',
          },
        },
        $ref: '/child1.json',
      });
      let defaultValue = schema.getTypedDefaultValue(schema.def);
      expect(defaultValue.description).toBe('example schema');
      expect(defaultValue.value.prop1 instanceof DefaultValue).toBe(true);
      expect(defaultValue.value.prop2 instanceof DefaultValue).toBe(true);
      expect(defaultValue.value.prop3 instanceof DefaultValue).toBe(true);
      expect(defaultValue.value.prop1.value).toBe('prop1');
      expect(defaultValue.value.prop2.value).toBe('hello');
      expect(defaultValue.value.prop3.value).toBe('world');

      schema = new Schema(loader, {
        $id: '/example.json',
        type: 'array',
        description: 'example schema',
        items: {
          type: 'number',
          const: 1,
        },
        $ref: '/child2.json',
      });
      defaultValue = schema.getTypedDefaultValue(schema.def);
      expect(defaultValue.description).toBe('example schema');
      expect(Array.isArray(defaultValue.value)).toBe(true);
      expect(defaultValue.value.length).toBe(2);
      expect(defaultValue.value[0] instanceof DefaultValue).toBe(true);
      expect(defaultValue.value[1] instanceof DefaultValue).toBe(true);
      expect(defaultValue.value[0].value).toBe('');
      expect(defaultValue.value[1].value).toBe(1);
    });
  });

  test('#getDefaultValue()', () => {
    const schema = new Schema(loader, {
      $id: '/example.json',
      type: 'null',
    });
    schema.def.const = 'hello world';
    expect(schema.getDefaultValue().value).toBe('hello world');
    delete schema.def.const;
    schema.def.default = 'world hello';
    expect(schema.getDefaultValue(schema.def).value).toBe('world hello');
    delete schema.def.default;
    schema.def.examples = ['hello', 'world'];
    expect(schema.getDefaultValue(schema.def).value).toBe('hello');
    delete schema.def.examples;
    schema.def.type = 'string';
    expect(schema.getDefaultValue(schema.def).value).toBe('');
    delete schema.def.type;
    schema.def.$ref = '/child1.json';
    expect(schema.getDefaultValue(schema.def).value.prop1.value).toBe('prop1');
    delete schema.def.$ref;
    expect(() => {
      return schema.getDefaultValue(schema.def);
    }).toThrow();
  });
});
