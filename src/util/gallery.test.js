const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const jquery = require('jquery');
const { renderToString } = require('inferno-server');
const { createElement } = require('inferno-create-element');
const installer = require('./gallery');
const Gallery = require('../view/plugin/gallery');

const enabled = { lightGallery: true, justifiedGallery: true };
const props = {
  head: false,
  lightGallery: { jsUrl: '/light.js', cssUrl: '/light.css' },
  justifiedGallery: { jsUrl: '/justified.js', cssUrl: '/justified.css' },
};
let dom;

function setup(html = '<article class="article"><img src="/image.png" alt="Caption"></article>') {
  dom = new JSDOM(html, { url: 'https://example.com/', runScripts: 'outside-only' });
  dom.window.eval(installer);
  Object.defineProperty(dom.window.document, 'readyState', {
    configurable: true,
    value: 'complete',
  });
  return dom.window;
}

function plugins(window) {
  const $ = jquery(window);
  const light = jest.fn();
  const justified = jest.fn();
  window.lightGallery = (element, options) => {
    light(element, options);
    return {
      refresh: jest.fn(),
      updateSlides: jest.fn(),
      openGallery: jest.fn(),
      destroy: jest.fn(),
    };
  };
  $.fn.justifiedGallery = function () {
    this.each((i, element) => {
      justified(element);
      const getAllEntries = () => $(element).children('a, div:not(.jg-spinner)').toArray();
      $(element).data('jg.controller', { entries: getAllEntries(), getAllEntries });
    });
    return this;
  };
  window.jQuery = $;
  window.$ = $;
  return { $, light, justified };
}

function scriptLoaded(window) {
  const script = window.document.createElement('script');
  window.document.body.appendChild(script);
  script.dispatchEvent(new window.Event('load'));
}

afterEach(() => {
  if (dom) dom.window.close();
});

test('Basic enhancement works without jQuery or Icarus and creates captions as text', () => {
  const window = setup(`<article class="article">
    <img src='/image.png?x="&amp;y=1' alt="&lt;img src=x onerror=alert(1)&gt; &amp; caption">
    <img src="/empty.png"><img alt="Missing source">
    <img class="not-gallery-item" src="/excluded.png" alt="Excluded">
    <a href="/existing"><img src="/linked.png" alt="Linked"></a>
    <a href="/nested"><span><img src="/nested.png" alt="Nested link"></span></a>
  </article><img id="outside" src="/outside.png">`);
  const { document, HexoGallery } = window;
  HexoGallery.init();
  HexoGallery.init();
  expect(document.querySelectorAll('.gallery-item')).toHaveLength(3);
  expect(document.querySelectorAll('.caption')).toHaveLength(2);
  const link = document.querySelector('.gallery-item');
  expect(link.getAttribute('href')).toBe('/image.png?x="&y=1');
  expect(link.querySelector('.caption').textContent).toBe('<img src=x onerror=alert(1)> & caption');
  expect(link.querySelectorAll('img')).toHaveLength(1);
  expect(document.querySelector('img[alt="Missing source"]').parentNode.hasAttribute('href')).toBe(
    false,
  );
  expect(document.querySelector('.not-gallery-item').parentNode.tagName).toBe('ARTICLE');
  expect(document.querySelector('a[href="/existing"] .caption')).toBe(null);
  expect(document.querySelector('a[href="/nested"] a')).toBe(null);
  expect(document.getElementById('outside').parentNode.tagName).toBe('BODY');
  expect(document.querySelectorAll('script, style, link')).toHaveLength(0);
});

