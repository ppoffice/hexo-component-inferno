const Toc = require('./toc');
const { renderIntoContainer, scryRenderedDOMElementsWithClass } = require('inferno-test-utils');

function createTocAndGetLevels(content, options = {}) {
  const widget = renderIntoContainer(<Toc content={content} {...options} />);
  return scryRenderedDOMElementsWithClass(widget, 'level-item').map((item) => item.innerHTML);
}

test('Correctly render headings', () => {
  const levels = createTocAndGetLevels(`
    <h1>Title 1</h1>
    <h2>Title 1.1</h2>
    <h3>Title 1.1.1</h3>
    <h3>Title 1.1.2</h3>
    <h2>Title 1.2</h2>
    <h3>Title 1.2.1</h3>
    <h3>Title 1.2.2</h3>
    <h1>Title 2</h1>
    <h2>Title 2.1</h2>
    <h2>Title 2.2</h2>
    <h3>Title 2.2.1</h3>
    <h3>Title 2.2.2</h3>
  `);

  expect(levels).toEqual([
    '1',
    'Title 1',
    '1.1',
    'Title 1.1',
    '1.1.1',
    'Title 1.1.1',
    '1.1.2',
    'Title 1.1.2',
    '1.2',
    'Title 1.2',
    '1.2.1',
    'Title 1.2.1',
    '1.2.2',
    'Title 1.2.2',
    '2',
    'Title 2',
    '2.1',
    'Title 2.1',
    '2.2',
    'Title 2.2',
    '2.2.1',
    'Title 2.2.1',
    '2.2.2',
    'Title 2.2.2',
  ]);
});

test('Correctly render disjunct levels of heading', () => {
  const levels = createTocAndGetLevels(`
    <h2>Title 1</h2>
    <h2>Title 2</h2>
    <h4>Title 2.1</h4>
    <h4>Title 2.2</h4>
    <h4>Title 2.3</h4>
    <h2>Title 3</h2>
  `);

  expect(levels).toEqual([
    '1',
    'Title 1',
    '2',
    'Title 2',
    '2.1',
    'Title 2.1',
    '2.2',
    'Title 2.2',
    '2.3',
    'Title 2.3',
    '3',
    'Title 3',
  ]);
});
