/* eslint-env browser */
const { renderToStaticMarkup } = require('inferno-server');
const { SchemaLoader } = require('../../core/schema');
const Umami = require('./umami');
const Matomo = require('./matomo');
const WalinePageview = require('./waline_pageview');

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

describe('Waline page view counter', () => {
  const helper = { cdn: (name, version, file) => `/cdn/${name}@${version}/${file}` };
  const waline = { comment: { type: 'waline', server_url: 'https://waline.example.com' } };

  function render(plugin, config = waline, head = false) {
    return renderToDOM(
      <WalinePageview.Cacheable head={head} plugin={plugin} config={config} helper={helper} />,
    ).querySelector('script');
  }

  test('Use the server of the Waline comments, or the configured server', () => {
    expect(render(true).textContent).toContain('"https://waline.example.com"');
    expect(render({ server_url: 'https://pv.example.com' }).textContent).toContain(
      '"https://pv.example.com"',
    );
  });

  test('Render nothing in <head>, when disabled, or without a server', () => {
    expect(render(true, waline, true)).toBe(null);
    expect(render(false)).toBe(null);
    expect(render(true, { comment: { type: 'giscus' } })).toBe(null);
  });

  test('Count the current page, and again after a PJAX page switch', async () => {
    const calls = [];
    const loadWaline = (url) =>
      Promise.resolve({
        pageviewCount: (options) => {
          calls.push(['count', url, options.serverURL, options.path]);
          return () => calls.push(['abort']);
        },
      });
    const jsUrl = '/cdn/@waline/client@3.3.0/dist/pageview.js';
    const path = window.location.pathname;
    const code = render(true).textContent.replace('import(', 'loadWaline(');
    // eslint-disable-next-line no-new-func
    new Function('loadWaline', code)(loadWaline);
    await Promise.resolve();
    expect(calls).toEqual([['count', jsUrl, 'https://waline.example.com', path]]);

    history.pushState(null, '', '/another/');
    document.dispatchEvent(new Event('pjax:complete'));
    await Promise.resolve();
    expect(calls.slice(1)).toEqual([
      ['abort'],
      ['count', jsUrl, 'https://waline.example.com', '/another/'],
    ]);
  });

  test('Schema', () => {
    const schema = getSchema('waline_pageview');
    expect(schema.validate(true)).toBe(true);
    expect(schema.validate({ server_url: 'https://pv.example.com' })).toBe(true);
    expect(schema.validate('yes')).not.toBe(true);
    expect(schema.getDefaultValue().value).toBe(false);
  });
});