test('lightGallery is independent of jQuery, refreshes metadata and owns one binding per article', () => {
  const window = setup(
    '<article class="article"><img src="/a.png" alt="A"></article><article class="article"><img src="/b.png" alt="B"></article>',
  );
  const instances = [];
  window.lightGallery = jest.fn((element, options) => {
    const instance = {
      options,
      refresh: jest.fn(),
      updateSlides: jest.fn(),
      openGallery: jest.fn(),
      destroy: jest.fn(),
    };
    instances.push(instance);
    return instance;
  });
  const { document, HexoGallery } = window;
  HexoGallery.init(document, enabled);
  HexoGallery.init(document, enabled);
  expect(window.lightGallery).toHaveBeenCalledTimes(2);
  const link = document.querySelector('a');
  link.dispatchEvent(
    new window.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
  );
  expect(instances[0].openGallery).not.toHaveBeenCalled();
  link.click();
  expect(instances[0].openGallery).toHaveBeenCalledTimes(1);
  expect(instances[1].openGallery).not.toHaveBeenCalled();
  link.href = '/changed.png';
  link.querySelector('img').alt = '<script>unsafe</script>';
  HexoGallery.init(document, enabled);
  expect(instances[0].refresh).toHaveBeenCalledWith([
    expect.objectContaining({
      src: 'https://example.com/changed.png',
      subHtml: '&lt;script&gt;unsafe&lt;/script&gt;',
    }),
  ]);
  expect(instances[1].refresh).not.toHaveBeenCalled();
  instances[0].lgOpened = true;
  instances[0].index = 0;
  instances[0].settings = {};
  link.querySelector('img').alt = '"Quoted"';
  HexoGallery.init(document, enabled);
  expect(instances[0].updateSlides).toHaveBeenCalledWith(
    [expect.objectContaining({ subHtml: '"Quoted"', alt: '&quot;Quoted&quot;' })],
    0,
  );
  HexoGallery.destroy(document);
  HexoGallery.destroy(document);
  instances.forEach((instance) => expect(instance.destroy).toHaveBeenCalledTimes(1));
  link.click();
  expect(instances[0].openGallery).toHaveBeenCalledTimes(1);
  scriptLoaded(window);
  expect(window.lightGallery).toHaveBeenCalledTimes(2);
});

test('Waits for configured lightGallery plugins before creating an instance', () => {
  const window = setup();
  const { light } = plugins(window);
  window.HexoGallery.lightGalleryPlugins = ['lgZoom'];
  window.HexoGallery.init(window.document, enabled);
  expect(light).not.toHaveBeenCalled();
  window.lgZoom = function () {};
  scriptLoaded(window);
  expect(light).toHaveBeenCalledTimes(1);
  expect(light.mock.calls[0][1].plugins).toEqual([window.lgZoom]);
});

test('destroy cancels delayed SDK initialization before replacing an enabled page', () => {
  const window = setup();
  window.HexoGallery.init(window.document, enabled);
  window.HexoGallery.destroy(window.document);
  window.lightGallery = jest.fn();
  scriptLoaded(window);
  expect(window.lightGallery).not.toHaveBeenCalled();
});

test('An explicit content container is scoped and need not have an Icarus class', () => {
  const window = setup('<main><img src="/one.png"></main><aside><img src="/two.png"></aside>');
  const main = window.document.querySelector('main');
  const { light } = plugins(window);
  window.HexoGallery.init(main, { lightGallery: true });
  expect(main.querySelectorAll('.gallery-item')).toHaveLength(1);
  expect(window.document.querySelector('aside a')).toBe(null);
  expect(light).toHaveBeenCalledWith(main, expect.objectContaining({ dynamic: true }));
});

test('Disabled plugins are never initialized or downloaded, even when SDKs are present', () => {
  const window = setup(
    '<article class="article"><div class="justified-gallery"><p><img src="/x"></p></div></article>',
  );
  const { light, justified } = plugins(window);
  window.HexoGallery.init();
  scriptLoaded(window);
  expect(window.document.querySelectorAll('.gallery-item')).toHaveLength(1);
  expect(window.document.querySelector('.justified-gallery > p > .gallery-item')).not.toBe(null);
  expect(light).not.toHaveBeenCalled();
  expect(justified).not.toHaveBeenCalled();
  expect(window.document.querySelector('script[src], link')).toBe(null);
});

test('Repeated init, DOM readiness and load bind each enabled plugin once per element', () => {
  const window = setup(
    '<article class="article"><div class="justified-gallery"><p><img src="/x" alt="X"></p></div></article>',
  );
  const { document, HexoGallery } = window;
  const { light, justified } = plugins(window);
  HexoGallery.init(document, enabled);
  HexoGallery.init(document, enabled);
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  window.dispatchEvent(new window.Event('load'));
  scriptLoaded(window);
  expect(light).toHaveBeenCalledTimes(1);
  expect(justified).toHaveBeenCalledTimes(1);
  expect(document.querySelectorAll('.caption')).toHaveLength(1);
  expect(document.querySelector('.justified-gallery > .gallery-item')).not.toBe(null);
  expect(document.querySelector('.justified-gallery > p')).toBe(null);
});

test('SDKs arriving separately after load can retry without rebinding the other plugin', () => {
  const window = setup(
    '<article class="article"><div class="justified-gallery"><p><img src="/x"></p></div></article>',
  );
  const { document, HexoGallery } = window;
  HexoGallery.init(document, enabled);
  window.dispatchEvent(new window.Event('load'));
  const { $, light, justified } = plugins(window);
  const justifiedPlugin = $.fn.justifiedGallery;
  delete $.fn.justifiedGallery;
  scriptLoaded(window);
  expect(light).toHaveBeenCalledTimes(1);
  expect(justified).not.toHaveBeenCalled();
  $.fn.justifiedGallery = justifiedPlugin;
  HexoGallery.init(document, enabled);
  scriptLoaded(window);
  expect(light).toHaveBeenCalledTimes(1);
  expect(justified).toHaveBeenCalledTimes(1);
});

