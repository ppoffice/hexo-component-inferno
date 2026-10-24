const DefaultValue = require('./default_value');
const { MAGIC, stringify } = require('./commented_yaml');

test('Default values and comment serialization do not load AJV or the schema loader', () => {
  jest.isolateModules(() => {
    jest.doMock('ajv', () => { throw new Error('DefaultValue must not load AJV'); });
    const Value = require('./default_value');
    const value = new Value({ enabled: new Value(true, 'Enabled: yes') });
    expect(value.toYaml()).toBe('# Enabled: yes\nenabled: true\n');
    jest.dontMock('ajv');
  });
});

test('Keep merge identity, nested descriptions, shallow cloning and exact commented YAML', () => {
  const child = new DefaultValue('x', 'Child: "x"\nUse it');
  const value = new DefaultValue(new DefaultValue({ list: new DefaultValue([child], 'Items') }, 'Inner'), 'Outer');
  const source = new DefaultValue({ count: new DefaultValue(2, "Don't quote") });
  value.merge(source);
  expect(value.description).toBe('Inner');
  expect(value.value.count).toBe(source.value.count);
  const clone = value.clone();
  expect(clone.value).not.toBe(value.value);
  expect(clone.value.list).toBe(value.value.list);
  const commented = {
    [MAGIC + 'list0']: 'Items',
    list: [MAGIC + '0: Child: "x"', MAGIC + '1: Use it', 'x'],
    [MAGIC + 'count0']: "Don't quote",
    count: 2,
  };
  expect(value.toCommented()).toEqual(commented);
  const expected = '# Items\nlist:\n    # Child: "x"\n    # Use it\n    - x\n# Don\'t quote\ncount: 2\n';
  expect(value.toYaml()).toBe(expected);
  expect(stringify(commented)).toBe(expected);
});
