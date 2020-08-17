const path = require('path');
const Hexo = require('hexo');
const register = require('./thumbnail');

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
    { source: 'bio/index.md', path: 'bio/', updated: 1e8 - 3, thumbnail: '/thumbnail.png' },
    { source: 'about/index.md', path: 'about/', updated: 1e8 - 4 },
  ]);
  pages.concat(
    await Post.insert([
      { source: 'bar', slug: 'bar', updated: 1e8 + 1, thumbnail: '/thumbnail.png' },
      { source: 'baz', slug: 'baz', updated: 1e8 - 1 },
    ]),
  );
});

test('Correctly check if a page/post has a thumbnail image to display', () => {
  hexo.config.article = { thumbnail: true };
  const hasThumbnail = hexo.extend.helper.get('has_thumbnail').bind(hexo);
  const expected = [true, false, true, false];
  pages.forEach((page, i) => expect(hasThumbnail(page)).toBe(expected[i]));
  hexo.config.article = { thumbnail: false };
  pages.forEach((page, i) => expect(hasThumbnail(page)).toBe(false));
  expect(hasThumbnail({})).toBe(false);
  expect(hasThumbnail(1)).toBe(false);
});

test('Get the thumbnail image of a page/post if it has one and can be displayed', () => {
  hexo.config.article = { thumbnail: true };
  const getThumbnail = hexo.extend.helper.get('get_thumbnail').bind(hexo);
  const expected = ['/thumbnail.png', '/img/thumbnail.svg', '/thumbnail.png', '/img/thumbnail.svg'];
  pages.forEach((page, i) => expect(getThumbnail(page)).toBe(expected[i]));
  hexo.config.article = { thumbnail: false };
  pages.forEach((page, i) => expect(getThumbnail(page)).toBe('/img/thumbnail.svg'));
});