test('An early init retries content parsed before DOMContentLoaded', () => {
  const window = setup('<article class="article"></article>');
  const { document, HexoGallery } = window;
  Object.defineProperty(document, 'readyState', { configurable: true, value: 'loading' });
  const { light } = plugins(window);
  HexoGallery.init(document, enabled);
  expect(light).not.toHaveBeenCalled();
  document.querySelector('article').innerHTML = '<img src="/parsed.png" alt="Parsed">';
  Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' });
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  expect(light).toHaveBeenCalledTimes(1);
  expect(document.querySelector('.caption').textContent).toBe('Parsed');
});

test('The first enabled page reached by PJAX retries dependencies after the page has loaded', () => {
  const window = setup();
  const { document, HexoGallery } = window;
  HexoGallery.init();
  window.dispatchEvent(new window.Event('load'));
  document.body.innerHTML =
    '<article class="article"><div class="justified-gallery"><p><img src="/new"></p></div></article>';
  const template = document.createElement('template');
  template.innerHTML = renderToString(createElement(Gallery, props));
  window.eval(template.content.querySelector('script:not([src])').textContent);
  const { light, justified } = plugins(window);
  scriptLoaded(window);
  expect(light).toHaveBeenCalledTimes(1);
  expect(justified).toHaveBeenCalledTimes(1);
  HexoGallery.init(document, enabled);
  expect(light).toHaveBeenCalledTimes(1);
  expect(justified).toHaveBeenCalledTimes(1);
});

test('A newer disabled-page request supersedes an enabled page waiting for SDKs', () => {
  const window = setup();
  const { document, HexoGallery } = window;
  HexoGallery.init(document, enabled);
  document.body.innerHTML = '<article class="article"><img src="/new.png" alt="New"></article>';
  HexoGallery.init(document);
  const { light, justified } = plugins(window);
  scriptLoaded(window);
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  expect(light).not.toHaveBeenCalled();
  expect(justified).not.toHaveBeenCalled();
  expect(document.querySelector('.caption').textContent).toBe('New');
});

test.each([false, true])(
  'Component, theme and late load callbacks use the latest page flags (partial SDK: %s)',
  (partial) => {
    const window = setup(
      '<article class="article"><div class="justified-gallery"><p><img src="/old"></p></div></article>',
    );
    const { document, HexoGallery } = window;
    const template = document.createElement('template');
    template.innerHTML = renderToString(createElement(Gallery, props));
    // The old page's component and theme main both opt in before dependencies finish loading.
    window.eval(template.content.querySelector('script:not([src])').textContent);
    HexoGallery.init(document, enabled);
    const { $, light, justified } = plugins(window);
    const justifiedPlugin = $.fn.justifiedGallery;
    delete $.fn.justifiedGallery;
    if (partial) scriptLoaded(window);
    expect(light).toHaveBeenCalledTimes(partial ? 1 : 0);

    // PJAX replaces content; disabled pages omit Gallery, but still install and call the runtime.
    document.body.innerHTML =
      '<article class="article"><div class="justified-gallery"><p><img src="/new" alt="New"></p></div></article>';
    window.eval(installer);
    HexoGallery.init(document, { lightGallery: false, justifiedGallery: false });
    $.fn.justifiedGallery = justifiedPlugin;
    // These are retries registered on the previous page, not fresh enabled init requests.
    scriptLoaded(window);
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    window.dispatchEvent(new window.Event('load'));
    expect(light).toHaveBeenCalledTimes(partial ? 1 : 0);
    expect(justified).not.toHaveBeenCalled();
    expect(document.querySelectorAll('.caption')).toHaveLength(1);
    expect(document.querySelector('.justified-gallery > p > .gallery-item')).not.toBe(null);

    // A later enabled page uses its own flags, still binding only once after repeated load events.
    HexoGallery.init(document, enabled);
    scriptLoaded(window);
    window.dispatchEvent(new window.Event('load'));
    expect(light).toHaveBeenCalledTimes(partial ? 2 : 1);
    expect(justified).toHaveBeenCalledTimes(1);
  },
);

