/* eslint-env browser */
const { renderToString } = require('inferno-server');
const ShareThis = require('./sharethis');

function initialize() {
  document.body.innerHTML = renderToString(
    <ShareThis installUrl="https://example.com/sharethis.js" />,
  );
  // The external SDK is covered separately with a real browser; run the PJAX initializer here.
  // eslint-disable-next-line no-eval
  window.eval(document.querySelector('script:not([src])').textContent);
}

afterEach(() => {
  delete window.__sharethis__;
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

test('Leave first-load initialization to the ShareThis SDK', () => {
  expect(initialize).not.toThrow();
  expect(document.querySelector('[data-share-provider="sharethis"]')).not.toBe(null);
});

test('Render each replaced container with the loaded account settings', () => {
  const settings = { enabled: true, networks: ['email'], size: 32 };
  window.__sharethis__ = {
    config: { 'inline-share-buttons': settings },
    load: jest.fn(() => {
      document.querySelector('.sharethis-inline-share-buttons').innerHTML =
        '<div class="st-btn"></div>';
    }),
  };
  initialize();
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  const previous = document.querySelector('.st-btn');
  initialize();
  expect(document.querySelector('.st-btn')).not.toBe(previous);
  expect(window.__sharethis__.load).toHaveBeenCalledTimes(2);
  expect(window.__sharethis__.load).toHaveBeenLastCalledWith('inline-share-buttons', settings);
});

test('Skip initialization when a pending SDK arrives after the container was replaced', () => {
  initialize();
  document.body.innerHTML = '';
  window.__sharethis__ = { config: {}, load: jest.fn() };
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(window.__sharethis__.load).not.toHaveBeenCalled();
});

test('Use the destination metadata without mutating the saved account settings', () => {
  const settings = { enabled: true, url: 'https://example.com/old/' };
  window.__sharethis__ = { config: { 'inline-share-buttons': settings }, load: jest.fn() };
  document.body.innerHTML = renderToString(
    <ShareThis.Cacheable
      share={{ install_url: '/sharethis.js' }}
      page={{ permalink: 'https://example.com/next/', title: 'Next article' }}
    />,
  );
  // eslint-disable-next-line no-eval
  window.eval(document.querySelector('script:not([src])').textContent);
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(window.__sharethis__.load).toHaveBeenCalledWith('inline-share-buttons', {
    enabled: true,
    url: 'https://example.com/next/',
    title: 'Next article',
  });
  expect(settings.url).toBe('https://example.com/old/');
});
