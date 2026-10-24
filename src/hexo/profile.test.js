const path = require('path');
const Hexo = require('hexo');
const { url_for } = require('hexo-util');
const { createElement } = require('inferno-create-element');
const { renderToStaticMarkup } = require('inferno-server');
const Profile = require('../view/widget/profile');
const { SchemaLoader } = require('../core/schema');

test('Profile adapts real Hexo collections and url_for without a theme or filesystem load', async () => {
  // The constructor registers Warehouse models; no init/load, plugins, fixture or file writes needed.
  const hexo = new Hexo(path.join(__dirname, '../..'), { silent: true });
  hexo.config.url = 'https://example.com/blog';
  hexo.config.root = '/blog/';
  hexo.config.relative_link = false;
  const posts = await hexo
    .model('Post')
    .insert([1, 2, 3].map((id) => ({ source: `profile-${id}.md`, slug: `profile-${id}` })));
  await posts[0].setCategories(['Used category']);
  await posts[1].setCategories(['Used category']);
  await posts[0].setTags(['One', 'Two']);
  await posts[1].setTags(['One']);
  await hexo.model('Category').insert({ name: 'Empty category', slug: 'empty-category' });
  await hexo.model('Tag').insert({ name: 'Empty tag', slug: 'empty-tag' });
  const site = {
    posts: hexo.locals.toObject().posts,
    categories: hexo.model('Category').find({}),
    tags: hexo.model('Tag').find({}),
  };
  expect(site.categories.length).toBe(2);
  expect(site.tags.length).toBe(3);
  const cacheable = Profile.Cacheable;
  const element = cacheable({
    site,
    config: { author: 'Hexo Author' },
    helper: {
      url_for: url_for.bind(hexo),
      _p: (key, count) => `${key} (${count})`,
      __: (key) => key,
    },
    widget: {
      type: 'profile',
      social_links: { Blog: '/posts/', External: 'https://other.example/' },
    },
    defaultAvatar: '/theme-default.png',
  });
  expect(element.props.counter).toEqual({
    post: { count: 3, title: 'common.post (3)', url: '/blog/archives/' },
    category: { count: 1, title: 'common.category (1)', url: '/blog/categories/' },
    tag: { count: 2, title: 'common.tag (2)', url: '/blog/tags/' },
  });
  expect(element.props.avatar).toBe('/blog/theme-default.png');
  expect(element.props.socialLinks.map((link) => link.url)).toEqual([
    '/blog/posts/',
    'https://other.example/',
  ]);
  expect(renderToStaticMarkup(element)).toContain('data-type="profile"');
});

test('Profile schema and its polymorphic link reference resolve from the library fallback', () => {
  const loader = SchemaLoader.load(
    {
      $id: '/profile-consumer.json',
      type: 'object',
      properties: { widgets: { type: 'array', items: { $ref: '/widget/profile.json' } } },
    },
    [path.join(__dirname, 'no-theme-schema')],
  );
  const schema = loader.getSchema('/profile-consumer.json');
  expect(loader.getSchema('/widget/profile.json').def).toEqual(
    require('../schema/widget/profile.json'),
  );
  expect(loader.getSchema('/misc/poly_links.json')).toBeDefined();
  const validate = (widget) => schema.validate({ widgets: [widget] });
  expect(validate({ type: 'profile' })).toBe(true);
  expect(
    validate({
      type: 'profile',
      author: null,
      avatar: null,
      avatar_rounded: false,
      gravatar: null,
      follow_link: null,
      social_links: null,
    }),
  ).toBe(true);
  expect(
    validate({
      type: 'profile',
      social_links: {
        Blog: '/blog',
        GitHub: { url: 'https://github.com/author', icon: ['fab', 'fa-github'] },
      },
    }),
  ).toBe(true);
  for (const widget of [
    {},
    { type: 'other' },
    { type: 'profile', avatar_rounded: 'false' },
    { type: 'profile', social_links: { Invalid: false } },
  ]) {
    expect(validate(widget)).not.toBe(true);
  }
  const defaults = loader.getSchema('/widget/profile.json').getDefaultValue().value;
  expect(defaults.avatar_rounded.value).toBe(false);
  expect(defaults.avatar.value).toBe(null);
  expect(Object.keys(defaults)).not.toContain('defaultAvatar');
});

test('The core view resolver finds the library Profile without a theme override', () => {
  const view = require('../core/view');
  view.init({ theme_dir: path.join(__dirname, 'no-profile-theme') });
  expect(view.require('widget/profile')).toBe(Profile);
  const element = createElement(view.require('widget/profile'), {
    author: 'Independent',
    counter: {
      post: { title: 'Posts', count: 0, url: '/archives/' },
      category: { title: 'Categories', count: 0, url: '/categories/' },
      tag: { title: 'Tags', count: 0, url: '/tags/' },
    },
  });
  expect(renderToStaticMarkup(element)).toContain('Independent');
});
