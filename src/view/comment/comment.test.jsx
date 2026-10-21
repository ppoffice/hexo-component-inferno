/* eslint-env browser */
const { renderToString } = require('inferno-server');
const DisqusJs = require('./disqusjs');
const Gitalk = require('./gitalk');
const Gitment = require('./gitment');
const Twikoo = require('./twikoo');
const Valine = require('./valine');
const ChangYan = require('./changyan');
const Isso = require('./isso');
const Waline = require('./waline');

/**
 * Render a comment component, check that it does not block rendering, and run its inline script.
 * Scripts set with innerHTML are not run by the browser, so the inline script is run manually.
 */
function renderAndRun(element) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
  document.body.appendChild(container);

  const scripts = Array.from(container.querySelectorAll('script'));
  expect(scripts.filter((script) => script.hasAttribute('src'))).toEqual([]);
  container.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    expect(link.getAttribute('media')).toBe('print');
  });
  scripts.forEach((script) => {
    // eslint-disable-next-line no-new-func
    new Function(script.textContent)();
  });
}

/**
 * Get the external scripts added to <head>, define the globals they would define, and fire their
 * load events in order.
 */
function loadAddedScripts(globals = {}) {
  const urls = [];
  let script;
  while ((script = document.head.querySelector('script:not([data-loaded="true"])'))) {
    urls.push(script.getAttribute('src'));
    Object.assign(window, globals);
    script.dispatchEvent(new Event('load'));
    if (script.getAttribute('data-loaded') !== 'true') {
      break;
    }
  }
  return urls;
}

let calls;

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  calls = [];
});

test('DisqusJS', () => {
  renderAndRun(
    <DisqusJs
      shortname="name"
      apiKey="key"
      path="/post/"
      jsUrl="/disqusjs.js"
      cssUrl="/disqusjs.css"
    />,
  );
  expect(calls).toEqual([]);
  const urls = loadAddedScripts({
    DisqusJS: function (options) {
      calls.push(options);
    },
  });
  expect(urls).toEqual(['/disqusjs.js']);
  expect(calls).toEqual([
    { shortname: 'name', apikey: 'key', identifier: '/post/', url: '/post/' },
  ]);
});

test('Gitalk', () => {
  renderAndRun(
    <Gitalk
      id="id"
      repo="repo"
      owner="owner"
      admin={['admin']}
      clientId="client"
      clientSecret="secret"
      jsUrl="/gitalk.js"
      cssUrl="/gitalk.css"
    />,
  );
  expect(calls).toEqual([]);
  const urls = loadAddedScripts({
    Gitalk: function (options) {
      this.render = (el) => calls.push([options.id, el]);
    },
  });
  expect(urls).toEqual(['/gitalk.js']);
  expect(calls).toEqual([['id', 'comment-container']]);
});

test('Gitment', () => {
  renderAndRun(
    <Gitment id="id" repo="repo" owner="owner" clientId="client" clientSecret="secret" />,
  );
  const urls = loadAddedScripts({
    Gitment: function (options) {
      this.render = (el) => calls.push([options.id, el]);
    },
  });
  expect(urls).toEqual(['https://imsun.github.io/gitment/dist/gitment.browser.js']);
  expect(calls).toEqual([['id', 'comment-container']]);
});

test('Twikoo', () => {
  renderAndRun(<Twikoo envId="env" jsUrl="/twikoo.js" />);
  const urls = loadAddedScripts({ twikoo: { init: (options) => calls.push(options) } });
  expect(urls).toEqual(['/twikoo.js']);
  expect(calls).toEqual([{ envId: 'env' }]);
});

test('Valine loads LeanCloud before Valine', () => {
  renderAndRun(<Valine appId="id" appKey="key" jsUrl="/valine.js" />);
  const urls = loadAddedScripts({
    Valine: function (options) {
      calls.push(options.appId);
    },
  });
  expect(urls).toEqual(['//cdn.jsdelivr.net/npm/leancloud-storage@3/dist/av-min.js', '/valine.js']);
  expect(calls).toEqual(['id']);
});

test('ChangYan', () => {
  renderAndRun(<ChangYan appId="id" conf="conf" path="/post/" />);
  expect(document.head.querySelector('script').getAttribute('charset')).toBe('utf-8');
  const urls = loadAddedScripts({
    changyan: { api: { config: (options) => calls.push(options) } },
  });
  expect(urls).toEqual(['https://changyan.sohu.com/upload/changyan.js']);
  expect(calls).toEqual([{ appid: 'id', conf: 'conf' }]);
});

