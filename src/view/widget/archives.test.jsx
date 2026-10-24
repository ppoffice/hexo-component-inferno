const { renderToStaticMarkup } = require('inferno-server');
// Use Hexo's date implementation without starting Hexo or reading a site.
// eslint-disable-next-line node/no-extraneous-require
const moment = require(require.resolve('moment-timezone', { paths: [require.resolve('hexo')] }));
const Archives = require('./archives');

function adapt(posts, widget = {}, extra = {}) {
  const calls = [];
  const sort = jest.fn((field, order) => {
    calls.push(['sort', field, order]);
    return posts;
  });
  const helper = {
    url_for: (url) => {
      calls.push(['url_for', url]);
      return `resolved:${url}`;
    },
    _p: (key, count) => {
      calls.push(['_p', key, count]);
      return 'Archives';
    },
    __: (key) => {
      calls.push(['__', key]);
      return key;
    },
  };
  const cacheable = Archives.Cacheable;
  const element = cacheable({
    site: { posts: { sort } },
    helper,
    config: { archive_dir: 'archives', language: 'en', timezone: 'UTC' },
    page: {},
    widget,
    ...extra,
  });
  return { element, calls, sort };
}

const post = (date) => ({ date: moment.utc(date).locale('en') });

test('Source characterization: consecutive formatted names can merge different years', () => {
  const { element, calls } = adapt([post('2024-01-15'), post('2023-01-15'), post('2022-02-15')], {
    format: 'MMMM',
    amount: 1,
  });
  expect(element.props).toEqual({
    items: [{ name: 'January', count: 2, url: 'resolved:archives/2024/01/' }],
    title: 'Archives',
    showCount: true,
    moreUrl: 'resolved:archives/',
    moreTitle: 'More',
  });
  expect(calls).toEqual([
    ['sort', 'date', -1],
    ['url_for', 'archives/2024/01/'],
    ['_p', 'common.archive', Infinity],
    ['url_for', 'archives/'],
    ['__', 'widget.more'],
  ]);
  expect(renderToStaticMarkup(element)).toContain('<span class="level-item tag">2</span>');
});

test('Source characterization: formatting groups are consecutive rather than global buckets', () => {
  const { element } = adapt([post('2024-01-15'), post('2023-02-15'), post('2023-01-15')], {
    format: 'MMMM',
  });
  expect(element.props.items.map((item) => [item.name, item.count])).toEqual([
    ['January', 1],
    ['February', 1],
    ['January', 1],
  ]);
  expect(element.props.moreUrl).toBe(null);
});

test.each([null, undefined, false, 0, 1, -1])('Raw order %p reaches Hexo sort', (order) => {
  const { sort } = adapt([post('2024-01-01')], { order });
  expect(sort).toHaveBeenCalledWith('date', order == null ? -1 : order);
});

test.each([
  [{}, true],
  [{ show_count: null, showCount: false }, false],
  [{ show_count: false, showCount: true }, false],
  [{ show_count: 0, showCount: true }, 0],
  [{ show_count: null, showCount: null }, true],
])('Count option aliases preserve first-set semantics (%p)', (widget, expected) => {
  expect(adapt([post('2024-01-01')], widget).element.props.showCount).toBe(expected);
});

test.each([false, 0, 'yearly'])('Non-monthly group_by %p keeps yearly links', (group_by) => {
  const { element } = adapt([post('2024-01-01')], { group_by, format: 'MMMM' });
  expect(element.props.items[0]).toEqual({
    name: 'January',
    count: 1,
    url: 'resolved:archives/2024/',
  });
});

test.each([null, undefined, false, 0, -1, 2, 3])('Amount %p keeps two groups', (amount) => {
  const { element } = adapt([post('2024-02-01'), post('2024-01-01')], { amount });
  expect(element.props.items).toHaveLength(2);
  expect(element.props.moreUrl).toBe(null);
});

test.each([0.5, '0.5'])('Positive fractional amount %p can leave only the More link', (amount) => {
  const { element } = adapt([post('2024-02-01'), post('2024-01-01')], { amount });
  expect(element.props.items).toEqual([]);
  expect(element.props.moreUrl).toBe('resolved:archives/');
});

test('Timezone/locale conversion uses clones and leaves the source date unchanged', () => {
  const source = moment.utc('2023-12-31T23:30:00Z').locale('en');
  const before = [source.valueOf(), source.utcOffset(), source.locale(), source.format()];
  const { element } = adapt(
    [{ date: source }],
    {},
    {
      config: { archive_dir: 'history', timezone: 'Asia/Shanghai', language: 'en' },
      page: { lang: '', language: 'zh_CN' },
    },
  );
  expect(element.props.items).toEqual([
    { name: '一月 2024', count: 1, url: 'resolved:history/2024/01/' },
  ]);
  expect([source.valueOf(), source.utcOffset(), source.locale(), source.format()]).toEqual(before);
});

test('No posts returns null after sort, without reading locale or calling helpers', () => {
  const { element, calls } = adapt([], { order: 0 }, { page: { lang: {} } });
  expect(element).toBe(null);
  expect(calls).toEqual([['sort', 'date', 0]]);
});
