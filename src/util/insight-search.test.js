const createInsightSearch = require('./insight-search');

const search = createInsightSearch();
const empty = { posts: [], pages: [], categories: [], tags: [] };

test('Parse literal spaces once per query and reuse lowercase keywords for every section', () => {
  const query = { split: jest.fn(() => ['ONE', '', 'Two', 'ONE']) };
  const post = { title: 'one', text: 'two' };
  const term = { name: 'one', slug: 'two' };
  const result = search({ posts: [post], pages: [post], categories: [term], tags: [term] }, query);
  expect(query.split).toHaveBeenCalledTimes(1);
  expect(query.split).toHaveBeenCalledWith(' ');
  expect(result).toEqual({
    keywords: ['one', 'two', 'one'],
    results: { posts: [post], pages: [post], categories: [term], tags: [term] },
  });
});

test.each(['', '   '])('Empty queries (%p) retain five items per section', (query) => {
  // Empty queries do not inspect fields, including fields that a nonempty query would reject.
  const items = [{}, { title: null }, { name: 123 }, { text: '' }, { slug: '' }, { title: 'six' }];
  const result = search({ posts: items, pages: items, categories: items, tags: items }, query);
  expect(result.keywords).toEqual([]);
  expect(Object.keys(result.results)).toEqual(['posts', 'pages', 'categories', 'tags']);
  Object.values(result.results).forEach((section) => expect(section).toEqual(items.slice(0, 5)));
});

test.each(['one\ttwo', 'one\ntwo'])('Tabs and newlines remain part of a keyword (%p)', (query) => {
  const match = { title: query.toUpperCase() };
  expect(search({ ...empty, posts: [{ title: 'one two' }, match] }, `  ${query}  `)).toEqual({
    keywords: [query],
    results: { ...empty, posts: [match] },
  });
});

test.each([
  ['posts', 'title', 'text'],
  ['pages', 'title', 'text'],
  ['categories', 'name', 'slug'],
  ['tags', 'name', 'slug'],
])('%s matches own fields, including absent and empty fields', (type, a, b) => {
  const match = { [a]: 'HELLO', [b]: 'World' };
  const inherited = Object.create({ [a]: 'hello', [b]: 'world' });
  const ignored = { other: 'hello world' };
  const items = [{}, { [a]: '' }, { [a]: 'hello' }, inherited, ignored, match];
  expect(search({ ...empty, [type]: items }, 'HELLO world').results[type]).toEqual([match]);
  expect(search({ ...empty, [type]: items }, 'hello').results[type]).toEqual([
    { [a]: 'hello' },
    match,
  ]);
});

test.each(['posts', 'pages'])('%s retains 3:1 weights and duplicate keywords', (type) => {
  const betaTitle = { title: 'beta', text: 'alpha' };
  const alphaTitle = { title: 'alpha', text: 'beta' };
  const items = [betaTitle, alphaTitle];
  expect(search({ ...empty, [type]: items }, 'alpha beta').results[type]).toEqual(items);
  expect(search({ ...empty, [type]: items }, 'alpha alpha beta').results[type]).toEqual([
    alphaTitle,
    betaTitle,
  ]);
  const textOnly = { text: 'alpha alpha alpha alpha' };
  expect(search({ ...empty, [type]: [alphaTitle, textOnly] }, 'alpha').results[type]).toEqual([
    textOnly,
    alphaTitle,
  ]);
});

test.each(['categories', 'tags'])('%s gives name and slug equal weight', (type) => {
  const name = { name: 'word' };
  const slug = { slug: 'word' };
  const both = { name: 'word', slug: 'word' };
  expect(search({ ...empty, [type]: [slug, name, both] }, 'word').results[type]).toEqual([
    both,
    slug,
    name,
  ]);
});

test('Count non-overlapping literal matches rather than regex or overlapping matches', () => {
  const title = { title: 'aaa' };
  const text = { text: 'aa aa aa aa' };
  expect(search({ ...empty, posts: [title, text] }, 'aa').results.posts).toEqual([text, title]);
  const cpp = { title: 'C++', text: 'c++ c++' };
  expect(search({ ...empty, posts: [{ title: 'Ccc' }, cpp] }, 'c++').results.posts).toEqual([cpp]);
  const regex = { title: '.*+?^${}()|[]\\' };
  expect(
    search({ ...empty, posts: [regex, { title: 'anything' }] }, regex.title).results.posts,
  ).toEqual([regex]);
});

test('Preserve Unicode lowercase matching, without normalizing or substituting regex matching', () => {
  const item = { title: 'İİİ HELLO' };
  expect(search({ ...empty, posts: [item] }, 'i\u0307').results.posts).toEqual([item]);
  expect(search({ ...empty, posts: [item] }, 'hello').results.posts).toEqual([item]);
  expect(search({ ...empty, posts: [{ title: 'café' }] }, 'cafe\u0301').results.posts).toEqual([]);
});

test('Sort before the five-item limit, keep ties stable, and never mutate the index or items', () => {
  const posts = Array.from({ length: 7 }, (_, id) => Object.freeze({ id, title: 'word' }));
  const best = Object.freeze({ title: 'word word' });
  posts.push(best);
  Object.freeze(posts);
  const json = Object.freeze({ ...empty, posts });
  const result = search(json, 'word');
  expect(result.results.posts).toEqual([best, ...posts.slice(0, 4)]);
  expect(result.results.posts[0]).toBe(best);
  expect(result.results.posts[1]).toBe(posts[0]);
  expect(posts[7]).toBe(best);
  expect(search(empty, 'word').results).toEqual(empty);
  expect(search(json, 'word')).toEqual(result);
});

test.each([null, undefined, 0, false])('Own non-string fields (%p) still throw', (value) => {
  // A matching title must not short-circuit checking an invalid text field.
  expect(() => search({ ...empty, posts: [{ title: 'word', text: value }] }, 'word')).toThrow(
    TypeError,
  );
});

test('Preserve errors for missing index arrays and invalid queries', () => {
  expect(() => search({}, '')).toThrow(TypeError);
  expect(() => search({ ...empty, posts: [{}] }, null)).toThrow(TypeError);
});

test('The compiled factory serializes without DOM, require, or external Babel helpers', () => {
  // eslint-disable-next-line no-new-func
  const serializedSearch = new Function(`return (${createInsightSearch.toString()})();`)();
  const index = { ...empty, posts: [{ title: 'word' }] };
  expect(serializedSearch(index, 'WORD')).toEqual(search(index, 'WORD'));
});
