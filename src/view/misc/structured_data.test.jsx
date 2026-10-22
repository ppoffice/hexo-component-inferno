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
