const path = require('path');
const Hexo = require('hexo');
const register = require('./category');

const rootDir = path.join(__dirname, '../../../fixture/site');
const hexo = new Hexo(rootDir, { silent: true });
const Post = hexo.model('Post');

let posts = [];

beforeAll(async () => {
  await hexo.init();
  posts = await Post.insert([
    { title: 'foo', source: 'foo', slug: 'foo', date: 1e8 },
    { title: 'bar', source: 'bar', slug: 'bar', date: 1e8 + 1 },
    { title: 'baz', source: 'baz', slug: 'baz', date: 1e8 - 1 },
    { title: 'boo', source: 'boo', slug: 'boo', date: 1e8 + 2 },
  ]);
  await posts[0].setCategories(['foo']);
  await posts[1].setCategories(['foo', 'bar']);
  await posts[2].setCategories(['foo', 'bar', 'baz']);
  await posts[3].setCategories(['baz', 'bar', 'foo']);
  await hexo.load();
  register(hexo);
});

test('Add /category/* routes and add parents array to the locals', async () => {
  const locals = hexo.locals.toObject();
  const generator = hexo.extend.generator.get('category').bind(hexo);
  const result = await generator(locals);
  expect(result.length).toBe(6);
  for (const route of result) {
    expect(route.layout).toStrictEqual(['category', 'archive', 'index']);
  }

  expect(result[0].path).toBe('categories/foo/');
  expect(result[0].data.category).toBe('foo');
  expect(result[0].data.posts.length).toBe(3);
  expect(result[0].data.parents.length).toBe(0);

  expect(result[1].path).toBe('categories/foo/bar/');
  expect(result[1].data.category).toBe('bar');
  expect(result[1].data.posts.length).toBe(2);
  expect(result[1].data.parents.length).toBe(1);
  expect(result[1].data.parents[0].name).toBe('foo');
  expect(result[1].data.parents[0].path).toBe('categories/foo/');

  expect(result[2].path).toBe('categories/foo/bar/baz/');
  expect(result[2].data.category).toBe('baz');
  expect(result[2].data.posts.length).toBe(1);
  expect(result[2].data.parents.length).toBe(2);
  expect(result[2].data.parents[0].name).toBe('foo');
  expect(result[2].data.parents[0].path).toBe('categories/foo/');
  expect(result[2].data.parents[1].name).toBe('bar');
  expect(result[2].data.parents[1].path).toBe('categories/foo/bar/');

  expect(result[3].path).toBe('categories/baz/');
  expect(result[3].data.category).toBe('baz');
  expect(result[3].data.posts.length).toBe(1);
  expect(result[3].data.parents.length).toBe(0);

  expect(result[4].path).toBe('categories/baz/bar/');
  expect(result[4].data.category).toBe('bar');
  expect(result[4].data.posts.length).toBe(1);
  expect(result[4].data.parents.length).toBe(1);
  expect(result[4].data.parents[0].name).toBe('baz');
  expect(result[4].data.parents[0].path).toBe('categories/baz/');

  expect(result[5].path).toBe('categories/baz/bar/foo/');
  expect(result[5].data.category).toBe('foo');
  expect(result[5].data.posts.length).toBe(1);
  expect(result[5].data.parents.length).toBe(2);
  expect(result[5].data.parents[0].name).toBe('baz');
  expect(result[5].data.parents[0].path).toBe('categories/baz/');
  expect(result[5].data.parents[1].name).toBe('bar');
  expect(result[5].data.parents[1].path).toBe('categories/baz/bar/');
});
