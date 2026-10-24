/* eslint-env browser */
const { renderToString } = require('inferno-server');
const StructuredData = require('./structured_data');

test('A title cannot end the JSON-LD script', () => {
  const title = 'Why </script><img src=x onerror=alert(1)> breaks';
  const container = document.createElement('div');
  container.innerHTML = renderToString(
    <StructuredData
      title={title}
      url="https://example.com/post/"
      author="Author"
      description="Description"
      images={['/image.png']}
      date={new Date(0)}
      updated={new Date(0)}
    />,
  );
  expect(container.querySelector('img')).toBe(null);
  const scripts = container.querySelectorAll('script');
  expect(scripts.length).toBe(1);
  expect(JSON.parse(scripts[0].textContent).headline).toBe(title);
});

function render(element) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
  return container;
}

const OpenGraph = require('./open_graph');
const Meta = require('./meta');
const WebApp = require('./web_app');

test('Descriptions are escaped once, from HTML or text', () => {
  const props = { url: 'https://example.com/post/', title: 'Title', date: new Date(0) };
  for (const description of [
    '<p>Tom &amp; Jerry&#39;s &quot;show&quot;</p>',
    'Tom & Jerry\'s "show"',
  ]) {
    const og = render(<OpenGraph {...props} description={description} images={['/a.png']} />);
    expect(og.querySelector('meta[property="og:description"]').getAttribute('content')).toBe(
      'Tom & Jerry\'s "show"',
    );
    const data = render(<StructuredData {...props} description={description} />);
    expect(JSON.parse(data.querySelector('script').textContent).description).toBe(
      'Tom & Jerry\'s "show"',
    );
  }
});

test('JSON-LD keeps the images with any image extension', () => {
  const images = ['/a.jpeg', '/b.JPG', '/c.png?w=800', '/d.avif', '/e.svg', '/page/'];
  const data = render(<StructuredData url="https://example.com/post/" title="T" images={images} />);
  expect(JSON.parse(data.querySelector('script').textContent).image).toEqual([
    'https://example.com/a.jpeg',
    'https://example.com/b.JPG',
    'https://example.com/c.png?w=800',
    'https://example.com/d.avif',
    'https://example.com/e.svg',
  ]);
});

test('Open Graph and JSON-LD without images', () => {
  const props = { url: 'https://example.com/post/', title: 'Title' };
  expect(render(<OpenGraph {...props} />).querySelector('meta[property="og:image"]')).toBe(null);
  expect(
    JSON.parse(render(<StructuredData {...props} />).querySelector('script').textContent).image,
  ).toEqual([]);
});

test('Open Graph locale', () => {
  const locale = (language) =>
    render(
      <OpenGraph url="https://example.com/" title="T" images={[]} language={language} />,
    ).querySelector('meta[property="og:locale"]');
  expect(locale('EN').getAttribute('content')).toBe('en_US');
  expect(locale('zh-cn').getAttribute('content')).toBe('zh_CN');
  expect(locale('xx')).toBe(null);
});

test('Meta tags with "=" and escaped ";" in their values', () => {
  const tags = render(
    <Meta
      meta={['http-equiv=refresh;content=5\\; url=https://example.com/', 'name=x;content=a=b']}
    />,
  ).querySelectorAll('meta');
  expect(tags[0].getAttribute('content')).toBe('5; url=https://example.com/');
  expect(tags[1].getAttribute('content')).toBe('a=b');
});

test('Web app icons are resolved against the root of the site', () => {
  const helper = { url_for: (path) => (path.startsWith('http') ? path : '/blog' + path) };
  const app = render(
    <WebApp.Cacheable
      name="Blog"
      helper={helper}
      favicon="/favicon.png"
      icons={[{ src: '/icon.png' }, { src: '/big.png', sizes: '144x144 192x192' }]}
    />,
  );
  expect(app.querySelector('meta[name="msapplication-TileImage"]').getAttribute('content')).toBe(
    '/blog/big.png',
  );
  expect(
    Array.from(app.querySelectorAll('link[rel="apple-touch-icon"]')).map((link) =>
      link.getAttribute('href'),
    ),
  ).toEqual(['/blog/big.png', '/blog/big.png']);
});

test('Open Graph tags of an article', () => {
  const og = render(
    <OpenGraph
      type="article"
      title="Title"
      url="https://example.com/post/"
      siteName="Site"
      author="Author"
      date={new Date(Date.UTC(2024, 0, 1))}
      updated={new Date(Date.UTC(2024, 0, 2))}
      images={['https://cdn.example.com/a.png', 'b.png']}
      keywords={[{ name: 'tag' }, 'keyword', '']}
      twitterCard="summary_large_image"
      twitterId="user"
      twitterSite="@site"
      facebookAdmins="admin"
      facebookAppId="app"
    />,
  );
  const content = (property) =>
    Array.from(og.querySelectorAll(`meta[property="${property}"]`)).map((meta) =>
      meta.getAttribute('content'),
    );
  expect(content('og:image')).toEqual([
    'https://cdn.example.com/a.png',
    'https://example.com/post/b.png',
  ]);
  expect(content('article:published_time')).toEqual(['2024-01-01T00:00:00.000Z']);
  expect(content('article:modified_time')).toEqual(['2024-01-02T00:00:00.000Z']);
  expect(content('article:author')).toEqual(['Author']);
  expect(content('article:tag')).toEqual(['tag', 'keyword']);
  expect(content('twitter:card')).toEqual(['summary_large_image']);
  expect(content('twitter:image:src')).toEqual(['https://cdn.example.com/a.png']);
  expect(content('twitter:creator')).toEqual(['@user']);
  expect(content('twitter:site')).toEqual(['@site']);
  expect(content('fb:admins')).toEqual(['admin']);
  expect(content('fb:app_id')).toEqual(['app']);
  expect(og.querySelector('link[rel="publisher"]')).toBe(null);
  // A single keyword as a string, and a relative image for Twitter
  const single = render(
    <OpenGraph url="https://example.com/post/" title="T" keywords="one" images="c.png" />,
  );
  expect(single.querySelector('meta[property="article:tag"]').getAttribute('content')).toBe('one');
  expect(single.querySelector('meta[property="twitter:image:src"]').getAttribute('content')).toBe(
    'https://example.com/post/c.png',
  );
});
