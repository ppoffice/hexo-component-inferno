const { renderToStaticMarkup } = require('inferno-server');
const Categories = require('./categories');

// The existing collection contract, exercised with plain records rather than a full Hexo boot.
function collection(records, calls = []) {
  return {
    length: records.length,
    find(query) {
      calls.push(['find', query]);
      const rows = records.filter((cat) =>
        typeof query.parent === 'object'
          ? typeof cat.parent === 'undefined'
          : cat.parent === query.parent,
      );
      return {
        sort(field, order) {
          calls.push(['sort', field, order]);
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

const tree = [
  { _id: 'b', name: 'B', path: 'b/', length: 1, posts: { data: [] } },
  { _id: 'a', name: 'A', path: 'a/', length: 2, posts: { data: [{ _id: 'current' }] } },
  { _id: 'child', parent: 'a', name: 'Child', path: 'a/child/', length: 1, posts: { data: [] } },
  {
    _id: 'deep',
    parent: 'child',
    name: 'Deep',
    path: 'a/child/deep/',
    length: 1,
    posts: { data: [] },
  },
  { _id: 'empty', name: 'Empty', path: 'empty/', length: 0 },
  { _id: 'null-parent', parent: null, name: 'Null parent', path: 'null/', length: 1 },
  { _id: 'zero-parent', parent: 0, name: 'Zero parent', path: 'zero/', length: 1 },
];

function adapt(records = tree, widget = {}, extra = {}, calls = []) {
  const cacheable = Categories.Cacheable;
  const element = cacheable({
    site: { categories: collection(records, calls) },
    widget,
    page: {},
    helper: {
      url_for: (url) => {
        calls.push(['url_for', url]);
        return `resolved:${url}`;
      },
      _p: (key, count) => {
        calls.push(['_p', key, count]);
        return 'Categories';
      },
      __: (key) => {
        calls.push(['__', key]);
        return key;
      },
    },
    ...extra,
  });
  return { element, calls };
}

test('Source characterization: prepare every subtree before limiting top-level categories', () => {
  const { element, calls } = adapt(tree, { amount: 1 });
  expect(element.props.categories).toEqual([
    {
      name: 'A',
      count: 2,
      url: 'resolved:a/',
      isCurrent: false,
      children: [
        {
          name: 'Child',
          count: 1,
          url: 'resolved:a/child/',
          isCurrent: false,
          children: [
            {
              name: 'Deep',
              count: 1,
              url: 'resolved:a/child/deep/',
              isCurrent: false,
              children: [],
            },
          ],
        },
      ],
    },
  ]);
  expect(calls.filter(([name]) => name !== 'find' && name !== 'sort')).toEqual([
    ['url_for', 'a/child/deep/'],
    ['url_for', 'a/child/'],
    ['url_for', 'a/'],
    ['url_for', 'b/'],
    ['_p', 'common.category', Infinity],
    ['url_for', 'categories/'],
    ['__', 'widget.more'],
  ]);
  expect(calls[0]).toEqual(['find', { parent: { $exists: false } }]);
  expect(renderToStaticMarkup(element)).toContain('fa-chevron-right');
});

test('Empty categories are filtered and null/zero parents are not treated as absent', () => {
  const { element } = adapt();
  expect(element.props.categories.map((cat) => cat.name)).toEqual(['A', 'B']);
});

test.each([null, false, 0, []])('Source override %p is not ignored', (categories) => {
  const { element, calls } = adapt(tree, { categories }, { site: undefined });
  expect(element).toBe(null);
  expect(calls).toEqual([]);
});

test('A custom source works without site; undefined falls back to site.categories', () => {
  const custom = collection([{ _id: 'only', name: 'Custom', path: 'custom/', length: 1 }]);
  expect(
    adapt(tree, { categories: custom }, { site: undefined }).element.props.categories[0].name,
  ).toBe('Custom');
  expect(adapt(tree, { categories: undefined }).element.props.categories[0].name).toBe('A');
});

test.each([
  [{}, ['name', 1], false, true],
  [
    {
      order: null,
      order_by: null,
      orderBy: 'length',
      show_current: null,
      showCurrent: true,
      show_count: null,
      showCount: false,
    },
    ['length', 1],
    true,
    false,
  ],
  [
    {
      order: 0,
      order_by: false,
      orderBy: 'length',
      show_current: 0,
      showCurrent: true,
      show_count: 0,
      showCount: true,
    },
    [false, 0],
    0,
    0,
  ],
])('Aliases and first-set options preserve %p', (widget, sorting, showCurrent, showCount) => {
  const { element, calls } = adapt(tree, { ...widget, depth: 1 }, { page: { _id: 'current' } });
  expect(calls[1]).toEqual(['sort', ...sorting]);
  expect(element.props.showCount).toBe(showCount);
  const a = element.props.categories.find((cat) => cat.name === 'A');
  expect(a.isCurrent).toBe(!!showCurrent);
});

test.each([
  [undefined, undefined, 3],
  [null, '2', 2],
  [0, 1, 3],
  [false, 1, 3],
  ['', 1, 3],
  ['2levels', 0, 2],
  ['0x10', 1, 3],
  [-1, 3, 1],
  [1.9, 3, 1],
])('Depth %p with fallback %p keeps parseInt/zero semantics', (depth, fallback, levels) => {
  const { element } = adapt(tree, { depth }, { depth: fallback });
  let node = element.props.categories[0];
  let found = 1;
  while (node.children.length) {
    node = node.children[0];
    found++;
  }
  expect(found).toBe(levels);
});

test.each([undefined, null, '', false, 0])('Unmatched page.base stays %p', (base) => {
  const { element } = adapt(tree, { show_current: true }, { page: { _id: 'other', base } });
  expect(element.props.categories[0].isCurrent).toBe(base);
});

test('Article membership uses posts.data indices and category-page matching remains a raw prefix', () => {
  const article = adapt(tree, { show_current: true }, { page: { _id: 'current' } });
  expect(article.element.props.categories[0].isCurrent).toBe(true);
  const records = [{ _id: 'prefix', name: 'Prefix', path: 'cat', length: 1, posts: { data: [] } }];
  const category = adapt(records, { showCurrent: true }, { page: { base: 'catch-all' } });
  expect(category.element.props.categories[0].isCurrent).toBe(true);
});

test('An error in a later current check retains earlier URL helper calls, even on hidden roots', () => {
  const records = [
    { _id: 'a', name: 'A', path: 'a/', length: 1 },
    { _id: 'child', parent: 'a', name: 'Child', path: 'a/child/', length: 1, posts: { data: [] } },
  ];
  const calls = [];
  expect(() =>
    adapt(records, { show_current: true, amount: 0.5 }, { page: { _id: 'other' } }, calls),
  ).toThrow(TypeError);
  expect(calls.filter(([name]) => name === 'url_for')).toEqual([['url_for', 'a/child/']]);
});

test('Empty source returns null before parsing depth; all-filtered source still renders the widget', () => {
  expect(adapt([], { depth: Symbol('invalid depth') }).element).toBe(null);
  const { element, calls } = adapt([{ _id: 'empty', name: 'Empty', length: 0 }]);
  expect(element.props.categories).toEqual([]);
  expect(calls.slice(-2)).toEqual([
    ['_p', 'common.category', Infinity],
    ['__', 'widget.more'],
  ]);
});
