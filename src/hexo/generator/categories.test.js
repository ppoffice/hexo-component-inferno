const path = require('path');
const Hexo = require('hexo');
const register = require('./categories');

const rootDir = path.join(__dirname, '../../../fixture/site');
const hexo = new Hexo(rootDir, { silent: true });
const Page = hexo.model('Page');
const Post = hexo.model('Post');

let pages = [];

beforeAll(async () => {
  await hexo.init();
  pages = await Page.insert([
    { source: 'bio/index.md', path: 'bio/', updated: 1e8 - 3 },
    { source: 'about/index.md', path: 'about/', updated: 1e8 - 4 },
  ]);
  pages.concat(
    await Post.insert([
      { source: 'bar', slug: 'bar', updated: 1e8 + 1 },
      { source: 'baz', slug: 'baz', updated: 1e8 - 1 },
    ]),
  );
  await hexo.load();
  register(hexo);
});

test('Add /categories route and add a flag (__categories) to the locals', async () => {
  const locals = hexo.locals.toObject();
  const generator = hexo.extend.generator.get('categories').bind(hexo);
  const result = await generator(locals);
  expect(result.path).toBe('categories/');
  expect(result.layout).toEqual(['categories']);
  expect(result.data.__categories).toBe(true);
});
