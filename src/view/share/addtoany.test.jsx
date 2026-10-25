/* eslint-env browser */
const { renderToString } = require('inferno-server');
const AddToAny = require('./addtoany');

function mount(url = 'https://example.com/next/') {
  document.body.innerHTML = renderToString(<AddToAny url={url} title="Next article" />);
  // eslint-disable-next-line no-eval
  window.eval(document.querySelector('script:not([src])').textContent);
}

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  delete window.a2a;
});

test('Reinitializes the new kit even when the SDK has already loaded', () => {
  window.a2a = { init_all: jest.fn() };
  const script = document.createElement('script');
  script.src = 'https://static.addtoany.com/menu/page.js';
  document.head.appendChild(script);
  mount();
  expect(window.a2a.init_all).toHaveBeenCalledTimes(1);
  expect(document.querySelector('.a2a_kit').getAttribute('data-a2a-url')).toBe(
    'https://example.com/next/',
  );
  expect(document.querySelector('.a2a_kit').getAttribute('data-a2a-title')).toBe('Next article');
  expect(document.querySelector('.a2a_kit').style.display).toBe('flex');
  expect(document.querySelector('.a2a_kit').style.justifyContent).toBe('center');
  expect(document.querySelector('.a2a_kit').style.flexWrap).toBe('wrap');
});

test('SDK arrival after navigation does not initialize a detached kit', () => {
  mount();
  document.body.innerHTML = '';
  window.a2a = { init_all: jest.fn() };
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(window.a2a.init_all).not.toHaveBeenCalled();
});