test('Run the inline script again after the library is loaded', () => {
  const element = <Twikoo envId="env" jsUrl="/twikoo.js" />;
  renderAndRun(element);
  loadAddedScripts({ twikoo: { init: (options) => calls.push(options) } });
  renderAndRun(element);
  expect(document.head.querySelectorAll('script').length).toBe(1);
  expect(calls).toEqual([{ envId: 'env' }, { envId: 'env' }]);
});

test('Isso adds a new script every time', () => {
  renderAndRun(<Isso url="isso.example.com" />);
  renderAndRun(<Isso url="isso.example.com" />);
  const scripts = Array.from(document.head.querySelectorAll('script'));
  expect(scripts.length).toBe(2);
  scripts.forEach((script) => {
    expect(script.getAttribute('src')).toBe('//isso.example.com/js/embed.min.js');
    expect(script.getAttribute('data-isso')).toBe('//isso.example.com');
    expect(script.async).toBe(true);
  });
});

/**
 * Render Waline, check that its script is a classic script that PJAX can run, and run the script with
 * the dynamic import replaced, since Jest cannot import the URL.
 */
function renderWaline(element) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
  const script = container.querySelector('script');
  // PJAX only runs classic scripts, so the script must not be a module
  expect(script.hasAttribute('type')).toBe(false);

  const code = script.textContent.replace('import(', 'loadWaline(');
  const loadWaline = (url) => {
    calls.push(['import', url]);
    return Promise.resolve({
      init: (options) => {
        calls.push(['init', options]);
        return { destroy: () => calls.push(['destroy']) };
      },
    });
  };
  // eslint-disable-next-line no-new-func
  return () => new Function('loadWaline', `return ${code}`)(loadWaline);
}

test('Waline destroys and initializes again when its script runs again', async () => {
  const run = renderWaline(
    <Waline serverURL="https://waline.example.com" path="'/post/'" jsUrl="/waline.js" />,
  );
  delete window.__walineInstance;
  await run();
  await run();
  expect(calls.map((call) => call[0])).toEqual(['import', 'init', 'import', 'destroy', 'init']);
  expect(calls[0][1]).toBe('/waline.js');
  expect(calls[1][1].el).toBe('#waline-thread');
  expect(calls[1][1].path).toBe('/post/');
});

describe('Waline options', () => {
  const helper = { cdn: (name, version, file) => `/cdn/${name}@${version}/${file}` };
  const page = {};
  const config = { language: 'en' };

  async function getInitOptions(comment) {
    delete window.__walineInstance;
    await renderWaline(
      <Waline.Cacheable comment={comment} helper={helper} page={page} config={config} />,
    )();
    expect(calls[0]).toEqual(['import', '/cdn/@waline/client@3.3.0/dist/waline.js']);
    return calls[1][1];
  }

  test('Default options', async () => {
    expect(await getInitOptions({ server_url: 'https://waline.example.com' })).toEqual({
      el: '#waline-thread',
      serverURL: 'https://waline.example.com',
      path: window.location.pathname,
      lang: 'en',
      emoji: ['https://cdn.jsdelivr.net/gh/walinejs/emojis/weibo'],
      meta: ['nick', 'mail', 'link'],
      requiredMeta: [],
      login: 'enable',
      pageSize: 10,
      imageUploader: false,
      highlighter: false,
      texRenderer: false,
      search: false,
      pageview: false,
      comment: false,
      copyright: true,
    });
  });

  test('Configured options', async () => {
    expect(
      await getInitOptions({
        server_url: 'https://waline.example.com',
        path: "'/custom/'",
        lang: 'zh-CN',
        locale: { placeholder: 'Hi' },
        emoji: ['/emoji'],
        dark: 'auto',
        meta: ['nick'],
        required_meta: ['nick'],
        login: 'force',
        word_limit: 100,
        page_size: 20,
        image_uploader: true,
        highlighter: true,
        tex_renderer: true,
        search: true,
        pageview: true,
        comment: true,
        copyright: false,
      }),
    ).toEqual({
      el: '#waline-thread',
      serverURL: 'https://waline.example.com',
      path: '/custom/',
      lang: 'zh-CN',
      locale: { placeholder: 'Hi' },
      emoji: ['/emoji'],
      dark: 'auto',
      meta: ['nick'],
      requiredMeta: ['nick'],
      login: 'force',
      wordLimit: 100,
      pageSize: 20,
      pageview: true,
      comment: true,
      copyright: false,
    });
  });

  test('Show an error without the server URL', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(
      <Waline.Cacheable comment={{}} helper={helper} page={page} config={config} />,
    );
    expect(container.querySelector('.notification.is-danger')).not.toBe(null);
    expect(container.querySelector('script')).toBe(null);
  });
});
