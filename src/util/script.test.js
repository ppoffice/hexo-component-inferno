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

test('Add a script with attributes to an element on the next tick', () => {
  jest.useFakeTimers();
  document.body.innerHTML = '<div id="thread"></div>';
  // eslint-disable-next-line no-new-func
  new Function(loadScripts.appendScript('#thread', '/client.js', { repo: 'user/repo' }))();
  expect(document.querySelector('#thread script')).toBe(null);
  jest.runAllTimers();
  jest.useRealTimers();
  const script = document.querySelector('#thread script');
  expect(script.getAttribute('src')).toBe('/client.js');
  expect(script.getAttribute('repo')).toBe('user/repo');
  expect(script.async).toBe(true);
});

test('Do nothing without the element', () => {
  document.body.innerHTML = '';
  // eslint-disable-next-line no-new-func
  new Function(loadScripts.appendScript('#thread', '/client.js', {}))();
  expect(document.querySelectorAll('script').length).toBe(0);
});

test('Convert values to JavaScript that cannot end the inline script', () => {
  const value = { title: 'A </script><script>alert(1)</script>', text: 'a\u2028b\u2029c' };
  const code = loadScripts.toJs(value);
  expect(code).not.toMatch(/<|\u2028|\u2029/);
  // eslint-disable-next-line no-new-func
  expect(new Function(`return ${code}`)()).toEqual(value);
});