test('PJAX and reinstallation preserve the runtime and initialize only new connected containers', () => {
  const window = setup();
  const { document, HexoGallery } = window;
  const oldArticle = document.querySelector('article');
  HexoGallery.init(oldArticle, enabled);
  document.body.innerHTML = '<article class="article"><img src="/new.png" alt="New"></article>';
  window.eval(installer);
  expect(window.HexoGallery).toBe(HexoGallery);
  const { light } = plugins(window);
  HexoGallery.init(document, enabled);
  scriptLoaded(window);
  expect(light).toHaveBeenCalledTimes(1);
  expect(light.mock.calls[0][0]).toBe(document.querySelector('article'));
  expect(document.querySelectorAll('.caption')).toHaveLength(1);
  HexoGallery.init(document, enabled);
  expect(light).toHaveBeenCalledTimes(1);
});

test('Justified Gallery can initialize its root element independently of lightGallery', () => {
  const window = setup('<div class="justified-gallery"><p><img src="/x"></p></div>');
  const { light, justified } = plugins(window);
  const root = window.document.querySelector('.justified-gallery');
  window.HexoGallery.init(root, { justifiedGallery: true });
  expect(justified).toHaveBeenCalledWith(root);
  expect(light).not.toHaveBeenCalled();
  expect(root.querySelector(':scope > .gallery-item')).not.toBe(null);
});

test.each(['loading', 'interactive', 'complete'])(
  'The standalone component initializes at readyState %s without waiting for a past load event',
  (readyState) => {
    const window = setup();
    const { light } = plugins(window);
    Object.defineProperty(window.document, 'readyState', { configurable: true, value: readyState });
    const rendered = renderToString(createElement(Gallery, props));
    const template = window.document.createElement('template');
    template.innerHTML = rendered;
    window.eval(template.content.querySelector('script:not([src])').textContent);
    if (readyState === 'loading') {
      expect(light).not.toHaveBeenCalled();
      Object.defineProperty(window.document, 'readyState', {
        configurable: true,
        value: 'interactive',
      });
      window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
    }
    expect(light).toHaveBeenCalledTimes(1);
    window.eval(template.content.querySelector('script:not([src])').textContent);
    expect(light).toHaveBeenCalledTimes(1);
  },
);

test('The compiled standalone HTML supports real deferred load ordering and PJAX SDK arrival', async () => {
  const errors = [];
  const jquerySource = require('fs').readFileSync(require.resolve('jquery'), 'utf8');
  const lightSource = require('fs').readFileSync(require.resolve('lightgallery'), 'utf8');
  const justifiedSource = require('fs').readFileSync(
    require.resolve('justifiedGallery/dist/js/jquery.justifiedGallery.min.js'),
    'utf8',
  );
  class Dependencies extends ResourceLoader {
    fetch(url) {
      if (url.endsWith('/jquery.js')) return Promise.resolve(Buffer.from(jquerySource));
      if (url.endsWith('/light.js')) {
        return Promise.resolve(
          Buffer.from(
            lightSource +
              ';(function () { var original = lightGallery; window.lightGallery = function (element, options) { window.lightCalls = (window.lightCalls || 0) + 1; return original(element, options); }; })();',
          ),
        );
      }
      if (url.endsWith('/justified.js')) {
        return Promise.resolve(
          Buffer.from(
            justifiedSource +
              ';(function () { var original = jQuery.fn.justifiedGallery; jQuery.fn.justifiedGallery = function () { window.justifiedCalls = (window.justifiedCalls || 0) + this.length; return original.apply(this, arguments); }; })();',
          ),
        );
      }
      throw new Error('Unexpected resource: ' + url);
    }
  }
  const component = renderToString(createElement(Gallery, props));
  dom = new JSDOM(
    `<script src="/jquery.js"></script><article class="article"><div class="justified-gallery"><p><img src="/x" alt="X"></p></div></article>${component}`,
    {
      url: 'https://example.com/',
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      beforeParse(window) {
        window.matchMedia = () => ({
          matches: false,
          addEventListener() {},
          removeEventListener() {},
        });
      },
      resources: new Dependencies(),
      virtualConsole: new VirtualConsole().on('jsdomError', (error) => errors.push(error.message)),
    },
  );
  await new Promise((resolve) => dom.window.addEventListener('load', resolve, { once: true }));
  const { window } = dom;
  expect(errors).toEqual([]);
  expect(window.lightCalls).toBe(1);
  expect(window.justifiedCalls).toBe(1);
  expect(window.document.querySelectorAll('.caption')).toHaveLength(1);
  window.document.body.innerHTML =
    '<article class="article"><img src="/next" alt="Next"></article>';
  // PJAX runs the inline installer again on an already loaded page.
  const template = window.document.createElement('template');
  template.innerHTML = component;
  const inline = template.content.querySelector('script:not([src])').textContent;
  window.eval(inline);
  window.eval(inline);
  expect(window.lightCalls).toBe(2);
  expect(window.document.querySelectorAll('.caption')).toHaveLength(1);
});
