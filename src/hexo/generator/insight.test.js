const { join } = require('path');
const Hexo = require('hexo');
const register = require('./insight');

const rootDir = join(__dirname, '../../../fixture/site');
const hexo = new Hexo(rootDir, { silent: true });
const Page = hexo.model('Page');
const Post = hexo.model('Post');
const Category = hexo.model('Category');
const Tag = hexo.model('Tag');

let posts, pages, categories, tags;

beforeAll(async () => {
  await hexo.init();
  posts = await Post.insert([
    { title: 'post1', source: 'bar', slug: 'bar', updated: 1e8 + 1 },
    { title: 'post2 <input>', source: 'baz', slug: 'baz', updated: 1e8 - 1 },
  ]);
  pages = await Page.insert([
    { title: 'page1', source: 'bio/index.md', path: 'bio/', updated: 1e8 - 3 },
    { title: 'page2', source: 'about/index.md', path: 'about/', updated: 1e8 - 4 },
  ]);
  categories = await Category.insert([{ name: 'cat_parent', parent: null }]);
  categories = categories.concat(
    await Category.insert([{ name: 'cat_child', parent: categories[0]._id }]),
  );
  tags = await Tag.insert([{ name: 'tag1' }, { name: 'tag2' }]);
  await hexo.load();
  register(hexo);
});

test('Export assets file from asset folder', async () => {
  const locals = hexo.locals.toObject();
  locals.config = hexo.config;
  locals.posts = posts;
  locals.pages = pages;
  locals.categories = categories;
  locals.tags = tags;
  const generator = hexo.extend.generator.get('insight').bind(hexo);
  const result = await generator(locals);
  expect(result.path).toBe('/content.json');
  expect(result.data).not.toBeUndefined();
  const data = JSON.parse(result.data);
  expect(data.posts.length).toBe(2);
  expect(
    data.posts.find(
      (post) =>
        post.title === 'post1' &&
        post.link.includes('bar') &&
        Object.prototype.hasOwnProperty.call(post, 'text'),
    ),
  ).not.toBeUndefined();
  expect(
    data.posts.find(
      (post) =>
        post.title === 'post2 &lt;input&gt;' &&
        post.link.includes('baz') &&
        Object.prototype.hasOwnProperty.call(post, 'text'),
    ),
  ).not.toBeUndefined();
  expect(data.pages.length).toBe(2);
  expect(
    data.pages.find(
      (page) =>
        page.title === 'page1' &&
        page.link.includes('bio') &&
        Object.prototype.hasOwnProperty.call(page, 'text'),
    ),
  ).not.toBeUndefined();
  expect(
    data.pages.find(
      (page) =>
        page.title === 'page2' &&
        page.link.includes('about') &&
        Object.prototype.hasOwnProperty.call(page, 'text'),
    ),
  ).not.toBeUndefined();
  expect(data.categories.length).toBe(2);
  expect(
    data.categories.find(
      (category) =>
        category.name === 'cat_parent' &&
        category.slug === 'cat-parent' &&
        category.link.includes('cat-parent'),
    ),
  ).not.toBeUndefined();
  expect(
    data.categories.find(
      (category) =>
        category.name === 'cat_child' &&
        category.slug === 'cat-parent/cat-child' &&
        category.link.includes('cat-parent/cat-child'),
    ),
  ).not.toBeUndefined();
  expect(data.tags.length).toBe(2);
  expect(
    data.tags.find(
      (tag) => tag.name === 'tag1' && tag.slug === 'tag1' && tag.link.includes('tag1'),
    ),
  ).not.toBeUndefined();
  expect(
    data.tags.find(
      (tag) => tag.name === 'tag2' && tag.slug === 'tag2' && tag.link.includes('tag2'),
    ),
  ).not.toBeUndefined();
});

test('Exclude pages from index when `index_pages` is false', async () => {
  const locals = hexo.locals.toObject();
  locals.config = hexo.config;
  locals.posts = posts;
  locals.pages = pages;
  locals.categories = categories;
  locals.tags = tags;
  hexo.theme.config.search = { index_pages: false };
  const generator = hexo.extend.generator.get('insight').bind(hexo);
  const result = await generator(locals);
  const data = JSON.parse(result.data);

  expect(data.posts.length).toBe(2);
  expect(data.pages.length).toBe(0);
});
