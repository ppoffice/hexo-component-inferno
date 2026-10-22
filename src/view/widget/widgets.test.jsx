// Runs in the node environment of the default Jest project (see jest.config.json): Babel puts its
// helpers before a @jest-environment docblock in the compiled file.
const path = require('path');
const Hexo = require('hexo');
const { renderToStaticMarkup } = require('inferno-server');
const Archives = require('./archives');
const Categories = require('./categories');
const Tags = require('./tags');

const hexo = new Hexo(path.join(__dirname, '../../../fixture/site'), { silent: true });
let site, helper;

beforeAll(async () => {
  await hexo.init();
  const Post = hexo.model('Post');
  const posts = await Post.insert(
    [1, 2, 3, 4, 5].map((month) => ({
      source: `post-${month}.md`,
      slug: `post-${month}`,
      date: new Date(Date.UTC(2024, month - 1, 15)),
    })),
  );
  // tag-1 is on every post, tag-2 on four, and so on
  for (const [i, post] of posts.entries()) {
    await post.setTags(['tag-1', 'tag-2', 'tag-3', 'tag-4', 'tag-5'].slice(0, 5 - i));
    await post.setCategories([['parent', 'child'], 'other-1', 'other-2'].slice(0, 3 - (i % 3)));
  }
  site = hexo.locals.toObject();
  helper = {
    url_for: (url) => '/' + url,
    _p: (key) => key,
    __: (key) => key,
  };
});

function render(Widget, widget, extra = {}) {
  return renderToStaticMarkup(
    <Widget.Cacheable
      site={site}
      config={hexo.config}
      page={{}}
      helper={helper}
      widget={widget}
      {...extra}
    />,
  );
}

function getLinks(html) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

describe('Archives', () => {
  test('Show all archives without amount', () => {
    const html = render(Archives, { type: 'archives' });
    expect(getLinks(html)).toEqual([
      '/archives/2024/05/',
      '/archives/2024/04/',
      '/archives/2024/03/',
      '/archives/2024/02/',
      '/archives/2024/01/',
    ]);
    expect(html).not.toContain('More');
  });

  test('Show some archives and link to the archive page', () => {
    const html = render(Archives, { type: 'archives', amount: 2 });
    expect(getLinks(html)).toEqual(['/archives/2024/05/', '/archives/2024/04/', '/archives/']);
    // A link with the text at the start, like the archives, and a chevron at the end
    expect(html).toContain(
      '<a class="level is-mobile" href="/archives/"><span class="level-start"><span class="level-item">More</span></span><span class="level-end"><span class="level-item icon is-small" aria-hidden="true"><i class="fas fa-chevron-right"></i></span></span></a>',
    );
  });

  test('Do not link to the archive page when all archives are shown', () => {
    expect(render(Archives, { type: 'archives', amount: 5 })).not.toContain('More');
  });

  test('Use the translation of widget.more', () => {
    const translated = { ...helper, __: (key) => (key === 'widget.more' ? '更多' : key) };
    const html = render(Archives, { type: 'archives', amount: 1 }, { helper: translated });
    expect(html).toContain('更多');
  });
});

describe('Categories', () => {
  test('Show some top-level categories with their children, and link to the category page', () => {
    const all = getLinks(render(Categories, { type: 'categories' }));
    expect(all).toEqual([
      '/categories/other-1/',
      '/categories/other-2/',
      '/categories/parent/',
      '/categories/parent/child/',
    ]);

    const html = render(Categories, { type: 'categories', amount: 1 });
    expect(getLinks(html)).toEqual(['/categories/other-1/', '/categories/']);
    expect(html).toContain('<a class="level is-mobile" href="/categories/">');
    expect(html).toContain('fa-chevron-right');
    const withChildren = getLinks(
      render(Categories, { type: 'categories', amount: 1, orderBy: 'name', order: -1 }),
    );
    expect(withChildren).toEqual([
      '/categories/parent/',
      '/categories/parent/child/',
      '/categories/',
    ]);
  });
});

describe('Tags', () => {
  test('Show the tags with most posts first, and link to the tag page', () => {
    const html = render(Tags, { type: 'tags', order_by: '-length', amount: 2 });
    expect(getLinks(html)).toEqual(['/tags/tag-1/', '/tags/tag-2/', '/tags/']);
    // A single tag with a chevron after the text
    expect(html).toContain(
      '<a class="tags has-addons" href="/tags/"><span class="tag"><span>More</span><span class="icon is-small" aria-hidden="true"><i class="fas fa-chevron-right"></i></span></span></a>',
    );
  });

  test('Do not link to the tag page when all tags are shown', () => {
    const html = render(Tags, { type: 'tags', amount: 5 });
    expect(getLinks(html)).toHaveLength(5);
    expect(html).not.toContain('More');
  });
});
