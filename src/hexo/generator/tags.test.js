const path = require('path');
const Hexo = require('hexo');
const register = require('./tags');

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

test('Add /tags route and add a flag (__tags) to the locals', async () => {
  const locals = hexo.locals.toObject();
  const generator = hexo.extend.generator.get('tags').bind(hexo);
  const result = await generator(locals);
  expect(result.path).toBe('tags/');
  expect(result.layout).toEqual(['tags']);
  expect(result.data.__tags).toBe(true);
});
