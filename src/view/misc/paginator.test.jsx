const Paginator = require('./paginator');
const { renderIntoContainer, findRenderedDOMElementWithClass } = require('inferno-test-utils');

function renderPaginator(current, total) {
  const paginator = renderIntoContainer(
    <Paginator
      current={current}
      total={total}
      baseUrl="/"
      path="page"
      urlFor={(url) => url}
      prevTitle="Prev"
      nextTitle="Next"
    />,
  );
  return {
    prev: findRenderedDOMElementWithClass(paginator, 'pagination-previous').querySelector('a'),
    next: findRenderedDOMElementWithClass(paginator, 'pagination-next').querySelector('a'),
  };
}

test('Link prev and next buttons to adjacent pages', () => {
  const { prev, next } = renderPaginator(2, 3);
  expect(prev.getAttribute('href')).toBe('/');
  expect(next.getAttribute('href')).toBe('/page/3/');
});

test('Do not link the hidden prev button on the first page', () => {
  const { prev, next } = renderPaginator(1, 3);
  expect(prev.hasAttribute('href')).toBe(false);
  expect(next.getAttribute('href')).toBe('/page/2/');
});

test('Do not link the hidden next button on the last page', () => {
  const { prev, next } = renderPaginator(3, 3);
  expect(prev.getAttribute('href')).toBe('/page/2/');
  expect(next.hasAttribute('href')).toBe(false);
});

test('Do not link either button when there is only one page', () => {
  const { prev, next } = renderPaginator(1, 1);
  expect(prev.hasAttribute('href')).toBe(false);
  expect(next.hasAttribute('href')).toBe(false);
});
