/* eslint-env browser */
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const { createElement } = require('inferno-create-element');
const { renderToString } = require('inferno-server');
const script = require('../../util/searchbox');
const Insight = require('./insight');
const Algolia = require('./algolia');
const GoogleCSE = require('./google_cse');

window.$ = $;
window.jQuery = $;
// eslint-disable-next-line no-new-func
const install = () => new Function(script)();
install();

function fixture() {
  document.body.innerHTML = `
    <nav class="navbar-main"><button class="search">Search</button></nav>
    <button id="outside">Outside</button>
    <div class="searchbox"><div class="searchbox-mask"></div>
      <div class="searchbox-header"><div class="searchbox-input-container" id="algolia-input">
        <input class="searchbox-input"></div><button class="searchbox-close">Close</button></div>
      <div class="searchbox-body"></div></div>`;
}

function key(key, extra = {}, target = document.body) {
  const event = new $.Event('keydown', { key, ...extra });
  $(target).trigger(event);
  return event;
}

function algoliaLoader(sdk, client = jest.fn()) {
  const source = fs.readFileSync(path.join(__dirname, '../../../asset/js/algolia.js'), 'utf8');
  // eslint-disable-next-line no-new-func
  return new Function('instantsearch', 'algoliasearch', `${source}; return loadAlgolia;`)(
    sdk,
    client,
  );
}

function algoliaSdk(failure) {
  const instances = [];
  function failAt(stage) {
    if (failure === stage) {
      failure = null;
      throw new Error(stage + ' failed');
    }
  }
  const sdk = (options) => {
    failAt('constructor');
    let helper = null;
    let input, onInput, queryHook;
    const search = {
      started: false,
      mainHelper: null,
      mainIndex: { getHelper: () => helper },
      addWidgets: jest.fn(),
      addWidget: jest.fn((widget) => {
        if (widget.queryHook) queryHook = widget.queryHook;
      }),
      start: jest.fn(() => {
        failAt('start');
        helper = {};
        input = document.querySelector('.searchbox-input');
        if (!input) {
          input = document.createElement('input');
          input.className = 'searchbox-input';
          document.getElementById('algolia-input').appendChild(input);
        }
        search.mainHelper = {
          search: () => {
            if (options.searchClient) options.searchClient.search(input.value);
          },
        };
        onInput = () => {
          if (queryHook) queryHook(input.value, () => search.mainHelper.search());
          else search.mainHelper.search();
        };
        input.addEventListener('input', onInput);
        // Like 4.3.1, publish started only after mounting widgets and the first client search.
        search.mainHelper.search();
        search.started = true;
      }),
      dispose: jest.fn(() => {
        // Disposal needs initialized helpers, not necessarily a completed start().
        if (!helper) throw new Error('Cannot dispose before index initialization');
        // Preact may leave native callbacks on input nodes retained outside the disposed widget.
        input.remove();
        helper = null;
        search.mainHelper = null;
        search.started = false;
      }),
    };
    instances.push(search);
    return search;
  };
  sdk.widgets = Object.fromEntries(
    ['configure', 'searchBox', 'poweredBy', 'hits', 'pagination'].map((name) => [
      name,
      (options) => {
        failAt('widget');
        return options;
      },
    ]),
  );
  return { sdk, instances };
}

function initializeEngine(name, loadAlgolia) {
  if (name === 'Algolia') {
    loadAlgolia({}, {});
  } else if (name === 'Insight') {
    const source = fs.readFileSync(path.join(__dirname, '../../../asset/js/insight.js'), 'utf8');
    const getJSON = jest.spyOn($, 'getJSON').mockImplementation(() => {});
    try {
      // eslint-disable-next-line no-new-func
      new Function(`${source}; loadInsight({}, {});`)();
    } finally {
      getJSON.mockRestore();
    }
  } else {
    const source = fs.readFileSync(path.join(__dirname, '../../../asset/js/google_cse.js'), 'utf8');
    // eslint-disable-next-line no-new-func
    new Function(source)();
  }
}

