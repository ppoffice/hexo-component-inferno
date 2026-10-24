const fs = require('fs');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');
const installer = require('./gallery');

// Exact CDN versions, installed as test dependencies; no test-time network requests.
const lightSource = fs.readFileSync(require.resolve('lightgallery'), 'utf8');
const justifiedSource = fs.readFileSync(
  require.resolve('justifiedGallery/dist/js/jquery.justifiedGallery.min.js'),
  'utf8',
);
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

test.each([false, true])('Real JG reuses one controller (%s)', (external) => {
  const { window, $, root } = setup(
    '<div class="justified-gallery"><a href="/old"><img src="/old"></a></div>',
  );
  const gallery = root.querySelector('.justified-gallery');
  if (external) $(gallery).justifiedGallery();
  window.HexoGallery.init(root, enabled);
  const controller = $(gallery).data('jg.controller');
  const timer = controller.checkWidthIntervalId;
  const clear = jest.spyOn(window, 'clearInterval');
  const update = jest.spyOn(controller, 'updateEntries');
  window.HexoGallery.init(root, enabled);
  expect(update).not.toHaveBeenCalled();
  gallery.innerHTML = '<p><img src="/new" alt="New"></p>';
  window.HexoGallery.init(root, enabled);
  expect($(gallery).data('jg.controller')).toBe(controller);
  expect(controller.entries).toEqual([gallery.querySelector('a')]);
  expect(update).toHaveBeenCalledTimes(1);
  expect(clear).toHaveBeenCalledWith(timer);
  window.HexoGallery.init(root, enabled);
  expect(update).toHaveBeenCalledTimes(1);
  expectOneOpen($, root, gallery.querySelector('a'));
});

test('Real JG refreshes an initially empty root when images are added', () => {
  const { window, $, root } = setup('<div class="justified-gallery"></div>');
  const gallery = root.querySelector('.justified-gallery');
  window.HexoGallery.init(root, enabled);
  const controller = $(gallery).data('jg.controller');
  gallery.innerHTML = '<p><img src="/added" alt="Added"></p>';
  window.HexoGallery.init(root, enabled);
  window.HexoGallery.init(root, enabled);
  expect($(gallery).data('jg.controller')).toBe(controller);
  expect(controller.entries).toEqual([gallery.querySelector('a')]);
  expectOneOpen($, root, gallery.querySelector('a'));
});

test.each([false, true])('Real filtered JG keeps order (%s)', (randomize) => {
  const { window, $, root } = setup(`<div class="justified-gallery">
    <a class="keep" href="/one"><img src="/one"></a>
    <a class="keep" href="/two"><img src="/two"></a>
    <a href="/drop"><img src="/drop"></a>
  </div>`);
  const gallery = root.querySelector('.justified-gallery');
  if (!randomize) gallery.querySelector('a[href="/two"]').remove();
  window.Math.random = () => 0;
  $(gallery).justifiedGallery({ filter: '.keep', randomize });
  const controller = $(gallery).data('jg.controller');
  const original = controller.getAllEntries();
  const visible = Array.from(controller.entries);
  const timer = controller.checkWidthIntervalId;
  const update = jest.spyOn(controller, 'updateEntries');
  const clear = jest.spyOn(window, 'clearInterval');
  const retry = () => {
    const script = window.document.createElement('script');
    window.document.body.appendChild(script);
    script.dispatchEvent(new window.Event('load'));
  };
  window.HexoGallery.init(root, { justifiedGallery: true });
  expect(controller.getAllEntries()).toEqual(original);
  expect(controller.entries).toEqual(visible);
  window.HexoGallery.init(root, { justifiedGallery: true });
  retry();
  expect(controller.getAllEntries()).toEqual(original);
  expect(controller.entries).toEqual(visible);
  expect(update).not.toHaveBeenCalled();
  expect(clear).not.toHaveBeenCalled();
  expect(controller.checkWidthIntervalId).toBe(timer);
  expect(controller.settings.filter).toBe('.keep');
  expect(controller.settings.randomize).toBe(randomize);

  gallery.insertAdjacentHTML('beforeend', '<a class="keep" href="/three"><img src="/three"></a>');
  window.HexoGallery.init(root, { justifiedGallery: true });
  expect(update).toHaveBeenCalledTimes(1);
  expect(clear).toHaveBeenCalledWith(timer);
  expect(controller.entries).toEqual(
    controller.getAllEntries().filter((item) => item.matches('.keep')),
  );
  const afterAddition = controller.getAllEntries();
  retry();
  window.HexoGallery.init(root, { justifiedGallery: true });
  expect(update).toHaveBeenCalledTimes(1);
  expect(controller.getAllEntries()).toEqual(afterAddition);

  // Moving only an excluded item still changes the complete DOM snapshot, not the visible subset.
  const excluded = gallery.querySelector('.jg-filtered');
  const firstEntry = controller.getAllEntries()[0];
  if (firstEntry === excluded) gallery.appendChild(excluded);
  else gallery.insertBefore(excluded, firstEntry);
  window.HexoGallery.init(root, { justifiedGallery: true });
  expect(update).toHaveBeenCalledTimes(2);
  const afterReorder = controller.getAllEntries();
  retry();
  expect(update).toHaveBeenCalledTimes(2);
  expect(controller.getAllEntries()).toEqual(afterReorder);
  excluded.remove();
  window.HexoGallery.init(root, { justifiedGallery: true });
  retry();
  expect(update).toHaveBeenCalledTimes(3);
  expect(controller.entries).toEqual(controller.getAllEntries());
});

