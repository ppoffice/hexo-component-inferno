/* eslint-env browser */
const { renderToStaticMarkup } = require('inferno-server');
const Profile = require('./profile');

const counter = {
  post: { title: 'Posts', count: 3, url: '/archives/' },
  category: { title: 'Categories', count: 1, url: '/categories/' },
  tag: { title: 'Tags', count: 0, url: '/tags/' },
};
const site = {
  posts: { length: 3 },
  categories: [{ length: 2 }, { length: 0 }, { length: 1 }],
  tags: [{ length: 0 }, { length: 1 }],
};

function render(element) {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

function adapt(widget = {}, extra = {}) {
  const helper = {
    url_for: jest.fn((url) => `resolved:${url}`),
    _p: jest.fn((key, count) => `${key}:${count}`),
    __: jest.fn((key) => `translated:${key}`),
  };
  const cacheable = Profile.Cacheable;
  const element = cacheable({
    site,
    config: { author: 'Configured' },
    helper,
    widget,
    ...extra,
  });
  expect(element.type).toBe(Profile);
  return { data: element.props, helper, element };
}

test('Raw Profile renders the existing Bulma structure without Hexo', () => {
  const body = render(
    <Profile
      avatar="/portrait.png"
      avatarRounded={true}
      author="Ada"
      authorTitle="Engineer"
      location="London"
      counter={counter}
      followLink="https://example.com/follow"
      followTitle="Follow"
      socialLinks={[
        { name: 'GitHub', url: 'https://github.com/ada', icon: 'fab fa-github' },
        { name: 'Blog', url: '/blog/' },
      ]}
    />,
  );
  expect(body.querySelector('.card.widget').getAttribute('data-type')).toBe('profile');
  expect(body.querySelector('figure').className).toBe('image is-128x128 mx-auto mb-2');
  expect(body.querySelector('img').outerHTML).toBe(
    '<img class="avatar is-rounded" src="/portrait.png" alt="Ada">',
  );
  expect(body.querySelector('.title').style.lineHeight).toBe('inherit');
  expect(body.querySelector('.justify-content-center span').textContent).toBe('London');
  expect(
    Array.from(body.querySelectorAll('nav.is-mobile .title')).map((item) => item.textContent),
  ).toEqual(['3', '1', '0']);
  expect(
    Array.from(body.querySelectorAll('nav.is-mobile a')).map((item) => item.getAttribute('href')),
  ).toEqual(['/archives/', '/categories/', '/tags/']);
  const follow = body.querySelector('a.is-primary');
  expect(follow.textContent).toBe('Follow');
  expect(follow.getAttribute('rel')).toBe('me noopener');
  expect(follow.target).toBe('_blank');
  const [icon, text] = body.querySelectorAll('a.is-transparent');
  expect(icon.getAttribute('aria-label')).toBe('GitHub');
  expect(icon.querySelector('i').getAttribute('aria-hidden')).toBe('true');
  expect(text.textContent).toBe('Blog');
  expect(text.hasAttribute('aria-label')).toBe(false);
  expect(text.getAttribute('rel')).toBe('me noopener');
});

test.each([undefined, null, false, ''])('Missing avatar (%p) renders no image', (avatar) => {
  const body = render(<Profile avatar={avatar} counter={counter} author="Author" />);
  expect(body.querySelector('figure, img')).toBe(null);
  expect(body.querySelector('.title').textContent).toBe('Author');
});

test('Raw text and attribute values are escaped rather than rendered as HTML', () => {
  const text = '<img src=x onerror="alert(1)"> & text';
  const url = '/portrait.png?x=" onerror="alert(1)';
  const body = render(
    <Profile
      avatar={url}
      author={text}
      authorTitle={text}
      location={text}
      counter={counter}
      followLink={url}
      followTitle={text}
      socialLinks={[{ name: text, url }]}
    />,
  );
  expect(body.querySelectorAll('img')).toHaveLength(1);
  expect(body.querySelector('img').getAttribute('src')).toBe(url);
  expect(body.querySelector('img').getAttribute('alt')).toBe(text);
  expect(body.querySelector('[onerror], script')).toBe(null);
  expect(body.querySelector('.title').textContent).toBe(text);
  expect(body.querySelector('a.is-transparent').textContent).toBe(text);
  expect(body.querySelector('a.is-transparent').getAttribute('title')).toBe(text);
});

test.each([undefined, null, false, []])('Optional links stay hidden (%p)', (socialLinks) => {
  const body = render(<Profile counter={counter} socialLinks={socialLinks} followLink={false} />);
  expect(body.querySelector('.is-multiline, .is-primary')).toBe(null);
});

test('Raw social arrays preserve object-only rendering and icon/no-icon semantics', () => {
  const body = render(
    <Profile
      counter={counter}
      socialLinks={['ignored', false, { name: 'Plain', url: '/plain', icon: null }]}
    />,
  );
  expect(body.querySelectorAll('a.is-transparent')).toHaveLength(1);
  expect(body.querySelector('a.is-transparent').textContent).toBe('Plain');
  expect(body.querySelector('i')).toBe(null);
});

test('Cacheable adapts counts, route URLs, translations and snake-case presentation options', () => {
  const { data, helper, element } = adapt({
    avatar_rounded: true,
    author_title: 'Writer',
    location: 'City',
    follow_link: '/follow',
  });
  expect(data.author).toBe('Configured');
  expect(data.avatarRounded).toBe(true);
  expect(data.authorTitle).toBe('Writer');
  expect(data.location).toBe('City');
  expect(data.counter).toEqual({
    post: { title: 'common.post:3', count: 3, url: 'resolved:/archives/' },
    category: { title: 'common.category:2', count: 2, url: 'resolved:/categories/' },
    tag: { title: 'common.tag:1', count: 1, url: 'resolved:/tags/' },
  });
  expect(helper._p.mock.calls).toEqual([
    ['common.post', 3],
    ['common.category', 2],
    ['common.tag', 1],
  ]);
  expect(data.followLink).toBe('resolved:/follow');
  expect(data.followTitle).toBe('translated:widget.follow');
  expect(render(element).querySelector('img')).toBe(null);
  expect(helper.url_for.mock.calls.flat()).not.toContain('/img/avatar.png');
});

test.each([null, '', false])('Explicit author (%p) does not fall back', (author) => {
  const { data } = adapt({ author });
  expect(data.author).toBe(author);
  expect(adapt({}, { config: undefined }).data.author).toBeUndefined();
});

test.each([false, null, undefined])('Falsy options (%p) stay optional', (value) => {
  const { data, element } = adapt({
    avatar_rounded: value,
    follow_link: value,
    social_links: value,
  });
  expect(data.avatarRounded).toBe(value === undefined ? false : value);
  expect(data.followLink).toBeUndefined();
  expect(data.socialLinks).toBe(null);
  expect(render(element).querySelector('.is-primary, .is-multiline')).toBe(null);
});

test('Gravatar wins over both configured and caller-provided avatar paths', () => {
  const { data, helper } = adapt(
    { gravatar: 'a@example.com', avatar: '/chosen.png' },
    { defaultAvatar: '/default.png' },
  );
  expect(data.avatar).toMatch(/gravatar\.com\/avatar\/[a-f0-9]{32}\?s=128/);
  expect(helper.url_for).not.toHaveBeenCalledWith('/chosen.png');
  expect(helper.url_for).not.toHaveBeenCalledWith('/default.png');
});

test('Only the chosen avatar path is resolved once, with no hidden theme default', () => {
  const chosen = adapt(
    { gravatar: null, avatar: '/chosen.png' },
    { defaultAvatar: '/default.png' },
  );
  expect(chosen.data.avatar).toBe('resolved:/chosen.png');
  expect(chosen.helper.url_for.mock.calls.filter(([url]) => url === '/chosen.png')).toHaveLength(1);
  expect(chosen.helper.url_for).not.toHaveBeenCalledWith('/default.png');
  const fallback = adapt({ avatar: null }, { defaultAvatar: '/default.png' });
  expect(fallback.data.avatar).toBe('resolved:/default.png');
  expect(fallback.helper.url_for.mock.calls.filter(([url]) => url === '/default.png')).toHaveLength(
    1,
  );
  const absent = adapt({}, { defaultAvatar: null });
  expect(absent.data.avatar).toBeUndefined();
  expect(render(absent.element).querySelector('figure, img')).toBe(null);
});

test('Cacheable maps polymorphic social URLs once, preserving order, names and icons', () => {
  const social = Object.freeze({
    Blog: '/blog',
    GitHub: Object.freeze({ url: 'https://github.com/author', icon: 'fab fa-github' }),
    Mastodon: Object.freeze({ url: '/mastodon' }),
  });
  const { data, helper } = adapt(Object.freeze({ social_links: social }));
  expect(data.socialLinks).toEqual([
    { name: 'Blog', url: 'resolved:/blog' },
    { name: 'GitHub', url: 'resolved:https://github.com/author', icon: 'fab fa-github' },
    { name: 'Mastodon', url: 'resolved:/mastodon', icon: undefined },
  ]);
  expect(helper.url_for.mock.calls.filter(([url]) => url === '/blog')).toHaveLength(1);
  expect(adapt({ social_links: {} }).data.socialLinks).toEqual([]);
});
