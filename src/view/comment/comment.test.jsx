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
const Giscus = require('./giscus');
const Utterances = require('./utterances');
const Beaudar = require('./beaudar');
const Artalk = require('./artalk');
const Cusdis = require('./cusdis');
const Disqus = require('./disqus');
const Facebook = require('./facebook');
const { SchemaLoader } = require('../../core/schema');

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
      proxy="https://proxy.example.test"
      cssUrl="/gitalk.css"
    />,
  );
  expect(calls).toEqual([]);
  const urls = loadAddedScripts({
    Gitalk: function (options) {
      this.render = (el) => calls.push([options.id, el]);
      this.destroy = () => {};
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
      dark: 'html[data-appearance="dark"]',
      meta: ['nick', 'mail', 'link'],
      requiredMeta: [],
      login: 'enable',
      pageSize: 10,
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
      imageUploader: false,
      highlighter: false,
      texRenderer: false,
      search: false,
      pageview: true,
      comment: true,
      copyright: false,
    });
  });

  test('Keep the features that are not disabled', async () => {
    const options = await getInitOptions({
      server_url: 'https://waline.example.com',
      image_uploader: false,
      highlighter: false,
      tex_renderer: false,
      search: false,
    });
    expect(Object.keys(options)).not.toContain('imageUploader');
    expect(Object.keys(options)).not.toContain('highlighter');
    expect(Object.keys(options)).not.toContain('texRenderer');
    expect(Object.keys(options)).not.toContain('search');
  });

  test('Use a path or a JavaScript expression', async () => {
    const options = await getInitOptions({
      server_url: 'https://waline.example.com',
      path: '/posts/hello/',
    });
    expect(options.path).toBe('/posts/hello/');
    calls = [];
    expect(
      (await getInitOptions({ server_url: 'https://waline.example.com', path: "'/a/' + 'b/'" }))
        .path,
    ).toBe('/a/b/');
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

describe('Waline dark mode', () => {
  afterEach(() => document.documentElement.removeAttribute('data-appearance'));

  async function getDark(appearance, props = {}) {
    if (appearance) {
      document.documentElement.setAttribute('data-appearance', appearance);
    }
    delete window.__walineInstance;
    await renderWaline(
      <Waline serverURL="https://waline.example.com" jsUrl="/waline.js" {...props} />,
    )();
    return calls[1][1].dark;
  }

  test('Follow the appearance of the page if not set', async () => {
    expect(await getDark(null)).toBe('html[data-appearance="dark"]');
    expect(await getDark('dark')).toBe('html[data-appearance="dark"]');
    calls = [];
    expect(await getDark('auto')).toBe('auto');
  });

  test('Keep the configured value', async () => {
    expect(await getDark('auto', { dark: false })).toBe(false);
    calls = [];
    expect(await getDark('auto', { dark: '.dark' })).toBe('.dark');
  });
});

/**
 * Render a comment component that adds its client script to a thread element, run its inline script
 * with the given appearance, and get the client script from the thread element.
 */
function renderClientScript(element, thread, appearance, prefersDark = false) {
  if (appearance) {
    document.documentElement.setAttribute('data-appearance', appearance);
  }
  window.matchMedia = (query) => ({ matches: query.includes('dark') && prefersDark });
  jest.useFakeTimers();
  renderAndRun(element);
  // The client script is added after the inline script has finished
  expect(document.querySelector(`${thread} > script[src]`)).toBe(null);
  jest.runAllTimers();
  jest.useRealTimers();
  const script = document.querySelector(`${thread} > script[src]`);
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-appearance');
  delete window.matchMedia;
  return script;
}

describe('Giscus', () => {
  const props = { repo: 'user/repo', repoId: 'R_1', categoryId: 'C_1' };
  const theme = (element, ...args) =>
    renderClientScript(element, 'head', ...args).getAttribute('data-theme');

  test('Render the giscus element, and add the client script with its attributes to <head>', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Giscus {...props} />);
    expect(container.querySelector('#giscus-thread.giscus')).not.toBe(null);

    const script = renderClientScript(
      <Giscus {...props} mapping="specific" term="Welcome" />,
      'head',
    );
    expect(script.getAttribute('src')).toBe('https://giscus.app/client.js');
    expect(script.getAttribute('data-repo')).toBe('user/repo');
    expect(script.getAttribute('data-repo-id')).toBe('R_1');
    expect(script.getAttribute('data-category-id')).toBe('C_1');
    expect(script.getAttribute('data-mapping')).toBe('specific');
    expect(script.getAttribute('data-term')).toBe('Welcome');
    expect(script.getAttribute('crossorigin')).toBe('anonymous');
    expect(script.async).toBe(true);
  });

  test('Choose the theme by the appearance of the page', () => {
    expect(theme(<Giscus {...props} />)).toBe('noborder_light');
    expect(theme(<Giscus {...props} />, 'dark')).toBe('noborder_dark');
    expect(theme(<Giscus {...props} />, 'auto', false)).toBe('noborder_light');
    expect(theme(<Giscus {...props} />, 'auto', true)).toBe('noborder_dark');
    expect(theme(<Giscus {...props} theme="light" darkTheme="dark_dimmed" />, 'dark')).toBe(
      'dark_dimmed',
    );
  });

  test('Always use the custom theme', () => {
    expect(theme(<Giscus {...props} theme="custom" customThemeCss="/giscus.css" />, 'dark')).toBe(
      '/giscus.css',
    );
  });
});

