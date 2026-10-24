/* eslint-env browser */
const { renderToString } = require('inferno-server');
const ShareJs = require('./sharejs');
const AddToAny = require('./addtoany');

function initialize(element = <ShareJs />) {
  document.body.innerHTML = renderToString(element);
  const script = document.querySelector('script:not([src])');
  // Run only our initializer, not the external AddToAny SDK.
  // eslint-disable-next-line no-eval
  window.eval(script.textContent);
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
});

test('Keep the old entry and reuse AddToAny without loading Share.js assets or calling the CDN helper', () => {
  const cdn = jest.fn();
  const button = initialize(<ShareJs.Cacheable helper={{ cdn }} share={{ type: 'sharejs' }} />);
  expect(cdn).not.toHaveBeenCalled();
  expect(button.hidden).toBe(true);
  expect(document.querySelector('.a2a_kit').outerHTML).toBe(
    new DOMParser()
      .parseFromString(renderToString(<AddToAny />), 'text/html')
      .querySelector('.a2a_kit').outerHTML,
  );
  expect(Array.from(document.querySelectorAll('script[src]')).map((script) => script.src)).toEqual([
    'https://static.addtoany.com/menu/page.js',
  ]);
  expect(document.querySelector('link')).toBe(null);
  expect(document.body.innerHTML).not.toMatch(/google|tencent|social-share/i);
});

test('Only invoke Web Share on click, using the current page title and URL', async () => {
  navigator.share = jest.fn().mockResolvedValue(undefined);
  const button = initialize();
  expect(button.hidden).toBe(false);
  expect(navigator.share).not.toHaveBeenCalled();
  document.title = 'Current article';
  await button.onclick();
  expect(navigator.share).toHaveBeenCalledWith({
    title: 'Current article',
    url: window.location.href,
  });
  expect(document.querySelector('[role="status"]').hidden).toBe(true);
});

test('Canceling native sharing does not activate or focus the fallback', async () => {
  navigator.share = jest.fn().mockRejectedValue({ name: 'AbortError' });
  const button = initialize();
  const fallback = document.querySelector('.a2a_dd');
  const click = jest.spyOn(fallback, 'click');
  const focus = jest.spyOn(fallback, 'focus');
  await button.onclick();
  expect(click).not.toHaveBeenCalled();
  expect(focus).not.toHaveBeenCalled();
  expect(document.querySelector('[role="status"]').hidden).toBe(true);
});

test.each(['reject', 'throw'])(
  'Offer the visible fallback when native sharing fails (%s)',
  async (failure) => {
    navigator.share = jest.fn(() => {
      const error = new Error('Sharing is not allowed');
      if (failure === 'throw') throw error;
      return Promise.reject(error);
    });
    const button = initialize();
    await button.onclick();
    expect(document.querySelector('[role="status"]').hidden).toBe(false);
    expect(document.activeElement).toBe(document.querySelector('.a2a_dd'));
  },
);

test('Ignore old direct CSS/JS props and reinitialize replaced page controls without sharing', () => {
  navigator.share = jest.fn();
  initialize(<ShareJs cssUrl="/old-share.css" jsUrl="/old-share.js" />);
  const button = initialize();
  expect(button.hidden).toBe(false);
  expect(navigator.share).not.toHaveBeenCalled();
  expect(document.body.innerHTML).not.toContain('/old-share');
});