test('Real JG detects changed filtered content before the first runtime takeover', () => {
  const { window, $, root } = setup(`<div class="justified-gallery">
    <a class="keep" href="/one"><img src="/one"></a><a href="/drop"><img src="/drop"></a>
  </div>`);
  const gallery = root.querySelector('.justified-gallery');
  const filter = jest.fn((item) => item.matches('.keep'));
  $(gallery).justifiedGallery({ filter });
  const controller = $(gallery).data('jg.controller');
  const update = jest.spyOn(controller, 'updateEntries');
  gallery.innerHTML = '<a class="keep" href="/new"><img src="/new"></a>';
  window.HexoGallery.init(root, { justifiedGallery: true });
  expect(controller.entries).toEqual([gallery.querySelector('a')]);
  expect(update).toHaveBeenCalledTimes(1);
  const calls = filter.mock.calls.length;
  window.HexoGallery.init(root, { justifiedGallery: true });
  expect(update).toHaveBeenCalledTimes(1);
  expect(filter).toHaveBeenCalledTimes(calls);
});

test.each([false, true])('Real JG accepts SDK updates (%s)', (unprocessed) => {
  const { window, $, root } = setup(`<div class="justified-gallery">
    <a class="keep" href="/one"><img src="/one"></a>
    <a class="keep" href="/two"><img src="/two"></a>
    <a href="/drop"><img src="/drop"></a>
  </div>`);
  const gallery = root.querySelector('.justified-gallery');
  window.Math.random = () => 0;
  $(gallery).justifiedGallery({ filter: '.keep', randomize: true });
  const controller = $(gallery).data('jg.controller');
  window.HexoGallery.init(root, { justifiedGallery: true });
  const previousEntries = controller.entries;
  gallery.insertAdjacentHTML(
    'beforeend',
    '<a class="keep" href="/three"><img src="/three"></a>' +
      '<a class="keep" href="/four"><img src="/four"></a>',
  );
  $(gallery).justifiedGallery('norewind');
  expect(controller.entries).not.toBe(previousEntries);
  expect(Array.from(controller.entries).map((item) => item.getAttribute('href'))).toEqual([
    '/two',
    '/one',
    '/four',
    '/three',
  ]);
  const full = controller.getAllEntries();
  const timer = controller.checkWidthIntervalId;
  const update = jest.spyOn(controller, 'updateEntries');
  const init = jest.spyOn(controller, 'init');
  const clear = jest.spyOn(window, 'clearInterval');
  // The entries reference changed in both cases, but the second case has not been fully processed.
  if (unprocessed) {
    gallery.insertAdjacentHTML('beforeend', '<a class="keep" href="/five"><img src="/five"></a>');
  }
  window.HexoGallery.init(root, { justifiedGallery: true });
  window.eval(installer);
  window.HexoGallery.init(root, { justifiedGallery: true });
  const script = window.document.createElement('script');
  window.document.body.appendChild(script);
  script.dispatchEvent(new window.Event('load'));
  expect(update).toHaveBeenCalledTimes(unprocessed ? 1 : 0);
  expect(init).toHaveBeenCalledTimes(unprocessed ? 1 : 0);
  if (unprocessed) {
    expect(clear).toHaveBeenCalledWith(timer);
    expect(controller.entries).toEqual(
      controller.getAllEntries().filter((item) => item.matches('.keep')),
    );
    expect(controller.entries).toHaveLength(5);
  } else {
    expect(clear).not.toHaveBeenCalled();
    expect(controller.checkWidthIntervalId).toBe(timer);
    expect(controller.getAllEntries()).toEqual(full);
  }
  expect(controller.settings.filter).toBe('.keep');
  expect(controller.settings.randomize).toBe(true);
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