describe('Utterances', () => {
  const props = { repo: 'user/repo', issueTerm: 'pathname' };

  test('Add the client script with its attributes to the thread element', () => {
    const script = renderClientScript(<Utterances {...props} />, '#utterances-thread');
    expect(script.getAttribute('src')).toBe('https://utteranc.es/client.js');
    expect(script.getAttribute('repo')).toBe('user/repo');
    expect(script.getAttribute('issue-term')).toBe('pathname');
    expect(script.getAttribute('crossorigin')).toBe('anonymous');
  });

  test('Choose the theme by the appearance of the page', () => {
    const theme = (element, ...args) =>
      renderClientScript(element, '#utterances-thread', ...args).getAttribute('theme');
    expect(theme(<Utterances {...props} />)).toBe('github-light');
    expect(theme(<Utterances {...props} />, 'dark')).toBe('github-dark');
    expect(
      theme(<Utterances {...props} theme="github-light" darkTheme="icy-dark" />, 'auto', true),
    ).toBe('icy-dark');
  });
});

describe('Beaudar', () => {
  const props = { repo: 'user/repo', branch: 'main', issueTerm: 'pathname', label: 'comment' };

  test('Add the client script with its attributes to the thread element', () => {
    const script = renderClientScript(<Beaudar {...props} />, '#beaudar-thread');
    expect(script.getAttribute('src')).toBe('https://beaudar.lipk.org/client.js');
    expect(script.getAttribute('repo')).toBe('user/repo');
    expect(script.getAttribute('branch')).toBe('main');
    expect(script.getAttribute('issue-term')).toBe('pathname');
    expect(script.getAttribute('label')).toBe('comment');
    expect(script.getAttribute('crossorigin')).toBe('anonymous');
  });

  test('Choose the theme by the appearance of the page', () => {
    const theme = (element, ...args) =>
      renderClientScript(element, '#beaudar-thread', ...args).getAttribute('theme');
    expect(theme(<Beaudar {...props} />)).toBe('github-light');
    expect(theme(<Beaudar {...props} />, 'dark')).toBe('github-dark');
    expect(theme(<Beaudar {...props} darkTheme="icy-dark" />, 'auto', true)).toBe('icy-dark');
  });

  test('Show an error without the repository', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Beaudar issueTerm="pathname" />);
    expect(container.querySelector('.notification.is-danger')).not.toBe(null);
  });
});

