/* eslint-env browser */
const { renderToString } = require('inferno-server');
const vm = require('vm');
const Mathjax = require('./mathjax');

test('Load the v4 bundle and separate font from the selected CDN or local provider', () => {
  const cdn = jest.fn((name, version, file) => `/vendor/${name}@${version}/${file}`);
  const container = document.createElement('div');
  container.innerHTML = renderToString(<Mathjax.Cacheable head={false} helper={{ cdn }} />);
  expect(cdn.mock.calls).toEqual([
    ['mathjax', '4.1.3', 'tex-mml-chtml.js'],
    ['@mathjax/mathjax-newcm-font', '4.1.3', 'chtml.js'],
  ]);
  const script = container.querySelector('#MathJax-script');
  expect(script.getAttribute('src')).toBe('/vendor/mathjax@4.1.3/tex-mml-chtml.js');
  expect(script.defer).toBe(true);
  const config = container.querySelector('script:not([src])').textContent;
  expect(config).toContain('window.MathJax = window.MathJax ||');
  expect(config).toContain('fontPath: "/vendor/@mathjax/mathjax-newcm-font@4.1.3"');
  expect(config).not.toContain('matchFontHeight');
  const window = {};
  vm.runInNewContext(config, { window });
  expect(window.MathJax.tex.inlineMath).toEqual([
    ['$', '$'],
    ['\\(', '\\)'],
  ]);
  expect(window.MathJax.output.font).toBe('mathjax-newcm');
  const renderer = window.MathJax;
  vm.runInNewContext(config, { window });
  expect(window.MathJax).toBe(renderer);
});

test('Keep the direct component compatible and escape font paths in inline scripts', () => {
  const html = renderToString(<Mathjax jsUrl="/mathjax/tex-mml-chtml.js" />);
  expect(html).not.toContain('fontPath:');
  expect(html).not.toContain('cdn.jsdelivr.net');
  expect(renderToString(<Mathjax jsUrl="/mathjax.js" fontPath="</script>" />)).toContain(
    '\\u003c/script>',
  );
});

test('Do not load MathJax in the head', () => {
  const cdn = jest.fn();
  const container = document.createElement('div');
  container.innerHTML = renderToString(<Mathjax.Cacheable head={true} helper={{ cdn }} />);
  expect(container.children).toHaveLength(0);
  expect(cdn).not.toHaveBeenCalled();
});
