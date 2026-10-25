/* eslint-env browser */
const { renderToString } = require('inferno-server');
const WebShare = require('./web_share');
const LegacyShareJs = require('./sharejs');

function initialize(element = <WebShare />) {
  document.body.innerHTML = renderToString(element);
  // Run the native sharing initializer.
  document.body.querySelectorAll('script:not([src])').forEach((script) => {
    // eslint-disable-next-line no-eval
    window.eval(script.textContent);
  });
  return document.querySelector('button');
}

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  delete navigator.share;
});

afterEach(() => {
  jest.restoreAllMocks();
  delete navigator.share;
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

test('Use the independent Web Share entry without loading Share.js assets or calling the CDN helper', () => {
  const cdn = jest.fn();
  const button = initialize(<WebShare.Cacheable helper={{ cdn }} share={{ type: 'web_share' }} />);
  expect(document.querySelector('[data-share-provider="web_share"]')).not.toBe(null);
  expect(cdn).not.toHaveBeenCalled();
  expect(button.hidden).toBe(false);
  expect(button.disabled).toBe(true);
  expect(document.querySelector('[data-share-native]').hidden).toBe(false);
  expect(document.querySelector('[role="status"]').hidden).toBe(false);
  expect(document.querySelector('.a2a_kit, [data-share-fallback], script[src]')).toBe(null);
  expect(document.querySelector('link')).toBe(null);
  expect(document.body.innerHTML).not.toMatch(/google|tencent|social-share/i);
});

test('Retired Share.js does not initialize native sharing or its fallback', () => {
  const html = renderToString(<LegacyShareJs.Cacheable />);
  expect(html).toContain('Share.js is retired');
  expect(html).toContain('notification is-danger');
  expect(html).not.toMatch(/<script|<button|a2a_kit|data-share-provider/);
});

test('Web Share and legacy Share.js schemas accept only their own type', () => {
  const Ajv = require('ajv');
  const validate = new Ajv().compile(require('../../schema/share/web_share.json'));
  expect(validate({ type: 'web_share' })).toBe(true);
  expect(validate({ type: 'sharejs' })).toBe(false);
  const legacy = new Ajv().compile(require('../../schema/share/sharejs.json'));
  expect(legacy({ type: 'sharejs' })).toBe(true);
  expect(legacy({ type: 'web_share' })).toBe(false);
});

test('Only invoke Web Share on click, using the current page title and URL', async () => {
  navigator.share = jest.fn().mockResolvedValue(undefined);
  const button = initialize();
  expect(button.textContent).toBe('More');
  expect(button.className).toBe('button');
  expect(button.querySelector('[aria-hidden="true"] .fa-share-alt')).not.toBe(null);
  expect(button.parentElement.classList.contains('has-text-centered')).toBe(true);
  expect(button.hidden).toBe(false);
  expect(document.querySelector('[data-share-native]').hidden).toBe(false);
  expect(button.disabled).toBe(false);
  expect(navigator.share).not.toHaveBeenCalled();
  document.title = 'Current article';
  await button.onclick();
  expect(navigator.share).toHaveBeenCalledWith({
    title: 'Current article',
    url: window.location.href,
  });
  expect(document.querySelector('[role="status"]').hidden).toBe(true);
  expect(document.querySelector('.a2a_kit, [data-share-fallback], script[src]')).toBe(null);
});

test('Use a short Chinese label for Chinese pages', () => {
  const button = initialize(<WebShare.Cacheable config={{ language: ['zh-CN', 'en'] }} />);
  expect(button.textContent).toBe('更多');
});

test('Render five direct platform links before the system share control without any SDK', () => {
  const url = 'https://example.com/posts/hello/?a=1&b=2';
  const title = 'Hello & "world"';
  initialize(<WebShare.Cacheable page={{ permalink: url, title }} />);
  const links = [...document.querySelectorAll('[data-share-network]')];
  expect(links.map((link) => link.dataset.shareNetwork)).toEqual([
    'x',
    'facebook',
    'weibo',
    'telegram',
    'linkedin',
  ]);
  for (const link of links) {
    const target = new URL(link.href);
    expect(target.protocol).toBe('https:');
    expect(target.searchParams.get(link.dataset.shareNetwork === 'facebook' ? 'u' : 'url')).toBe(
      url,
    );
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
    expect(link.className).toBe('button');
  }
  expect(new URL(links[0].href).searchParams.get('text')).toBe(title);
  expect(links.map((link) => link.style.backgroundColor)).toEqual([
    'rgb(0, 0, 0)',
    'rgb(8, 102, 255)',
    'rgb(230, 22, 45)',
    'rgb(38, 165, 228)',
    'rgb(10, 102, 194)',
  ]);
  for (const link of links) {
    expect(link.style.borderRadius).toBe('');
    expect(link.style.height).toBe('');
    expect(link.style.fontSize).toBe('');
  }
  expect(links.find((link) => link.dataset.shareNetwork === 'telegram').style.color).toBe(
    'rgb(255, 255, 255)',
  );
  expect(document.querySelector('[data-share-native] button').getAttribute('style')).toBe(null);
  expect(
    document.querySelector('.buttons').lastElementChild.hasAttribute('data-share-native'),
  ).toBe(true);
  expect(document.querySelectorAll('script[src], iframe, .a2a_kit')).toHaveLength(0);
});

test('Canceling native sharing leaves the button available without an error', async () => {
  navigator.share = jest.fn().mockRejectedValue({ name: 'AbortError' });
  const button = initialize();
  await button.onclick();
  expect(button.hidden).toBe(false);
  expect(button.disabled).toBe(false);
  expect(document.querySelector('[role="status"]').hidden).toBe(true);
});

test.each(['reject', 'throw'])(
  'Show an error without loading a fallback when native sharing fails (%s)',
  async (failure) => {
    navigator.share = jest.fn(() => {
      const error = new Error('Sharing is not allowed');
      if (failure === 'throw') throw error;
      return Promise.reject(error);
    });
    const button = initialize();
    await button.onclick();
    expect(document.querySelector('[role="status"]').hidden).toBe(false);
    expect(button.hidden).toBe(false);
    expect(button.disabled).toBe(false);
    expect(document.querySelector('[data-share-native]').hidden).toBe(false);
    expect(document.querySelector('.a2a_kit, [data-share-fallback], script[src]')).toBe(null);
  },
);

test('Ignore old direct CSS/JS props and reinitialize replaced page controls without sharing', () => {
  navigator.share = jest.fn();
  initialize(<WebShare cssUrl="/old-share.css" jsUrl="/old-share.js" />);
  const button = initialize();
  expect(button.hidden).toBe(false);
  expect(navigator.share).not.toHaveBeenCalled();
  expect(document.body.innerHTML).not.toContain('/old-share');
});
