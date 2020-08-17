const { renderToStaticMarkup } = require('inferno-server');
const { createElement } = require('inferno-create-element');
const { cacheComponent } = require('../util/cache');
const Example = require('../../fixture/layout/example');

test('The cached component can be successfully rendered', () => {
  const props = { subject: 'world' };
  const html = renderToStaticMarkup(createElement(Example, props));

  const CacheableExample = cacheComponent(Example, 'example', (p) => p);
  let htmlCached = renderToStaticMarkup(createElement(CacheableExample, props));
  expect(htmlCached).toBe(html);
  htmlCached = renderToStaticMarkup(createElement(CacheableExample, props));
  expect(htmlCached).toBe(html);

  const InvalidExample = cacheComponent(Example, 'example', (p) => null);
  htmlCached = renderToStaticMarkup(createElement(InvalidExample, props));
  expect(htmlCached).toBe('<!--!-->');
});
