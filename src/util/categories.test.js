const { resolveCategoryOptions, resolveCategoryDepth, prepareCategories } = require('./categories');

function source(records, trace = []) {
  return {
    find(query) {
      trace.push(['find', query]);
      const rows = records.filter((cat) =>
        typeof query.parent === 'object'
          ? typeof cat.parent === 'undefined'
          : cat.parent === query.parent,
      );
      return {
        sort(field, order) {
          trace.push(['sort', field, order]);
          return rows.slice().sort((a, b) => {
            let result = 0;
            if (a[field] > b[field]) result = 1;
            else if (a[field] < b[field]) result = -1;
            return result * order;
          });
        },
      };
    },
  };
}

function prepare(records, extra = {}, page, url_for = (path) => path) {
  return prepareCategories(
    source(records),
    { ...resolveCategoryOptions({}), depth: 0, ...extra },
    page,
    url_for,
  );
}

test.each([{}, { order: null, order_by: null, show_current: null, show_count: null }])(
  'Options default only null/undefined (%p)',
  (widget) => {
    expect(resolveCategoryOptions(Object.freeze(widget))).toEqual({
      order: 1,
      orderBy: 'name',
      showCurrent: false,
      showCount: true,
    });
  },
);

test.each([false, 0, ''])('Explicit falsy option %p wins over aliases', (value) => {
  expect(
    resolveCategoryOptions({
      order: value,
      order_by: value,
      orderBy: 'name',
      show_current: value,
      showCurrent: true,
      show_count: value,
      showCount: true,
    }),
  ).toEqual({ order: value, orderBy: value, showCurrent: value, showCount: value });
});

test('Aliases are used only for unset snake-case options', () => {
  expect(
    resolveCategoryOptions({
      order_by: null,
      orderBy: 'length',
      show_current: null,
      showCurrent: true,
      showCount: false,
    }),
  ).toEqual({
    order: 1,
    orderBy: 'length',
    showCurrent: true,
    showCount: false,
  });
});

test.each([
  [undefined, undefined, 0],
  [null, '2', 2],
  [0, 1, 0],
  [false, 1, 0],
  ['', 1, 0],
  ['2levels', 3, 2],
  ['0x10', 3, 0],
  [1.9, 3, 1],
  [-1, 3, -1],
  [NaN, 3, 0],
])('Depth %p / fallback %p preserves parseInt', (depth, fallback, expected) => {
  expect(resolveCategoryDepth(depth, fallback)).toBe(expected);
});

test('Depth parsing does not suppress invalid-value errors', () => {
  expect(() => resolveCategoryDepth(Symbol('depth'), 1)).toThrow(TypeError);
});

test('Query contract, sibling ordering, depth and top-level amount retain complete child trees', () => {
  const records = [
    { _id: 'b', name: 'B', length: 1, path: 'b/' },
    { _id: 'a', name: 'A', length: 3, path: 'a/' },
    { _id: 'one', parent: 'a', name: 'One', length: 1, path: 'a/one/' },
    { _id: 'two', parent: 'a', name: 'Two', length: 2, path: 'a/two/' },
    { _id: 'deep', parent: 'two', name: 'Deep', length: 1, path: 'a/two/deep/' },
    { _id: 'empty', name: 'Empty', length: 0, path: 'empty/' },
    { _id: 'orphan', parent: null, name: 'Null parent', length: 1, path: 'null/' },
  ];
  records.forEach(Object.freeze);
  Object.freeze(records);
  const before = JSON.stringify(records);
  const trace = [];
  const urls = [];
  const result = prepareCategories(
    source(records, trace),
    { order: -1, orderBy: 'length', showCurrent: false, depth: 2, amount: 1 },
    undefined,
    (path) => {
      urls.push(path);
      return `resolved:${path}`;
    },
  );
  expect(result.hasMore).toBe(true);
  expect(result.categories).toHaveLength(1);
  expect(result.categories[0].name).toBe('A');
  expect(result.categories[0].children.map((cat) => [cat.name, cat.children])).toEqual([
    ['Two', []],
    ['One', []],
  ]);
  expect(urls).toEqual(['a/two/', 'a/one/', 'a/', 'b/']);
  expect(trace.filter(([name]) => name === 'find')).toEqual([
    ['find', { parent: { $exists: false } }],
    ['find', { parent: 'a' }],
    ['find', { parent: 'b' }],
  ]);
  expect(trace.filter(([name]) => name === 'sort')).toEqual([
    ['sort', 'length', -1],
    ['sort', 'length', -1],
    ['sort', 'length', -1],
  ]);
  expect(JSON.stringify(records)).toBe(before);
  expect(records[1]).not.toHaveProperty('children');
  expect(result.categories[0]).not.toBe(records[1]);
});

