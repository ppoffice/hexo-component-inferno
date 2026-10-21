/**
 * @jest-environment jsdom
 */
/* eslint-env browser */
const loadScripts = require('../util/script');

function run(urls, attrs) {
  // eslint-disable-next-line no-new-func
  new Function(loadScripts(urls, 'window.ran++;', attrs))();
}

function getScripts() {
  return Array.from(document.head.querySelectorAll('script'));
}

function fireLoad(script) {
  script.dispatchEvent(new Event('load'));
}

beforeEach(() => {
  document.head.innerHTML = '';
  window.ran = 0;
});

test('Load a script asynchronously and run the code after it is loaded', () => {
  run('/a.js', { charset: 'utf-8' });
  const scripts = getScripts();
  expect(scripts.length).toBe(1);
  expect(scripts[0].getAttribute('src')).toBe('/a.js');
  expect(scripts[0].async).toBe(true);
  expect(scripts[0].getAttribute('charset')).toBe('utf-8');
  expect(window.ran).toBe(0);

  fireLoad(scripts[0]);
  expect(scripts[0].getAttribute('data-loaded')).toBe('true');
  expect(window.ran).toBe(1);
});

test('Load multiple scripts in order', () => {
  run(['/a.js', '/b.js']);
  expect(getScripts().map((s) => s.getAttribute('src'))).toEqual(['/a.js']);

  fireLoad(getScripts()[0]);
  expect(getScripts().map((s) => s.getAttribute('src'))).toEqual(['/a.js', '/b.js']);
  expect(window.ran).toBe(0);

  fireLoad(getScripts()[1]);
  expect(window.ran).toBe(1);
});

test('Run the code right away when run again after the scripts are loaded', () => {
  run(['/a.js', '/b.js']);
  fireLoad(getScripts()[0]);
  fireLoad(getScripts()[1]);

  run(['/a.js', '/b.js']);
  expect(getScripts().length).toBe(2);
  expect(window.ran).toBe(2);
});

test('Do not add a script again when run again while it is loading', () => {
  run('/a.js');
  run('/a.js');
  expect(getScripts().length).toBe(1);

  fireLoad(getScripts()[0]);
  expect(window.ran).toBe(2);
});

test('Treat a script not added by the loader as loaded', () => {
  const script = document.createElement('script');
  script.setAttribute('src', '/a.js');
  document.head.appendChild(script);

  run('/a.js');
  expect(getScripts().length).toBe(1);
  expect(window.ran).toBe(1);
});
