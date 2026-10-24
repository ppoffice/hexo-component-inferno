/* eslint-env browser */
const { renderToString } = require('inferno-server');
const Gallery = require('./gallery');
const installer = require('../../util/gallery');

const props = {
  lightGallery: { jsUrl: '/custom/light.js', cssUrl: '/custom/light.css' },
  justifiedGallery: { jsUrl: '/custom/justified.js', cssUrl: '/custom/justified.css' },
};

function render(element) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
  return container;
}

test('Keep the head CSS URLs and body SDK script URLs and defer attributes', () => {
  const head = render(<Gallery {...props} head={true} />);
  expect(
    Array.from(head.querySelectorAll('link')).map((link) => link.getAttribute('href')),
  ).toEqual(['/custom/light.css', '/custom/justified.css']);
  expect(head.querySelector('script')).toBe(null);
  expect(head.querySelectorAll('link[data-pjax]')).toHaveLength(2);
  const body = render(<Gallery {...props} head={false} />);
  const scripts = Array.from(body.querySelectorAll('script'));
  expect(
    scripts.filter((script) => script.src).map((script) => script.getAttribute('src')),
  ).toEqual(['/custom/light.js', '/custom/justified.js']);
  expect(scripts.filter((script) => script.src).every((script) => script.defer)).toBe(true);
  // Optional Gallery output must not change the global data-pjax node count on enabled pages.
  expect(scripts.some((script) => script.hasAttribute('data-pjax'))).toBe(false);
  expect(scripts[2].textContent).toContain(installer);
  expect(scripts[2].textContent).toContain('window.HexoGallery.init(document');
});

test('Keep Cacheable helper calls and exact SDK versions compatible', () => {
  const cdn = jest.fn((name, version, file) => `https://cdn.example/${name}@${version}/${file}`);
  render(<Gallery.Cacheable head={false} helper={{ cdn }} />);
  expect(cdn.mock.calls).toEqual([
    ['lightgallery', '3.0.0', 'lightgallery.min.js'],
    ['lightgallery', '3.0.0', 'css/lightgallery-bundle.min.css'],
    ['lightgallery', '3.0.0', 'plugins/zoom/lg-zoom.min.js'],
    ['lightgallery', '3.0.0', 'plugins/thumbnail/lg-thumbnail.min.js'],
    ['lightgallery', '3.0.0', 'plugins/fullscreen/lg-fullscreen.min.js'],
    ['justifiedGallery', '3.8.1', 'dist/js/jquery.justifiedGallery.min.js'],
    ['justifiedGallery', '3.8.1', 'dist/css/justifiedGallery.min.css'],
  ]);
});