beforeEach(fixture);
afterEach(() => {
  // Also dispose the engine-specific hooks of the last initialized controller.
  window.loadSearchbox($()).destroy();
  jest.useRealTimers();
});

test('Open, focus, escape and restore the original opener even after repeated shortcuts', () => {
  window.loadSearchbox($('.searchbox'));
  const opener = document.querySelector('.search');
  opener.focus();
  $(opener).trigger('click');
  expect(document.activeElement).toBe(document.querySelector('input'));
  expect(key('k', { ctrlKey: true }).isDefaultPrevented()).toBe(true);
  key('Escape', { keyCode: 27 });
  expect($('.searchbox').hasClass('show')).toBe(false);
  expect(document.activeElement).toBe(opener);
});

test('Restore the opener after reinitialization of the same open search box', () => {
  window.loadSearchbox($('.searchbox'));
  const opener = document.querySelector('.search');
  opener.focus();
  $(opener).trigger('click');
  for (let i = 0; i < 3; i++) window.loadSearchbox($('.searchbox'));
  expect($('.searchbox').hasClass('show')).toBe(true);
  expect(document.activeElement).toBe(document.querySelector('input'));
  key('Escape', { keyCode: 27 });
  expect($('.searchbox').hasClass('show')).toBe(false);
  expect(document.activeElement).toBe(opener);
});

test('Do not inherit an old opener when the search box DOM changes', () => {
  window.loadSearchbox($('.searchbox'));
  const opener = document.querySelector('.search');
  opener.focus();
  $(opener).trigger('click');
  $('.searchbox').replaceWith('<div class="searchbox show"><input class="searchbox-input"></div>');
  window.loadSearchbox($('.searchbox'));
  document.querySelector('input').focus();
  const focus = jest.spyOn(opener, 'focus');
  key('Escape', { keyCode: 27 });
  expect($('.searchbox').hasClass('show')).toBe(false);
  expect(focus).not.toHaveBeenCalled();
});

test('The inline installer does not require jQuery before deferred dependencies have loaded', () => {
  const initializer = window.loadSearchbox;
  const jquery = window.jQuery;
  delete window.loadSearchbox;
  delete window.jQuery;
  expect(install).not.toThrow();
  window.jQuery = jquery;
  window.loadSearchbox($('.searchbox'));
  key('/');
  expect($('.searchbox').hasClass('show')).toBe(true);
  window.loadSearchbox($()).destroy();
  window.loadSearchbox = initializer;
});

test('Focus leaving the box closes it without moving focus back', () => {
  window.loadSearchbox($('.searchbox'));
  $('.search').trigger('click');
  const outside = document.getElementById('outside');
  outside.focus();
  expect($('.searchbox').hasClass('show')).toBe(false);
  expect(document.activeElement).toBe(outside);
});

test('A removed opener is not focused when closing', () => {
  window.loadSearchbox($('.searchbox'));
  const opener = document.querySelector('.search');
  opener.focus();
  $(opener).trigger('click');
  const focus = jest.spyOn(opener, 'focus');
  opener.remove();
  $('.searchbox-close').trigger('click');
  expect(focus).not.toHaveBeenCalled();
  expect($('.searchbox').hasClass('show')).toBe(false);
});

test.each([
  ['/', {}, true],
  ['/', { shiftKey: true }, true],
  ['/', { altKey: true }, false],
  ['/', { ctrlKey: true }, false],
  ['k', { ctrlKey: true }, true],
  ['K', { metaKey: true }, true],
  ['k', { ctrlKey: true, shiftKey: true }, false],
  ['k', { metaKey: true, altKey: true }, false],
])('Shortcut %s with %j opens: %s', (value, modifiers, opens) => {
  window.loadSearchbox($('.searchbox'));
  const event = key(value, modifiers);
  expect($('.searchbox').hasClass('show')).toBe(opens);
  expect(event.isDefaultPrevented()).toBe(opens);
});