test.each([false, 0, '', null, undefined])('Missing current page/base keeps marker %p', (base) => {
  const rows = [{ _id: 'a', name: 'A', path: 'a/', length: 2, posts: { data: [] } }];
  expect(prepare(rows, { showCurrent: true }, { base }).categories[0].isCurrent).toBe(base);
  expect(prepare(rows, { showCurrent: true }, null).categories[0].isCurrent).toBe(false);
});

test('Current membership scans posts.data up to cat.length, with strict ID equality', () => {
  const record = {
    _id: 'a',
    name: 'A',
    path: 'a/',
    length: 1,
    posts: { data: { 0: { _id: 7 }, 1: { _id: 'outside' } } },
  };
  expect(prepare([record], { showCurrent: true }, { _id: 7 }).categories[0].isCurrent).toBe(true);
  expect(
    prepare([record], { showCurrent: true }, { _id: '7' }).categories[0].isCurrent,
  ).toBeUndefined();
  expect(
    prepare([record], { showCurrent: true }, { _id: 'outside' }).categories[0].isCurrent,
  ).toBeUndefined();
  record.posts.data[0] = {};
  expect(prepare([record], { showCurrent: true }, {}).categories[0].isCurrent).toBe(true);
});

test('Category-page prefix behavior is not replaced with exact/boundary matching', () => {
  const rows = [{ _id: 'a', name: 'A', path: 'cat', length: 1, posts: { data: [] } }];
  expect(prepare(rows, { showCurrent: true }, { base: 'catch-all' }).categories[0].isCurrent).toBe(
    true,
  );
});

test('No posts metadata is needed unless current checks are enabled with a page', () => {
  const rows = [{ _id: 'a', name: 'A', path: 'a/', length: 1 }];
  expect(prepare(rows).categories[0].isCurrent).toBe(false);
  expect(prepare(rows, { showCurrent: true }).categories[0].isCurrent).toBe(false);
  expect(() => prepare(rows, { showCurrent: true }, {})).toThrow(TypeError);
});

test.each([
  [null, 2, false],
  [false, 2, false],
  [0, 2, false],
  [-1, 2, false],
  [2, 2, false],
  [1, 1, true],
  ['1', 1, true],
  [0.5, 0, true],
])('Amount %p only slices roots after preparing every node', (amount, length, hasMore) => {
  const rows = [
    { _id: 'a', name: 'A', path: 'a/', length: 1 },
    { _id: 'b', name: 'B', path: 'b/', length: 1 },
  ];
  const urls = [];
  const result = prepare(rows, { amount }, undefined, (path) => {
    urls.push(path);
    return path;
  });
  expect(result.categories).toHaveLength(length);
  expect(result.hasMore).toBe(hasMore);
  expect(urls).toEqual(['a/', 'b/']);
});

test('URL errors from hidden roots still propagate after earlier postorder helper calls', () => {
  const rows = [
    { _id: 'a', name: 'A', path: 'a/', length: 1 },
    { _id: 'b', name: 'B', path: 'b/', length: 1 },
  ];
  const urls = [];
  const error = new Error('hidden branch');
  expect(() =>
    prepare(rows, { amount: 1 }, undefined, (path) => {
      urls.push(path);
      if (path === 'b/') throw error;
      return path;
    }),
  ).toThrow(error);
  expect(urls).toEqual(['a/', 'b/']);
});
