// Exercise Hexo's existing timezone dependency without importing or initializing Hexo itself.
// eslint-disable-next-line node/no-extraneous-require
const moment = require(require.resolve('moment-timezone', { paths: [require.resolve('hexo')] }));
const { resolveArchiveOptions, groupArchives } = require('./archives');

function group(dates, widget = {}, context = {}) {
  const { groupBy, format, amount } = resolveArchiveOptions(widget);
  return groupArchives(
    dates.map((date) => ({ date })),
    { groupBy, format, amount, ...context },
  );
}

const date = (value) => moment.utc(value).locale('en');

test.each([{}, { group_by: null, order: null, show_count: null, showCount: null }])(
  'Resolve defaults and null options without mutating %p',
  (widget) => {
    expect(resolveArchiveOptions(Object.freeze(widget))).toEqual({
      groupBy: 'monthly',
      order: -1,
      showCount: true,
      format: undefined,
      amount: undefined,
    });
  },
);

test.each([false, 0, ''])('Resolve explicit falsy options (%p) without coercing them', (value) => {
  expect(
    resolveArchiveOptions({
      group_by: value,
      order: value,
      show_count: value,
      showCount: true,
      format: value,
      amount: value,
    }),
  ).toEqual({
    groupBy: value,
    order: value,
    showCount: value,
    format: value,
    amount: value,
  });
});

test('Snake-case count wins unless unset; camel-case false and zero remain valid', () => {
  expect(resolveArchiveOptions({ show_count: null, showCount: false }).showCount).toBe(false);
  expect(resolveArchiveOptions({ showCount: 0 }).showCount).toBe(0);
  expect(resolveArchiveOptions({ show_count: true, showCount: false }).showCount).toBe(true);
});

test('Monthly groups count consecutive dates and preserve the given order without sorting', () => {
  const dates = [date('2024-02-20'), date('2024-02-01'), date('2023-12-01')];
  expect(group(dates)).toEqual({
    groups: [
      { name: 'February 2024', year: 2024, month: 2, count: 2 },
      { name: 'December 2023', year: 2023, month: 12, count: 1 },
    ],
    hasMore: false,
  });
  expect(group(dates.slice().reverse()).groups.map((item) => item.name)).toEqual([
    'December 2023',
    'February 2024',
  ]);
});

test('Yearly groups retain the first month and date position in their input', () => {
  const result = group([date('2023-02-01'), date('2023-12-01'), date('2024-01-01')], {
    group_by: 'yearly',
  });
  expect(result.groups).toEqual([
    { name: '2023', year: 2023, month: 2, count: 2 },
    { name: '2024', year: 2024, month: 1, count: 1 },
  ]);
});

test('Custom labels merge across years only while consecutive, preserving the first date', () => {
  const result = group(
    [date('2024-01-01'), date('2023-01-01'), date('2023-02-01'), date('2022-01-01')],
    { format: 'MMMM' },
  );
  expect(result.groups).toEqual([
    { name: 'January', year: 2024, month: 1, count: 2 },
    { name: 'February', year: 2023, month: 2, count: 1 },
    { name: 'January', year: 2022, month: 1, count: 1 },
  ]);
});

test.each([false, 0, ''])('Falsy format %p keeps the grouping default format', (format) => {
  expect(group([date('2024-01-01')], { format }).groups[0].name).toBe('January 2024');
  expect(group([date('2024-01-01')], { format, group_by: false }).groups[0].name).toBe('2024');
});

test.each([
  ['2023-12-31T23:30:00Z', 'Asia/Shanghai', 2024, 1],
  ['2024-03-01T01:00:00Z', 'America/Los_Angeles', 2024, 2],
])('Convert %s to %s before extracting year/month', (input, timezone, year, month) => {
  const source = date(input);
  const before = [source.valueOf(), source.format(), source.locale(), source.utcOffset()];
  expect(group([source], {}, { timezone }).groups[0]).toMatchObject({ year, month });
  expect([source.valueOf(), source.format(), source.locale(), source.utcOffset()]).toEqual(before);
});

test.each([null, false, 0, '', 'default', 'en'])('Language %p selects English', (language) => {
  expect(group([date('2024-01-01').locale('fr')], {}, { language }).groups[0].name).toBe(
    'January 2024',
  );
});

test('Undefined language retains the date locale; Hexo language codes normalize for Moment', () => {
  expect(group([date('2024-01-01').locale('fr')]).groups[0].name).toBe('janvier 2024');
  expect(group([date('2024-01-01')], {}, { language: 'zh_CN' }).groups[0].name).toBe('一月 2024');
  expect(group([date('2024-01-01')], {}, { language: 'pt_BR' }).groups[0].name).toBe(
    'janeiro 2024',
  );
});

test.each([
  [undefined, 3, false],
  [null, 3, false],
  [false, 3, false],
  [0, 3, false],
  [-1, 3, false],
  [3, 3, false],
  [4, 3, false],
  [Infinity, 3, false],
  [NaN, 3, false],
  [1, 1, true],
  ['1', 1, true],
  [true, 1, true],
  [0.5, 0, true],
  ['0.5', 0, true],
])('Amount %p retains slice/comparison coercion', (amount, length, hasMore) => {
  const result = group([date('2024-03-01'), date('2024-02-01'), date('2024-01-01')], { amount });
  expect(result.groups).toHaveLength(length);
  expect(result.hasMore).toBe(hasMore);
});

test('Only a forEach date-record source is needed, and every source date is cloned once', () => {
  const source = date('2024-01-01');
  const clone = jest.spyOn(source, 'clone');
  const posts = { forEach: (visit) => visit(Object.freeze({ date: source })) };
  const options = { ...resolveArchiveOptions({}), timezone: 'UTC', language: 'en' };
  expect(groupArchives(posts, options).groups[0].count).toBe(1);
  expect(clone).toHaveBeenCalledTimes(1);
  const result = group([], {});
  expect(result).toEqual({ groups: [], hasMore: false });
});

test('Invalid Moment dates preserve their formatted label and NaN link date parts', () => {
  const result = group([moment.invalid(), moment.invalid()]);
  expect(result.groups).toHaveLength(1);
  expect(result.groups[0]).toMatchObject({ name: 'Invalid date', count: 2 });
  expect(result.groups[0].year).toBeNaN();
  expect(result.groups[0].month).toBeNaN();
});