test.each(['input', 'textarea', 'select', 'div'])(
  'Do not intercept / while typing in %s',
  (tag) => {
    window.loadSearchbox($('.searchbox'));
    const field = document.createElement(tag);
    if (tag === 'div') Object.defineProperty(field, 'isContentEditable', { value: true });
    document.body.appendChild(field);
    expect(key('/', {}, field).isDefaultPrevented()).toBe(false);
    expect($('.searchbox').hasClass('show')).toBe(false);
    expect(key('k', { metaKey: true }, field).isDefaultPrevented()).toBe(true);
  },
);

test('Reinstall and PJAX initialization replace only search handlers and target the new DOM', () => {
  const oldKey = jest.fn();
  const dispose = jest.fn();
  const old = window.loadSearchbox($('.searchbox'), { onKeyDown: oldKey, onDestroy: dispose });
  const initializer = window.loadSearchbox;
  install();
  expect(window.loadSearchbox).toBe(initializer);
  fixture();
  const onKeyDown = jest.fn();
  const other = jest.fn();
  $(document).on('keydown.unrelated', other);
  window.loadSearchbox($('.searchbox'), { onKeyDown });
  key('/');
  key('ArrowDown', { keyCode: 40 });
  expect(old.isCurrent()).toBe(false);
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(oldKey).not.toHaveBeenCalled();
  expect(onKeyDown).toHaveBeenCalledTimes(1);
  expect(other).toHaveBeenCalledTimes(2);
  $(document).off('.unrelated');
});

test('Insight touch-close ignores a scroll and retains the navbar click-through delay', () => {
  jest.useFakeTimers();
  window.loadSearchbox($('.searchbox'), { touch: true });
  key('/');
  $(document).trigger('touchstart').trigger('touchmove');
  $('.searchbox-close').trigger('touchend');
  expect($('.searchbox').hasClass('show')).toBe(true);
  $(document).trigger('touchstart');
  $('.searchbox-close').trigger('touchend');
  expect($('.searchbox').hasClass('show')).toBe(false);
  expect($('.navbar-main').css('pointer-events')).toBe('none');
  jest.advanceTimersByTime(400);
  expect($('.navbar-main').css('pointer-events')).toBe('auto');
});

test('The mask closes Algolia and Google search boxes', () => {
  window.loadSearchbox($('.searchbox'));
  key('/');
  $('.searchbox-mask').trigger('click');
  expect($('.searchbox').hasClass('show')).toBe(false);
});

test.each([
  [
    Insight,
    { jsUrl: '/custom/insight.js', contentUrl: '/content.json', translation: { hint: 'Find' } },
  ],
  [
    Algolia,
    {
      jsUrl: '/custom/algolia.js',
      applicationId: 'app',
      apiKey: 'key',
      indexName: 'posts',
      translation: {},
      algoliaSearchUrl: '/client.js',
      instantSearchUrl: '/widgets.js',
    },
  ],
  [GoogleCSE, { jsUrl: '/custom/google.js', cx: 'cx', hint: 'Find' }],
])(
  'Standalone %p installs interactions before its engine without extra asset URLs',
  (Component, props) => {
    document.body.innerHTML = renderToString(createElement(Component, props));
    const scripts = Array.from(document.scripts);
    const installer = scripts.findIndex((element) => element.textContent.includes('loadSearchbox'));
    const engine = scripts.findIndex((element) => element.getAttribute('src') === props.jsUrl);
    expect(installer).toBeGreaterThanOrEqual(0);
    expect(installer).toBeLessThan(engine);
    expect(
      scripts.filter((element) => element.src).map((element) => element.getAttribute('src')),
    ).not.toContain('/js/searchbox.js');
    // Check the compiled function is self-contained, rather than depending on Babel helpers.
    delete window.loadSearchbox;
    // eslint-disable-next-line no-new-func
    new Function(scripts[installer].textContent)();
    expect(typeof window.loadSearchbox).toBe('function');
  },
);

