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

test('Waline initializes with a classic script that PJAX can run again', async () => {
  const container = document.createElement('div');
  container.innerHTML = renderToString(
    <Waline serverURL="https://waline.example.com" path="'/post/'" jsUrl="/waline.js" />,
  );
  // PJAX only runs classic scripts, so the script must not be a module
  const script = container.querySelector('script');
  expect(script.hasAttribute('type')).toBe(false);

  // Run the script with the dynamic import replaced, since Jest cannot import the URL
  const code = script.textContent.replace('import(', 'loadWaline(');
  const loadWaline = (url) => {
    calls.push(['import', url]);
    return Promise.resolve({
      init: (options) => {
        calls.push(['init', options.el, options.serverURL, options.path]);
        return { destroy: () => calls.push(['destroy']) };
      },
    });
  };
  const run = async () => {
    // eslint-disable-next-line no-new-func
    await new Function('loadWaline', `return ${code}`)(loadWaline);
  };
  delete window.__walineInstance;
  await run();
  await run();
  expect(calls).toEqual([
    ['import', '/waline.js'],
    ['init', '#waline-thread', 'https://waline.example.com', '/post/'],
    ['import', '/waline.js'],
    ['destroy'],
    ['init', '#waline-thread', 'https://waline.example.com', '/post/'],
  ]);
});
