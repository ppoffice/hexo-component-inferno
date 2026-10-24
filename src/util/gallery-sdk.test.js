const fs = require('fs');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');
const installer = require('./gallery');

// Exact existing CDN versions, installed as test-only dependencies; no test-time network requests.
const lightSource = fs.readFileSync(
  require.resolve('lightgallery/dist/js/lightgallery-all.min.js'),
  'utf8',
);
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
  });
  const { window } = dom;
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
  const open = jest.fn();
  $(root).on('onBeforeOpen.lg', open);
  const { MouseEvent } = root.ownerDocument.defaultView;
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  expect(open).toHaveBeenCalledTimes(1);
  $(root).off('onBeforeOpen.lg', open);
}

afterEach(() => {
  if (dom) dom.window.close();
});

test.each(['', '<img src="/old.png" alt="Old">'])(
  'Real lightGallery updates the same root after replacing %p',
  (initial) => {
    const { window, $, root } = setup(initial);
    window.HexoGallery.init(root, enabled);
    const instance = $(root).data('lightGallery');
    const oldItems = Array.from(instance.$items);
    root.innerHTML = '<img src="/new.png" alt="New">';
    window.HexoGallery.init(root, enabled);
    window.eval(installer);
    window.HexoGallery.init(root, enabled);
    const link = root.querySelector('.gallery-item');
    expect(Array.from($(root).data('lightGallery').$items)).toEqual([link]);
    oldItems.forEach((item) => expect($._data(item, 'events')).toBeUndefined());
    expect(root.querySelectorAll('.caption')).toHaveLength(1);
    expectOneOpen($, root, link);
  },
);

test('Real pre-existing lightGallery keeps exactly one click binding and refreshes changed items', () => {
  const { window, $, root } = setup(
    '<a class="gallery-item" href="/old.png"><img src="/old.png"></a>',
  );
  $(root).lightGallery({ selector: '.gallery-item' });
  const instance = $(root).data('lightGallery');
  const retained = root.querySelector('a');
  window.HexoGallery.init(root, enabled);
  window.eval(installer);
  window.HexoGallery.init(root, enabled);
  expect($(root).data('lightGallery')).toBe(instance);
  // Inspect native jQuery's actual event list, not a count of calls to the SDK entry point.
  expect(
    $._data(retained, 'events').click.filter((event) => event.namespace === 'lgcustom'),
  ).toHaveLength(1);
  expectOneOpen($, root, retained);
  root.insertAdjacentHTML('beforeend', '<img src="/new.png" alt="New">');
  window.HexoGallery.init(root, enabled);
  window.HexoGallery.init(root, enabled);
  const links = Array.from(root.querySelectorAll('.gallery-item'));
  expect(Array.from(instance.$items)).toEqual(links);
  links.forEach((link) => {
    expect(
      $._data(link, 'events').click.filter((event) => event.namespace === 'lgcustom'),
    ).toHaveLength(1);
    expectOneOpen($, root, link);
  });
});

test('Real lightGallery unbinds removed links while retaining one handler on reordered survivors', () => {
  const { window, $, root } = setup('<img src="/one"><img src="/two"><img src="/three">');
  window.HexoGallery.init(root, enabled);
  const links = Array.from(root.querySelectorAll('a'));
  root.replaceChildren(links[2], links[0]);
  window.HexoGallery.init(root, enabled);
  expect(Array.from($(root).data('lightGallery').$items)).toEqual([links[2], links[0]]);
  expect($._data(links[1], 'events')).toBeUndefined();
  expectOneOpen($, root, links[2]);
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
  const light = $.fn.lightGallery;
  delete $.fn.lightGallery;
  window.HexoGallery.init(root, enabled);
  root.innerHTML = '<img src="/late.png">';
  $.fn.lightGallery = light;
  const script = window.document.createElement('script');
  window.document.body.appendChild(script);
  script.dispatchEvent(new window.Event('load'));
  window.HexoGallery.init(root, enabled);
  expect(Array.from($(root).data('lightGallery').$items)).toEqual([root.querySelector('a')]);
  expectOneOpen($, root, root.querySelector('a'));
});

test('Disabled flags do not refresh real instances until the latest request enables them', () => {
  const { window, $, root } = setup();
  window.HexoGallery.init(window.document, enabled);
  const instance = $(root).data('lightGallery');
  const oldItems = Array.from(instance.$items);
  root.innerHTML = '<img src="/new.png" alt="New">';
  window.HexoGallery.init(window.document);
  const script = window.document.createElement('script');
  window.document.body.appendChild(script);
  script.dispatchEvent(new window.Event('load'));
  window.dispatchEvent(new window.Event('load'));
  expect($(root).data('lightGallery')).toBe(instance);
  expect(Array.from(instance.$items)).toEqual(oldItems);
  expect(root.querySelectorAll('.caption')).toHaveLength(1);
  window.HexoGallery.init(window.document, enabled);
  expect(Array.from($(root).data('lightGallery').$items)).toEqual([root.querySelector('a')]);
  expectOneOpen($, root, root.querySelector('a'));
});
