const path = require('path');
const Hexo = require('hexo');
const register = require('./page');

const rootDir = path.join(__dirname, '../../../fixture/site');
const hexo = new Hexo(rootDir, { silent: true });
const Page = hexo.model('Page');
const Post = hexo.model('Post');

let pages = [];

beforeAll(async () => {
  await hexo.init();
  await hexo.load();
  register(hexo);
  pages = await Page.insert([
    { source: 'bio/index.md', path: 'bio/', updated: 1e8 - 3, __categories: true },
    { source: 'about/index.md', path: 'about/', updated: 1e8 - 4, __tags: true },
    { source: 'faq/index.md', path: 'faq/', updated: 1e8 - 5 },
  ]);
  pages.concat(
    await Post.insert([
      { source: 'foo', slug: 'foo', updated: 1e8, __tags: true },
      { source: 'bar', slug: 'bar', updated: 1e8 + 1, __categories: true },
      { source: 'baz', slug: 'baz', updated: 1e8 - 1 },
    ]),
  );
});

beforeEach(() => {
  hexo.page = null;
});

test('Correctly check if page is /categories page', () => {
  const isCategories = hexo.extend.helper.get('is_categories').bind(hexo);
  const expected = [true, false, false, false, true, false];
  pages.forEach((page, i) => expect(isCategories(page)).toBe(expected[i]));
  hexo.page = pages[0];
  expect(isCategories()).toBe(expected[0]);
});

test('Correctly check if page is /tags page', () => {
  const isTags = hexo.extend.helper.get('is_tags').bind(hexo);
  const expected = [false, true, false, true, false, false];
  pages.forEach((page, i) => expect(isTags(page)).toBe(expected[i]));
  hexo.page = pages[0];
  expect(isTags()).toBe(expected[0]);
});
