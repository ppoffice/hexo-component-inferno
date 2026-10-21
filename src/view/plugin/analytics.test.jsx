/* eslint-env browser */
const { renderToStaticMarkup } = require('inferno-server');
const { SchemaLoader } = require('../../core/schema');
const Umami = require('./umami');
const Matomo = require('./matomo');

function renderToDOM(element) {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

// Inferno renders null as a placeholder comment, so check that no script is rendered instead
function countScripts(element) {
  return renderToDOM(element).querySelectorAll('script').length;
}

function getSchema(name) {
  const def = require(`../../schema/plugin/${name}.json`);
  return SchemaLoader.load(def).getSchema(def.$id);
}

describe('Umami', () => {
  test('Render the tracker script', () => {
    const script = renderToDOM(
      <Umami.Cacheable head={true} plugin={{ website_id: 'id', domains: 'example.com' }} />,
    ).querySelector('script');
    expect(script.getAttribute('src')).toBe('https://cloud.umami.is/script.js');
    expect(script.getAttribute('data-website-id')).toBe('id');
    expect(script.getAttribute('data-domains')).toBe('example.com');
    expect(script.hasAttribute('defer')).toBe(true);
  });

  test('Use a self-hosted tracker script', () => {
    const script = renderToDOM(
      <Umami.Cacheable
        head={true}
        plugin={{ website_id: 'id', script_url: 'https://umami.example.com/script.js' }}
      />,
    ).querySelector('script');
    expect(script.getAttribute('src')).toBe('https://umami.example.com/script.js');
    expect(script.hasAttribute('data-domains')).toBe(false);
  });

  test('Render nothing outside <head> or without a website ID', () => {
    expect(countScripts(<Umami.Cacheable head={false} plugin={{ website_id: 'id' }} />)).toBe(0);
    expect(countScripts(<Umami.Cacheable head={true} plugin={{}} />)).toBe(0);
  });

  test('Schema', () => {
    const schema = getSchema('umami');
    expect(schema.validate({ website_id: 'id' })).toBe(true);
    expect(schema.validate({})).not.toBe(true);
  });
});

describe('Matomo', () => {
  beforeEach(() => {
    delete window._paq;
    document.head.innerHTML = '';
  });

  function run(plugin) {
    const container = renderToDOM(<Matomo.Cacheable head={true} plugin={plugin} />);
    // eslint-disable-next-line no-new-func
    new Function(container.querySelector('script').textContent)();
  }

  test('Track the page view and load the tracker', () => {
    run({ url: 'https://matomo.example.com', site_id: 1 });
    expect(window._paq).toEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'https://matomo.example.com/matomo.php'],
      ['setSiteId', '1'],
    ]);
    const script = document.head.querySelector('script');
    expect(script.getAttribute('src')).toBe('https://matomo.example.com/matomo.js');
    expect(script.async).toBe(true);
  });

  test('Disable cookies', () => {
    run({ url: 'https://matomo.example.com/', site_id: '2', disable_cookies: true });
    expect(window._paq[0]).toEqual(['disableCookies']);
    expect(window._paq).toContainEqual(['setSiteId', '2']);
  });

  test('Track pages switched to by PJAX', () => {
    const before = location.href;
    run({ url: 'https://matomo.example.com/', site_id: 1 });
    window._paq.length = 0;

    history.pushState(null, '', '/next/');
    document.title = 'Next';
    document.dispatchEvent(new Event('pjax:complete'));
    expect(window._paq).toEqual([
      ['setReferrerUrl', before],
      ['setCustomUrl', location.href],
      ['setDocumentTitle', 'Next'],
      ['trackPageView'],
      ['enableLinkTracking'],
    ]);
  });

  test('Render nothing outside <head> or without the URL and site ID', () => {
    const plugin = { url: 'https://matomo.example.com/', site_id: 1 };
    expect(countScripts(<Matomo.Cacheable head={false} plugin={plugin} />)).toBe(0);
    expect(countScripts(<Matomo.Cacheable head={true} plugin={{ site_id: 1 }} />)).toBe(0);
    expect(countScripts(<Matomo.Cacheable head={true} plugin={{ url: plugin.url }} />)).toBe(0);
  });

  test('Schema', () => {
    const schema = getSchema('matomo');
    expect(schema.validate({ url: 'https://matomo.example.com/', site_id: 1 })).toBe(true);
    expect(schema.validate({ url: 'https://matomo.example.com/', site_id: '1' })).toBe(true);
    expect(schema.validate({ url: 'https://matomo.example.com/' })).not.toBe(true);
  });
});
