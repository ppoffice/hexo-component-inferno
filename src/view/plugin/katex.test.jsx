/* eslint-env browser */
const { renderToString } = require('inferno-server');
const KaTeX = require('./katex');

test('Use one KaTeX release for core, CSS, auto-render and mhchem, in deferred script order', () => {
  const cdn = jest.fn((name, version, file) => `https://cdn.example/${name}@${version}/${file}`);
  const container = document.createElement('div');
  container.innerHTML = renderToString(<KaTeX.Cacheable head={false} helper={{ cdn }} />);
  expect(cdn.mock.calls).toEqual([
    ['katex', '0.19.1', 'dist/katex.min.js'],
    ['katex', '0.19.1', 'dist/katex.min.css'],
    ['katex', '0.19.1', 'dist/contrib/auto-render.min.js'],
    ['katex', '0.19.1', 'dist/contrib/mhchem.min.js'],
  ]);
  expect(container.querySelector('link').getAttribute('href')).toBe(cdn.mock.results[1].value);
  const scripts = Array.from(container.querySelectorAll('script[src]'));
  expect(scripts.map((script) => script.getAttribute('src'))).toEqual([
    cdn.mock.results[0].value,
    cdn.mock.results[2].value,
    cdn.mock.results[3].value,
  ]);
  expect(scripts.every((script) => script.defer)).toBe(true);
  expect(container.querySelector('script:not([src])').textContent).toContain('renderMathInElement(element);');
});

test('Do not load KaTeX in the head', () => {
  const cdn = jest.fn();
  const container = document.createElement('div');
  container.innerHTML = renderToString(<KaTeX.Cacheable head={true} helper={{ cdn }} />);
  expect(container.children).toHaveLength(0);
  expect(cdn).not.toHaveBeenCalled();
});