test.each([
  [Insight, 'loadInsight', { jsUrl: '/insight.js', translation: {} }],
  [
    Algolia,
    'loadAlgolia',
    {
      jsUrl: '/algolia.js',
      applicationId: 'app',
      apiKey: 'key',
      indexName: 'posts',
      translation: {},
    },
  ],
])(
  '%s initializes after deferred scripts on first load and immediately after PJAX',
  (Component, name, props) => {
    document.body.innerHTML = renderToString(createElement(Component, props));
    const source = Array.from(document.scripts).find((element) =>
      element.textContent.includes(name),
    ).textContent;
    const initialize = jest.fn();
    // eslint-disable-next-line no-new-func
    const run = new Function(name, source);
    const readyState = jest.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    run(initialize);
    expect(initialize).not.toHaveBeenCalled();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(initialize).toHaveBeenCalledTimes(1);
    // The once listener must not initialize the engine a second time.
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(initialize).toHaveBeenCalledTimes(1);
    readyState.mockReturnValue('complete');
    run(initialize);
    expect(initialize).toHaveBeenCalledTimes(2);
    readyState.mockRestore();
  },
);

test('Algolia reinitialization disposes the previous instantsearch instance', () => {
  const { sdk, instances } = algoliaSdk();
  const load = algoliaLoader(sdk);
  load({}, {});
  load({}, {});
  expect(instances[0].dispose).toHaveBeenCalledTimes(1);
  expect(instances[1].start).toHaveBeenCalledTimes(1);
  key('/');
  expect(document.activeElement).toBe(document.querySelector('input'));
});

test.each([
  ['started', true],
  ['started', false],
  ['query failed', true],
  ['query failed', false],
])('Switch from Algolia (%s, open: %s) to a connected, usable Insight input', (stage, wasOpen) => {
  const { sdk, instances } = algoliaSdk();
  const client = {
    search: jest.fn(() => {
      if (stage === 'query failed') throw new Error('client search failed');
    }),
  };
  const load = algoliaLoader(sdk, () => client);
  if (stage === 'query failed') expect(() => load({}, {})).toThrow('client search failed');
  else load({}, {});
  expect(instances[0].started).toBe(stage === 'started');
  expect(instances[0].mainIndex.getHelper()).not.toBe(null);
  const oldInput = document.querySelector('input');
  const main = document.querySelector('.searchbox');
  const opener = document.querySelector('.search');
  opener.focus();
  if (wasOpen) $(opener).trigger('click');
  const content = {
    posts: [{ title: 'Hello', text: 'World', link: '/hello' }],
    pages: [],
    tags: [],
    categories: [],
  };
  const getJSON = jest.spyOn($, 'getJSON').mockImplementation((url, callback) => callback(content));
  const source = fs.readFileSync(path.join(__dirname, '../../../asset/js/insight.js'), 'utf8');
  try {
    // eslint-disable-next-line no-new-func
    const insight = new Function(`${source}; return loadInsight;`)();
    insight({}, { posts: 'Posts', hint: 'Find posts' });
    expect(document.querySelector('.searchbox')).toBe(main);
    expect(oldInput.isConnected).toBe(false);
    const input = main.querySelector('.searchbox-input');
    expect(input).not.toBe(null);
    expect(input.isConnected).toBe(true);
    expect(input.placeholder).toBe('Find posts');
    expect(main.classList.contains('show')).toBe(wasOpen);
    if (!wasOpen) {
      expect(document.activeElement).toBe(opener);
      $(opener).trigger('click');
    }
    expect(document.activeElement).toBe(input);
    const calls = client.search.mock.calls.length;
    input.value = 'hello';
    expect(() => input.dispatchEvent(new Event('input', { bubbles: true }))).not.toThrow();
    expect(client.search).toHaveBeenCalledTimes(calls);
    expect(document.querySelector('.searchbox-result-title').textContent.trim()).toBe('Hello');
    expect(instances[0].dispose).toHaveBeenCalledTimes(1);
    expect(instances[0].mainHelper).toBe(null);
    expect(instances[0].mainIndex.getHelper()).toBe(null);
    // A retained SDK input must remain inactive, but is not the input used to prove usability.
    oldInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(client.search).toHaveBeenCalledTimes(calls);
    insight({}, { posts: 'Posts', hint: 'Find posts' });
    expect(main.querySelector('.searchbox-input')).toBe(input);
    key('Escape', { keyCode: 27 });
    expect(main.classList.contains('show')).toBe(false);
    expect(document.activeElement).toBe(opener);
  } finally {
    getJSON.mockRestore();
  }
});