describe('Artalk', () => {
  const props = {
    server: 'https://artalk.example.com',
    jsUrl: '/artalk.js',
    cssUrl: '/artalk.css',
  };
  const Artalk_ = {
    init: (options) => {
      calls.push(['init', options]);
      return { destroy: () => calls.push(['destroy']) };
    },
  };

  afterEach(() => {
    delete window.__artalkInstance;
    document.documentElement.removeAttribute('data-appearance');
  });

  test('Load Artalk and initialize it, and destroy the previous instance', () => {
    const element = <Artalk {...props} site="Blog" pageTitle="Post" locale="en" />;
    renderAndRun(element);
    expect(calls).toEqual([]);
    expect(loadAddedScripts({ Artalk: Artalk_ })).toEqual(['/artalk.js']);
    expect(calls).toEqual([
      [
        'init',
        {
          el: '#artalk-thread',
          server: 'https://artalk.example.com',
          site: 'Blog',
          pageTitle: 'Post',
          locale: 'en',
          darkMode: false,
        },
      ],
    ]);
    // Run again, e.g., by PJAX
    renderAndRun(element);
    expect(calls.map((call) => call[0])).toEqual(['init', 'destroy', 'init']);
  });

  test('Follow the appearance of the page if dark_mode is not set', () => {
    const darkMode = (appearance, extra = {}) => {
      calls = [];
      document.documentElement.setAttribute('data-appearance', appearance);
      window.Artalk = Artalk_;
      renderAndRun(<Artalk {...props} {...extra} />);
      loadAddedScripts({ Artalk: Artalk_ });
      return calls.find((call) => call[0] === 'init')[1].darkMode;
    };
    expect(darkMode('dark')).toBe(true);
    expect(darkMode('auto')).toBe('auto');
    expect(darkMode('dark', { darkMode: false })).toBe(false);
  });

  test('Show an error without the server', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Artalk jsUrl="/artalk.js" />);
    expect(container.querySelector('.notification.is-danger')).not.toBe(null);
  });
});

describe('Cusdis', () => {
  const props = { appId: 'app', pageId: '/post/', pageUrl: 'https://example.com/post/' };

  afterEach(() => {
    delete window.renderCusdis;
    document.documentElement.removeAttribute('data-appearance');
  });

  test('Load the Cusdis script, which renders the thread element', () => {
    renderAndRun(<Cusdis {...props} lang="zh-cn" />);
    const thread = document.getElementById('cusdis_thread');
    expect(thread.getAttribute('data-host')).toBe('https://cusdis.com');
    expect(thread.getAttribute('data-app-id')).toBe('app');
    expect(thread.getAttribute('data-page-id')).toBe('/post/');
    expect(thread.getAttribute('data-page-url')).toBe('https://example.com/post/');
    expect(thread.getAttribute('data-theme')).toBe('light');
    expect(loadAddedScripts()).toEqual([
      'https://cusdis.com/js/widget/lang/zh-cn.js',
      'https://cusdis.com/js/cusdis.es.js',
    ]);
  });

  test('Render the thread element directly when the script is already loaded', () => {
    window.renderCusdis = (element) => calls.push(element.id);
    renderAndRun(<Cusdis {...props} host="https://cusdis.example.com" />);
    expect(calls).toEqual(['cusdis_thread']);
    expect(document.head.querySelectorAll('script').length).toBe(0);
  });

  test('Follow the appearance of the page if theme is not set', () => {
    const theme = (appearance, extra = {}) => {
      document.body.innerHTML = '';
      document.documentElement.setAttribute('data-appearance', appearance);
      renderAndRun(<Cusdis {...props} {...extra} />);
      return document.getElementById('cusdis_thread').getAttribute('data-theme');
    };
    expect(theme('dark')).toBe('dark');
    expect(theme('auto')).toBe('auto');
    expect(theme('auto', { theme: 'light' })).toBe('light');
  });
});

test('Schemas of the new comment plugins', () => {
  const validate = (name, config) => {
    const def = require(`../../schema/comment/${name}.json`);
    return SchemaLoader.load(def).getSchema(def.$id).validate(config);
  };
  expect(validate('artalk', { type: 'artalk', server: 'https://artalk.example.com' })).toBe(true);
  expect(validate('artalk', { type: 'artalk' })).not.toBe(true);
  expect(validate('cusdis', { type: 'cusdis', app_id: 'app' })).toBe(true);
  expect(validate('cusdis', { type: 'cusdis', app_id: 'app', theme: 'blue' })).not.toBe(true);
  expect(validate('beaudar', { type: 'beaudar', repo: 'user/repo', issue_term: 'pathname' })).toBe(
    true,
  );
  expect(validate('beaudar', { type: 'beaudar', repo: 'user/repo' })).not.toBe(true);
});

