/* eslint-env browser */
const vm = require('vm');
const { renderToString } = require('inferno-server');
const OutdatedBrowser = require('./outdated_browser');
const schema = require('../../schema/plugin/outdated_browser.json');

function render(props = {}) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(<OutdatedBrowser {...props} />);
  return container;
}

function run(
  container,
  css,
  createElement = document.createElement.bind(document),
  querySelector = document.querySelector.bind(document),
) {
  vm.runInNewContext(container.querySelector('script').textContent, {
    window: { CSS: css },
    document: {
      getElementById: (id) => container.querySelector('#' + id),
      createElement,
      querySelector,
    },
  });
}

test('No SDK, CDN helpers, UA sniffing, or head assets; boolean configuration stays compatible', () => {
  expect(render({ head: true }).children.length).toBe(0);
  const cdn = jest.fn();
  const html = renderToString(<OutdatedBrowser.Cacheable helper={{ cdn }} />);
  expect(cdn).not.toHaveBeenCalled();
  expect(html).not.toMatch(/<link|src=|outdatedbrowser|object-fit|userAgent/);
  expect(html).toContain('https://browsehappy.com/');
  expect(schema.type).toBe('boolean');
  expect(schema.default).toBe(false);
});

test('Direct use only requires the Flexbox baseline', () => {
  const container = render();
  const supports = jest.fn((property, value) => property === 'display' && value === 'flex');
  run(container, { supports });
  expect(container.querySelector('#outdated').style.display).toBe('none');
  expect(supports.mock.calls).toEqual([['display', 'flex']]);
});

const requiredFeatures = [
  ['display', 'grid'],
  ['position', 'sticky'],
];

test.each(['grid', 'sticky'])('Warns when required capability %s is missing', (missing) => {
  const container = render({ requiredFeatures });
  run(container, { supports: (property, value) => value !== missing });
  expect(container.querySelector('#outdated').style.display).toBe('block');
  expect(container.querySelector('#outdated').getAttribute('role')).toBe('status');
  expect(container.querySelector('#outdated').style.background).not.toContain('var(');
  container.querySelector('button').click();
  expect(container.querySelector('#outdated').style.display).toBe('none');
});

test('Cacheable forwards only the supplied required features', () => {
  const container = document.createElement('div');
  container.innerHTML = renderToString(
    <OutdatedBrowser.Cacheable requiredFeatures={requiredFeatures} />,
  );
  const supports = jest.fn(() => true);
  run(container, { supports });
  expect(container.querySelector('#outdated').style.display).toBe('none');
  expect(supports.mock.calls).toEqual(requiredFeatures);
});

test.each([undefined, {}])(
  'Without CSS.supports, parse actual declarations rather than warn unconditionally',
  (css) => {
    const container = render();
    run(container, css);
    expect(container.querySelector('#outdated').style.display).toBe('none');
    const unsupported = render();
    run(unsupported, css, () => ({ style: { setProperty() {}, getPropertyValue: () => '' } }));
    expect(unsupported.querySelector('#outdated').style.display).toBe('block');
  },
);

test('The fallback checks supplied property/value pairs', () => {
  const container = render({ requiredFeatures });
  const declarations = [];
  run(container, undefined, () => ({
    style: {
      setProperty(property, value) {
        declarations.push([property, value]);
      },
      getPropertyValue: () => 'accepted',
    },
  }));
  expect(declarations).toEqual(requiredFeatures);
  expect(container.querySelector('#outdated').style.display).toBe('none');
});

test.each([true, false])('Checks selector support with CSS.supports (%s)', (supported) => {
  const container = render({ requiredFeatures: [['selector', ':where(*)']] });
  const supports = jest.fn(() => supported);
  run(container, { supports });
  expect(supports).toHaveBeenCalledWith('selector(:where(*))');
  expect(container.querySelector('#outdated').style.display).toBe(supported ? 'none' : 'block');
});

test.each([true, false])(
  'Falls back to parsing selectors without CSS.supports (%s)',
  (supported) => {
    const container = render({ requiredFeatures: [['selector', ':where(*)']] });
    const querySelector = jest.fn(() => {
      if (!supported) throw new SyntaxError('Unsupported selector');
      return null;
    });
    run(container, undefined, undefined, querySelector);
    expect(querySelector).toHaveBeenCalledWith(':where(*)');
    expect(container.querySelector('#outdated').style.display).toBe(supported ? 'none' : 'block');
  },
);

test('A fresh page replacement can initialize without waiting for window.load', () => {
  const first = render();
  run(first, { supports: () => false });
  first.querySelector('button').click();
  const next = render({ requiredFeatures });
  run(next, { supports: () => false });
  expect(next.querySelector('#outdated').style.display).toBe('block');
  next.querySelector('button').click();
  expect(next.querySelector('#outdated').style.display).toBe('none');
});

test('Feature values cannot terminate the inline script', () => {
  expect(
    renderToString(<OutdatedBrowser requiredFeatures={[['color', '</script><script>alert(1)']]} />),
  ).not.toContain('</script><script>');
});