test('A client search failure releases the old listener before Algolia retries and accepts input', () => {
  const { sdk, instances } = algoliaSdk();
  const failed = {
    search: jest.fn(() => {
      throw new Error('client search failed');
    }),
  };
  const recovered = { search: jest.fn() };
  const client = jest.fn().mockReturnValueOnce(failed).mockReturnValue(recovered);
  const load = algoliaLoader(sdk, client);
  expect(() => load({}, {})).toThrow('client search failed');
  load({}, {});
  const input = document.querySelector('input');
  input.value = 'hello';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  expect(failed.search).toHaveBeenCalledTimes(1);
  expect(recovered.search).toHaveBeenLastCalledWith('hello');
  expect(instances[0].dispose).toHaveBeenCalledTimes(1);
});

test.each(['Algolia', 'Insight', 'Google'])(
  'A missing Algolia SDK does not block %s initialization',
  (next) => {
    const { sdk } = algoliaSdk();
    expect(() => algoliaLoader(undefined)({}, {})).toThrow();
    expect(() => initializeEngine(next, algoliaLoader(sdk))).not.toThrow();
    key('/');
    expect(document.activeElement).toBe(document.querySelector('input'));
  },
);

test.each(
  ['constructor', 'widget', 'start'].flatMap((stage) =>
    ['Algolia', 'Insight', 'Google'].map((next) => [stage, next]),
  ),
)('Algolia %s failure does not block %s initialization', (stage, next) => {
  const { sdk, instances } = algoliaSdk(stage);
  const load = algoliaLoader(sdk);
  expect(() => load({}, {})).toThrow(stage + ' failed');
  expect(() => initializeEngine(next, load)).not.toThrow();
  if (stage !== 'constructor') expect(instances[0].dispose).not.toHaveBeenCalled();
  key('/');
  expect(document.activeElement).toBe(document.querySelector('input'));
});

test('Google CSE reinitialization keeps one query handler and ignores stale debounce callbacks', () => {
  jest.useFakeTimers();
  const element = { execute: jest.fn(), clearAllResults: jest.fn() };
  const google = { search: { cse: { element: { getElement: () => element } } } };
  const source = fs.readFileSync(path.join(__dirname, '../../../asset/js/google_cse.js'), 'utf8');
  // eslint-disable-next-line no-new-func
  const load = () => new Function('google', source)(google);
  load();
  $('.searchbox-input').val('old').trigger('keydown');
  load();
  jest.advanceTimersByTime(300);
  expect(element.execute).not.toHaveBeenCalled();
  $('.searchbox-input').val('new').trigger('keydown');
  jest.advanceTimersByTime(300);
  expect(element.execute).toHaveBeenCalledTimes(1);
  expect(element.execute).toHaveBeenCalledWith('new');
  $('.searchbox-input').val('').trigger('keydown');
  jest.advanceTimersByTime(300);
  expect(element.clearAllResults).toHaveBeenCalledTimes(1);
});
