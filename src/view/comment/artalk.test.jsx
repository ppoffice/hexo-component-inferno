/* eslint-env browser */
const { renderToString } = require('inferno-server');
const Artalk = require('./artalk');
const { SchemaLoader } = require('../../core/schema');
const schema = require('../../schema/comment/artalk.json');

function render(props) {
  const root = document.createElement('div');
  root.innerHTML = renderToString(
    <Artalk
      server="https://comments.example.com"
      jsUrl="/Artalk.js"
      cssUrl="/Artalk.css"
      {...props}
    />,
  );
  document.body.appendChild(root);
  // eslint-disable-next-line no-new-func
  new Function(root.querySelector('script').textContent)();
  return root;
}

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-appearance');
  window.__artalkInstance = null;
  window.Artalk = {
    init: jest.fn(() => {
      const handlers = {};
      return {
        on: jest.fn((name, handler) => {
          handlers[name] = handler;
        }),
        update: jest.fn(),
        destroy: jest.fn(() => {
          if (handlers.unmounted) handlers.unmounted();
        }),
      };
    }),
  };
});

afterEach(() => {
  if (window.__artalkInstance) window.__artalkInstance.destroy();
});

test('pins the matching full client and stylesheet', () => {
  const cdn = jest.fn(() => '/asset');
  renderToString(
    <Artalk.Cacheable
      comment={{ server: 'https://comments.example.com' }}
      page={{ title: 'Post' }}
      helper={{ cdn }}
    />,
  );
  expect(cdn).toHaveBeenCalledWith('artalk', '2.10.0', 'dist/Artalk.js');
  expect(cdn).toHaveBeenCalledWith('artalk', '2.10.0', 'dist/Artalk.css');
});

test.each(['zh-TW', 'ja-JP', 'ko', 'fr', 'ru', 'tr-TR', 'auto'])(
  'loads the published external locale dictionaries for %s before initialization',
  (locale) => {
    const cdn = jest.fn((name, version, file) => '/' + file);
    const html = renderToString(
      <Artalk.Cacheable
        comment={{ server: 'https://comments.example.com', locale }}
        page={{ title: 'Locale fixture' }}
        helper={{ cdn }}
      />,
    );
    const external = cdn.mock.calls.filter((args) => args[2].startsWith('dist/i18n/'));
    expect(external).toHaveLength(locale === 'auto' ? 6 : 1);
    external.forEach((args) => expect(args[1]).toBe('2.10.0'));
    expect(html.indexOf('/dist/Artalk.js')).toBeLessThan(html.indexOf('/dist/i18n/'));
  },
);

test.each(['en', 'zh-CN', 'zh-TW', 'auto'])(
  'preserves locale %s, page identity and remote priority',
  (locale) => {
    render({
      locale,
      site: 'Blog',
      pageKey: '/post/',
      pageTitle: '</script>',
      preferRemoteConf: true,
      darkMode: false,
    });
    document.head.querySelector('script').dispatchEvent(new Event('load'));
    expect(window.Artalk.init).toHaveBeenCalledWith({
      el: '#artalk-thread',
      server: 'https://comments.example.com',
      site: 'Blog',
      pageKey: '/post/',
      pageTitle: '</script>',
      locale,
      preferRemoteConf: true,
      darkMode: false,
    });
  },
);

test('delayed SDK loading ignores detached PJAX pages and only initializes the current page', () => {
  render({ pageKey: '/old/' }).remove();
  render({ pageKey: '/new/' });
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(window.Artalk.init).toHaveBeenCalledTimes(1);
  expect(window.Artalk.init.mock.calls[0][0].pageKey).toBe('/new/');
  const old = window.__artalkInstance;
  document.body.innerHTML = '';
  render({ pageKey: '/third/' });
  expect(old.destroy).toHaveBeenCalledTimes(1);
  expect(document.head.querySelectorAll('script')).toHaveLength(1);
});

test('waits for the locale script and ignores a page removed while it loads', () => {
  const first = render({ locale: 'zh-TW', localeUrls: ['/zh-TW.js'] });
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(window.Artalk.init).not.toHaveBeenCalled();
  first.remove();
  render({ locale: 'zh-TW', localeUrls: ['/zh-TW.js'], pageKey: '/current/' });
  document.head.querySelector('script[src="/zh-TW.js"]').dispatchEvent(new Event('load'));
  expect(window.Artalk.init).toHaveBeenCalledTimes(1);
  expect(window.Artalk.init.mock.calls[0][0].pageKey).toBe('/current/');
});

test('follows manual appearance changes and disconnects its observer on destroy', async () => {
  render({});
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  const instance = window.__artalkInstance;
  document.documentElement.setAttribute('data-appearance', 'dark');
  await Promise.resolve();
  expect(instance.update).toHaveBeenLastCalledWith({ darkMode: true });
  document.documentElement.setAttribute('data-appearance', 'auto');
  await Promise.resolve();
  expect(instance.update).toHaveBeenLastCalledWith({ darkMode: 'auto' });
  instance.destroy();
  instance.update.mockClear();
  document.documentElement.setAttribute('data-appearance', 'light');
  await Promise.resolve();
  expect(instance.update).not.toHaveBeenCalled();
});

test('explicit dark mode does not follow the page appearance', async () => {
  render({ darkMode: false });
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  document.documentElement.setAttribute('data-appearance', 'dark');
  await Promise.resolve();
  expect(window.__artalkInstance.on).not.toHaveBeenCalled();
  expect(window.__artalkInstance.update).not.toHaveBeenCalled();
});

test('validates the optional configuration priority switch', () => {
  const loaded = SchemaLoader.load(schema).getSchema(schema.$id);
  expect(
    loaded.validate({
      type: 'artalk',
      server: 'https://comments.example.com',
      prefer_remote_conf: true,
    }),
  ).toBe(true);
  expect(
    loaded.validate({
      type: 'artalk',
      server: 'https://comments.example.com',
      prefer_remote_conf: 'true',
    }),
  ).not.toBe(true);
});
