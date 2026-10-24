const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');
const installer = require('./gallery');

// Exact CDN releases, installed as test dependencies; no test-time network requests.
const lightSource = fs.readFileSync(require.resolve('lightgallery'), 'utf8');
// The legacy eslint resolver does not understand this package's CSS export.
// eslint-disable-next-line node/no-missing-require
const justifiedStyle = require.resolve('justified-gallery/style.css');
const justifiedSource = fs
  .readFileSync(path.resolve(path.dirname(justifiedStyle), '../justified-gallery.js'), 'utf8')
  .replace(/export \{ (\w+) as JustifiedGallery \};/, 'window.JustifiedGallery = $1;');
const enabled = { lightGallery: true, justifiedGallery: true };
let dom;

function setup(content = '<img src="/old.png" alt="Old">') {
  dom = new JSDOM(`<article class="article">${content}</article>`, {
    url: 'https://example.com/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.scrollTo = () => {};
  Object.defineProperty(window.document, 'readyState', { configurable: true, value: 'complete' });
  const $ = jquery(window);
  window.jQuery = $;
  window.$ = $;
  window.eval(lightSource);
  // jsdom cannot execute ESM: only replace the export, leaving the released implementation intact.
  window.eval(justifiedSource);
  window.eval(installer);
  return { window, $, root: window.document.querySelector('article') };
}

function expectOneOpen($, root, link) {
  const { MouseEvent, document } = root.ownerDocument.defaultView;
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  expect(document.querySelectorAll('.lg-container.lg-show')).toHaveLength(1);
}

async function destroy(window, root) {
  window.HexoGallery.destroy(root);
  // lightGallery keeps its documented 100 ms close delay with transitions disabled.
  await new Promise((resolve) => window.setTimeout(resolve, 120));
}

afterEach(() => {
  if (dom) dom.window.close();
});

test.each(['', '<img src="/old.png" alt="Old">'])(
  'Real lightGallery updates the same root after replacing %p',
  (initial) => {
    const { window, $, root } = setup(initial);
    window.HexoGallery.init(root, enabled);
    const oldItems = Array.from(root.querySelectorAll('a'));
    root.innerHTML = '<img src="/new.png" alt="New">';
    window.HexoGallery.init(root, enabled);
    window.eval(installer);
    window.HexoGallery.init(root, enabled);
    const link = root.querySelector('.gallery-item');
    oldItems.forEach((item) => {
      item.click();
      expect(window.document.querySelector('.lg-container.lg-show')).toBe(null);
    });
    expect(root.querySelectorAll('.caption')).toHaveLength(1);
    expectOneOpen($, root, link);
  },
);

test('Real lightGallery keeps one delegated click binding and refreshes changed items', async () => {
  const { window, $, root } = setup(
    '<a class="gallery-item" href="/old.png"><img src="/old.png"></a>',
  );
  const retained = root.querySelector('a');
  window.HexoGallery.init(root, enabled);
  window.eval(installer);
  window.HexoGallery.init(root, enabled);
  expectOneOpen($, root, retained);
  await destroy(window, root);
  root.insertAdjacentHTML('beforeend', '<img src="/new.png" alt="New">');
  window.HexoGallery.init(root, enabled);
  window.HexoGallery.init(root, enabled);
  const links = Array.from(root.querySelectorAll('.gallery-item'));
  for (const link of links) {
    expectOneOpen($, root, link);
    await destroy(window, root);
    window.HexoGallery.init(root, enabled);
  }
});

test('Real lightGallery handles reordered survivors and unbinds on destroy', async () => {
  const { window, $, root } = setup('<img src="/one"><img src="/two"><img src="/three">');
  window.HexoGallery.init(root, enabled);
  const links = Array.from(root.querySelectorAll('a'));
  root.replaceChildren(links[2], links[0]);
  window.HexoGallery.init(root, enabled);
  links[1].click();
  expect(window.document.querySelector('.lg-container.lg-show')).toBe(null);
  expectOneOpen($, root, links[2]);
  await destroy(window, root);
  expect(window.document.querySelector('.lg-container')).toBe(null);
  expect(window.document.documentElement.classList.contains('lg-on')).toBe(false);
  window.HexoGallery.init(root, enabled);
  expectOneOpen($, root, links[0]);
});

test.each(['', '<p><img src="/old" alt="Old"></p>'])(
  'Real JG refreshes changed entries (%s)',
  (content) => {
    const { window, root } = setup(`<div class="justified-gallery">${content}</div>`);
    const JustifiedGallery = window.JustifiedGallery;
    const instances = [];
    window.JustifiedGallery = function (...args) {
      const instance = new JustifiedGallery(...args);
      instances.push(instance);
      return instance;
    };
    window.HexoGallery.init(root, enabled);
    const instance = instances[0];
    const gallery = root.querySelector('.justified-gallery');
    const timer = instance.widthWatcher.intervalId;
    const init = jest.spyOn(instance, 'init');
    window.HexoGallery.init(root, enabled);
    expect(init).not.toHaveBeenCalled();
    gallery.innerHTML = '<p><img src="/new" alt="New"></p>';
    const clear = jest.spyOn(window, 'clearInterval');
    window.HexoGallery.init(root, enabled);
    window.HexoGallery.init(root, enabled);
    expect(instances).toHaveLength(1);
    expect(init).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith(timer);
    expect(instance.entries).toEqual([gallery.querySelector('a')]);
    expect(gallery.querySelectorAll('.caption')).toHaveLength(1);
    expect(gallery.querySelectorAll('.jg-caption')).toHaveLength(1);
    const destroy = jest.spyOn(instance, 'destroy');
    const widthTimer = instance.widthWatcher.intervalId;
    const spinnerTimer = instance.spinner.intervalId;
    window.HexoGallery.destroy(root);
    window.HexoGallery.destroy(root);
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith(widthTimer);
    expect(clear).toHaveBeenCalledWith(spinnerTimer);
    expect(instance.spinner.isRunning).toBe(false);
    expect(gallery.classList.contains('justified-gallery')).toBe(false);
    expect(gallery.querySelector('.jg-spinner')).toBe(null);
  },
);

test('Real JG positions entries, refreshes width, and tears down before PJAX replacement', () => {
  const { window, root } = setup(
    '<div class="justified-gallery"><a><img width="200" height="100"></a><a><img width="100" height="100"></a></div>',
  );
  const gallery = root.querySelector('.justified-gallery');
  Object.defineProperty(gallery, 'offsetWidth', { value: 600 });
  const JustifiedGallery = window.JustifiedGallery;
  let instance;
  window.JustifiedGallery = function (element, options) {
    instance = new JustifiedGallery(element, { ...options, waitThumbnailsLoad: false });
    return instance;
  };
  window.HexoGallery.init(root, enabled);
  instance.analyzeImages(false);
  expect(gallery.querySelector('a').style.width).not.toBe('');
  expect(gallery.querySelector('a').style.height).not.toBe('');
  const watcher = instance.widthWatcher;
  watcher.onWidthChanged(400);
  expect(instance.galleryWidth).toBe(400);
  const destroy = jest.spyOn(instance, 'destroy');
  window.HexoGallery.destroy(window.document);
  expect(destroy).toHaveBeenCalledTimes(1);
  expect(gallery.style.height).toBe('');
  root.innerHTML = '<div class="justified-gallery"><img src="/next"></div>';
  window.HexoGallery.init(root, enabled);
  expect(instance.gallery).toBe(root.querySelector('.justified-gallery'));
});

test('Real delayed SDK arrival binds the latest contents of a retained root', () => {
  const { window, $, root } = setup();
  const light = window.lightGallery;
  delete window.lightGallery;
  window.HexoGallery.init(root, enabled);
  root.innerHTML = '<img src="/late.png">';
  window.lightGallery = light;
  const script = window.document.createElement('script');
  window.document.body.appendChild(script);
  script.dispatchEvent(new window.Event('load'));
  window.HexoGallery.init(root, enabled);
  expectOneOpen($, root, root.querySelector('a'));
});

test('Disabled flags destroy real lightboxes until the latest request enables them', async () => {
  const { window, $, root } = setup();
  window.HexoGallery.init(window.document, enabled);
  expectOneOpen($, root, root.querySelector('a'));
  root.innerHTML = '<img src="/new.png" alt="New">';
  window.HexoGallery.init(window.document);
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  const script = window.document.createElement('script');
  window.document.body.appendChild(script);
  script.dispatchEvent(new window.Event('load'));
  window.dispatchEvent(new window.Event('load'));
  expect(window.document.querySelector('.lg-container')).toBe(null);
  expect(root.querySelectorAll('.caption')).toHaveLength(1);
  window.HexoGallery.init(window.document, enabled);
  expectOneOpen($, root, root.querySelector('a'));
});