describe('Configuration of the comment plugins', () => {
  const helper = {
    cdn: (name, version, file) => `/cdn/${name}@${version}/${file}`,
    url_for: (url) => `/blog/${url}`,
  };
  const page = { path: 'post/', permalink: 'https://example.com/blog/post/', title: 'Post' };

  function renderCacheable(Component, comment) {
    const container = document.createElement('div');
    container.innerHTML = renderToString(
      <Component.Cacheable comment={comment} helper={helper} page={page} config={{}} />,
    );
    return container;
  }

  function getError(Component, props) {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Component {...props} />);
    const error = container.querySelector('.notification.is-danger');
    return error ? error.textContent : null;
  }

  test('Giscus', () => {
    const container = renderCacheable(Giscus, {
      repo: 'user/repo',
      repoId: 'R_1',
      category: 'General',
      categoryId: 'C_1',
      mapping: 'title',
      strict: true,
      reactionsEnabled: true,
      emitMetadata: true,
      inputPosition: 'bottom',
      theme: 'light',
      darkTheme: 'dark',
      lang: 'zh-CN',
      lazy: true,
    });
    const js = container.querySelector('script').textContent;
    for (const value of [
      '"data-category":"General"',
      '"data-mapping":"title"',
      '"data-strict":1',
      '"data-reactions-enabled":1',
      '"data-emit-metadata":1',
      '"data-input-position":"bottom"',
      '"data-lang":"zh-CN"',
      '"data-loading":"lazy"',
      '"dark" : "light"',
    ]) {
      expect(js).toContain(value);
    }

    const props = { repo: 'user/repo', repoId: 'R_1', categoryId: 'C_1' };
    expect(getError(Giscus, { repo: 'user/repo' })).toContain('repoId');
    expect(getError(Giscus, { ...props, mapping: 'number' })).toContain('term');
    expect(getError(Giscus, { ...props, theme: 'custom' })).toContain('customThemeCss');
  });

  test('Utterances and Beaudar', () => {
    for (const [Component, thread] of [
      [Utterances, '#utterances-thread'],
      [Beaudar, '#beaudar-thread'],
    ]) {
      const comment = {
        repo: 'user/repo',
        issue_number: 1,
        label: 'comment',
        dark_theme: 'icy-dark',
      };
      const js = renderCacheable(Component, comment).querySelector('script').textContent;
      expect(js).toContain(`document.querySelector("${thread}")`);
      expect(js).toContain('"issue-number":1');
      expect(js).toContain('"label":"comment"');
      expect(js).toContain('"icy-dark"');
      expect(getError(Component, { repo: 'user/repo' })).toContain('issue_term');
    }
  });

  test('Artalk', () => {
    const container = renderCacheable(Artalk, {
      server: 'https://artalk.example.com',
      site: 'Blog',
      page_key: '/post/',
      locale: 'en',
      dark_mode: 'auto',
    });
    const js = container.querySelector('script').textContent;
    expect(js).toContain('"/cdn/artalk@2.9.1/dist/Artalk.js"');
    expect(js).toContain('pageKey: "/post/"');
    expect(js).toContain('pageTitle: "Post"');
    expect(js).toContain('darkMode: "auto"');
    expect(container.querySelector('link').getAttribute('href')).toBe(
      '/cdn/artalk@2.9.1/dist/Artalk.css',
    );
  });

  test('Cusdis', () => {
    const thread = renderCacheable(Cusdis, {
      app_id: 'app',
      host: 'https://cusdis.example.com/',
      theme: 'dark',
    }).querySelector('#cusdis_thread');
    expect(thread.getAttribute('data-host')).toBe('https://cusdis.example.com');
    expect(thread.getAttribute('data-page-id')).toBe('/blog/post/');
    expect(thread.getAttribute('data-page-url')).toBe('https://example.com/blog/post/');
    expect(thread.getAttribute('data-page-title')).toBe('Post');
    expect(getError(Cusdis, {})).toContain('app_id');
  });
});

describe('Page values in the inline scripts', () => {
  const helper = { cdn: (name, version, file) => `/cdn/${name}@${version}/${file}` };
  const title = 'Why </script><img src=x onerror=alert(1)> breaks';
  const permalink = "https://example.com/2024/it's-alive/";
  const page = { title, path: "2024/it's-alive/", permalink };

  test.each([
    [
      'Artalk',
      <Artalk.Cacheable
        comment={{ server: 'https://artalk.example.com' }}
        helper={helper}
        page={page}
      />,
      'Why \\u003c/script>',
    ],
    [
      'DisqusJS',
      <DisqusJs.Cacheable
        comment={{ shortname: "it's", api_key: 'key' }}
        helper={helper}
        page={page}
        config={{ title }}
      />,
    ],
    ['Disqus', <Disqus.Cacheable comment={{ shortname: 'name' }} page={page} />],
  ])('%s', (name, element, kept = "it's") => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    expect(container.querySelector('img')).toBe(null);
    const scripts = container.querySelectorAll('script');
    expect(scripts.length).toBe(1);
    // The script parses, and keeps the values
    // eslint-disable-next-line no-new-func
    expect(() => new Function(scripts[0].textContent)).not.toThrow();
    expect(scripts[0].textContent).toContain(kept);
  });
});

