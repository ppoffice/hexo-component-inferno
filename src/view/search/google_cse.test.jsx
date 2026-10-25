/* eslint-env browser */
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const { renderToString } = require('inferno-server');
const GoogleCSE = require('./google_cse');

const source = fs.readFileSync(path.join(__dirname, '../../../asset/js/google_cse.js'), 'utf8');

beforeEach(() => {
  jest.useFakeTimers();
  window.jQuery = $;
  document.body.innerHTML = renderToString(
    <GoogleCSE cx="invalid:engine" jsUrl="/google_cse.js" />,
  );
});

afterEach(() => {
  $(document).off('.googleSearch');
  delete window.google;
  delete window.loadSearchbox;
  document.head.innerHTML = '';
  jest.useRealTimers();
});

test('use theme responsiveness instead of Google mobile dividers and alternate pagination', () => {
  expect(
    document.querySelector('gcse\\:searchresults-only').getAttribute('mobilelayout'),
  ).toBe('disabled');
});

test('pasting or clearing the input executes or clears the search without a keydown', () => {
  expect(document.querySelector('.searchbox').classList.contains('searchbox-google')).toBe(true);
  expect(
    document.querySelector('.searchbox-header .fa-search').closest('[aria-hidden="true"]'),
  ).not.toBe(null);
  expect(document.querySelector('style')).toBe(null);
  const element = { execute: jest.fn(), clearAllResults: jest.fn() };
  window.google = { search: { cse: { element: { getElement: () => element } } } };
  window.loadSearchbox = () => ({ isCurrent: () => true });
  // eslint-disable-next-line no-new-func
  new Function(source)();
  $('.searchbox-input').val('lectures').trigger('input');
  jest.advanceTimersByTime(300);
  expect(element.execute).toHaveBeenCalledWith('lectures');
  $('.searchbox-input').val('').trigger('input');
  jest.advanceTimersByTime(300);
  expect(element.clearAllResults).toHaveBeenCalledTimes(1);
});

test('a rejected SDK shows an actionable error rather than an empty search box', () => {
  const loader = [...document.scripts].find((script) =>
    script.textContent.includes('cse.google.com'),
  );
  // eslint-disable-next-line no-new-func
  new Function(loader.textContent)();
  const sdk = [...document.scripts].find((script) =>
    script.src.startsWith('https://cse.google.com/'),
  );
  sdk.dispatchEvent(new Event('error'));
  const body = document.querySelector('.searchbox-body');
  expect(body.textContent).toMatch(/could not load/i);
  expect(body.textContent).toMatch(/cx/);
});