describe('Options and missing settings', () => {
  const helper = { cdn: (name, version, file) => `/cdn/${name}@${version}/${file}` };
  const gitalk = {
    repo: 'r',
    owner: 'o',
    admin: ['o'],
    client_id: 'i',
    proxy: 'https://proxy.example.test',
  };

  function render(element) {
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    return container;
  }

  test('Gitalk hotkeys are enabled unless disabled', () => {
    const page = { path: 'post/' };
    const script = (comment) =>
      render(<Gitalk.Cacheable comment={comment} helper={helper} page={page} />).querySelector(
        'script',
      ).textContent;
    expect(script(gitalk)).toContain('enableHotKey: true');
    expect(script({ ...gitalk, enable_hotkey: false })).toContain('enableHotKey: false');
  });

  test('Isso URL with or without the protocol', () => {
    for (const url of ['isso.example.com', 'https://isso.example.com/', '//isso.example.com']) {
      renderAndRun(<Isso url={url} />);
    }
    Array.from(document.head.querySelectorAll('script')).forEach((script) => {
      expect(script.getAttribute('src')).toBe('//isso.example.com/js/embed.min.js');
      expect(script.getAttribute('data-isso')).toBe('//isso.example.com');
    });
  });

  test('Show an error without the Twikoo environment ID or the DisqusJS API key', () => {
    expect(render(<Twikoo jsUrl="/twikoo.js" />).querySelector('.is-danger')).not.toBe(null);
    expect(
      render(<DisqusJs shortname="name" jsUrl="/disqusjs.js" />).querySelector('.is-danger'),
    ).not.toBe(null);
  });

  test('Facebook loads the current SDK once, including navigation while it is loading', () => {
    const element = (
      <Facebook.Cacheable config={{ language: 'en' }} page={{ permalink: '/post/' }} />
    );
    renderAndRun(element);
    renderAndRun(element);
    const scripts = document.querySelectorAll('#facebook-jssdk');
    expect(scripts.length).toBe(1);
    expect(scripts[0].src).toBe('https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v26.0');
    expect(scripts[0].async).toBe(true);
  });

  test('Facebook preserves the page language and canonical URL', () => {
    renderAndRun(
      <Facebook.Cacheable
        config={{ language: 'en' }}
        page={{ lang: 'zh-CN', permalink: 'https://example.com/post/' }}
      />,
    );
    expect(document.getElementById('facebook-jssdk').src).toBe(
      'https://connect.facebook.net/zh_CN/sdk.js#xfbml=1&version=v26.0',
    );
    expect(document.querySelector('.fb-comments').getAttribute('data-href')).toBe(
      'https://example.com/post/',
    );
  });

  test('Facebook renders the new comments box after a PJAX page switch', () => {
    const element = (
      <Facebook.Cacheable config={{ language: 'en' }} page={{ permalink: '/post/' }} />
    );
    renderAndRun(element);
    window.FB = { XFBML: { parse: () => calls.push('parse') } };
    renderAndRun(element);
    delete window.FB;
    expect(document.querySelectorAll('#facebook-jssdk').length).toBe(1);
    expect(calls).toEqual(['parse']);
  });

  test('Facebook reuses an SDK loaded by another integration', () => {
    window.FB = { XFBML: { parse: () => calls.push('parse') } };
    try {
      renderAndRun(<Facebook permalink="/post/" />);
      expect(document.querySelector('#facebook-jssdk')).toBe(null);
      expect(calls).toEqual(['parse']);
    } finally {
      delete window.FB;
    }
  });

  test('Giscus term in the schema', () => {
    const def = require('../../schema/comment/giscus.json');
    const schema = SchemaLoader.load(def).getSchema(def.$id);
    const config = { type: 'giscus', repo: 'a/b', repoId: 'r', categoryId: 'c', mapping: 'number' };
    expect(schema.validate({ ...config, term: 42 })).toBe(true);
    expect(schema.validate({ ...config, term: 'term' })).toBe(true);
  });
});
