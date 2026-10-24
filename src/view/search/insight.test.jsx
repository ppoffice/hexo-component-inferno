/* eslint-env browser */
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const { createElement } = require('inferno-create-element');
const { renderToString } = require('inferno-server');
const Insight = require('./insight');
const registerAssets = require('../../hexo/generator/assets');
const searchbox = require('../../util/searchbox');
const createInsightSearch = require('../../util/insight-search');

window.$ = $;
window.jQuery = $;
window.searchInsight = createInsightSearch();
// eslint-disable-next-line no-new-func
new Function(searchbox)();
const source = fs.readFileSync(path.join(__dirname, '../../../asset/js/insight.js'), 'utf8');
// eslint-disable-next-line no-new-func
const loadInsight = new Function(`${source}\nreturn loadInsight;`)();
const translation = {
  posts: 'Posts',
  pages: 'Pages',
  categories: 'Categories',
  tags: 'Tags',
  untitled: '(Untitled)',
};

/**
 * Run the Insight search script on the given content, and search for the given query.
 */
function search(json, query) {
  document.body.innerHTML =
    '<div class="searchbox"><input class="searchbox-input"><div class="searchbox-body"></div></div>';
  $.getJSON = (url, callback) => callback(json);
  loadInsight({ contentUrl: '/content.json' }, translation);
  $('.searchbox-input').val(query).trigger('input');
  return document.querySelector('.searchbox-body');
}

const empty = { posts: [], pages: [], tags: [], categories: [] };

test('Show the content of the results as text', () => {
  const body = search(
    {
      ...empty,
      posts: [
        {
          title: 'About <b>tags</b>',
          text: 'Write <img src=x onerror="window.injected = true"> to add an image',
          link: '/post/" onmouseover="window.injected = true',
        },
      ],
      tags: [{ name: '<i>tag</i>', slug: 'image', link: '/tags/image/' }],
    },
    'image',
  );
  expect(body.querySelector('img, b, .searchbox-result-title i')).toBe(null);
  expect(window.injected).toBe(undefined);
  expect(body.querySelector('.searchbox-result-preview').textContent).toContain(
    'Write <img src=x onerror="window.injected = true"> to add an ',
  );
  expect(body.querySelector('.searchbox-result-preview em').textContent).toBe('image');
  expect(body.querySelector('.searchbox-result-title').textContent).toContain('About <b>tags</b>');
  expect(body.querySelector('a').getAttribute('href')).toBe(
    '/post/" onmouseover="window.injected = true',
  );
});

function post(title, text = '') {
  return { title, text, link: '/post/' };
}

function titles(body) {
  return Array.from(body.querySelectorAll('.searchbox-result-title')).map((element) =>
    element.innerHTML.trim(),
  );
}

test('Keep the text before the matches in titles', () => {
  const body = search({ ...empty, posts: [post('Hello World')] }, 'world');
  expect(titles(body)).toEqual(['Hello <em>World</em>']);
});

test('Highlight the matches after characters whose lowercase is longer', () => {
  const body = search({ ...empty, posts: [post('İİİ Hello world')] }, 'hello');
  expect(titles(body)).toEqual(['İİİ <em>Hello</em> world']);
});

test('Search for characters that have a meaning in regular expressions', () => {
  const body = search(
    { ...empty, posts: [post('C++ tips', 'c++ and c++'), post('C# tips', 'c++')] },
    'c++',
  );
  expect(titles(body)).toEqual(['<em>C++</em> tips', 'C# tips']);
});

test('Show the most relevant results first', () => {
  const body = search(
    {
      ...empty,
      posts: [post('One', 'search'), post('Search', 'search search'), post('Two', 'search search')],
    },
    'search',
  );
  expect(body.querySelectorAll('.searchbox-result-title')[0].textContent.trim()).toBe('Search');
  expect(body.querySelectorAll('.searchbox-result-title')[1].textContent.trim()).toBe('Two');
});

test('Shorten the preview of a post that only matches by its title', () => {
  const body = search({ ...empty, posts: [post('Search', 'x'.repeat(500))] }, 'search');
  expect(body.querySelector('.searchbox-result-preview').textContent).toBe('x'.repeat(100));
});

test('Reinitialization keeps one result navigation handler', () => {
  const json = { ...empty, posts: [post('Search one'), post('Search two')] };
  search(json, 'search');
  loadInsight({ contentUrl: '/content.json' }, translation);
  $('.searchbox-input').val('search').trigger('input');
  $(document.body).trigger(new $.Event('keydown', { key: '/' }));
  $(document.body).trigger(new $.Event('keydown', { key: 'ArrowDown', keyCode: 40 }));
  expect($('.searchbox-result-item').eq(0).hasClass('active')).toBe(true);
  expect($('.searchbox-result-item').eq(1).hasClass('active')).toBe(false);
});

test('Reinitializing an open Insight box restores focus to its opener on Escape', () => {
  search(empty, '');
  const nav = document.createElement('nav');
  nav.className = 'navbar-main';
  nav.innerHTML = '<button class="search">Search</button>';
  document.body.prepend(nav);
  const opener = nav.querySelector('button');
  opener.focus();
  $(opener).trigger('click');
  loadInsight({ contentUrl: '/content.json' }, translation);
  expect($('.searchbox').hasClass('show')).toBe(true);
  $(document.body).trigger(new $.Event('keydown', { key: 'Escape', keyCode: 27 }));
  expect($('.searchbox').hasClass('show')).toBe(false);
  expect(document.activeElement).toBe(opener);
});

test('Ignore a stale content response after PJAX reinitializes the search box', () => {
  const responses = [];
  $.getJSON = (url, callback) => responses.push(callback);
  loadInsight({ contentUrl: '/old.json' }, translation);
  loadInsight({ contentUrl: '/new.json' }, translation);
  responses[1]({ ...empty, posts: [post('New search')] });
  responses[0]({ ...empty, posts: [post('Old search')] });
  $('.searchbox-input').val('search').trigger('input');
  expect(titles(document.querySelector('.searchbox-body'))).toEqual(['New <em>search</em>']);
});

test('Preserve empty-query section order, per-section limits, and escaped taxonomy subtitles', () => {
  const body = search(
    {
      posts: Array.from({ length: 6 }, (_, id) => post(`Post ${id}`)),
      pages: [post('Page')],
      categories: [{ name: '<Category>', slug: '"<slug>&', link: '/category/' }],
      tags: [{ name: 'Tag', slug: 'tag', link: '/tag/' }],
    },
    '   ',
  );
  expect(Array.from(body.querySelectorAll('header')).map((header) => header.textContent)).toEqual([
    'Posts',
    'Pages',
    'Categories',
    'Tags',
  ]);
  expect(titles(body).slice(0, 5)).toEqual(['Post 0', 'Post 1', 'Post 2', 'Post 3', 'Post 4']);
  expect(body.querySelectorAll('.searchbox-result-item')).toHaveLength(8);
  expect(body.querySelector('.searchbox-result-title-secondary').textContent).toBe('("<slug>&)');
  expect(body.querySelector('category, slug')).toBe(null);
  expect(body.querySelectorAll('em')).toHaveLength(0);
});

test('Merge overlapping highlights and escape the untitled translation', () => {
  const original = translation.untitled;
  translation.untitled = '<Untitled>';
  try {
    const body = search(
      { ...empty, posts: [post('Hello', 'hello'), post('', 'hello')] },
      'he hello',
    );
    expect(titles(body)).toEqual(['<em>Hello</em>', '&lt;Untitled&gt;']);
    expect(body.querySelectorAll('.searchbox-result-preview em')).toHaveLength(2);
    expect(body.querySelector('untitled')).toBe(null);
  } finally {
    translation.untitled = original;
  }
});

test.each(['/js/insight.js', 'https://cdn.example/hexo-component-inferno/asset/js/insight.js'])(
  'The standalone compiled view installs the engine before %s, including after PJAX',
  (jsUrl) => {
    const register = jest.fn();
    registerAssets({
      theme_dir: path.join(__dirname, '../../..'),
      extend: { generator: { register } },
    });
    const assets = register.mock.calls[0][1]();
    const asset = assets.find((route) => route.path === '/js/insight.js');
    expect(asset.data).toBe(source);
    const contentUrl = '/content.json?value=</script>\u2028\u2029';
    const props = { jsUrl, contentUrl, translation };
    const readyState = jest.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
    $.getJSON = jest.fn((url, callback) => callback({ ...empty, posts: [post('Hello <World>')] }));
    delete window.searchInsight;
    try {
      for (let i = 0; i < 2; i++) {
        document.body.innerHTML = renderToString(createElement(Insight, props));
        const scripts = Array.from(document.scripts);
        expect(scripts).toHaveLength(3);
        expect(scripts[1].getAttribute('src')).toBe(jsUrl);
        expect(scripts.every((script) => script.hasAttribute('data-pjax'))).toBe(true);
        // No imports, runtime Babel helpers, extra script URLs, or script-closing config values.
        // eslint-disable-next-line no-new-func
        new Function(scripts[0].textContent)();
        // eslint-disable-next-line no-new-func
        const load = new Function(`${asset.data}\nreturn loadInsight;`)();
        // eslint-disable-next-line no-new-func
        new Function('loadInsight', scripts[2].textContent)(load);
        $('.searchbox-input').val('world').trigger('input');
        expect(titles(document.querySelector('.searchbox-body'))).toEqual([
          'Hello &lt;<em>World</em>&gt;',
        ]);
      }
      expect($.getJSON).toHaveBeenCalledTimes(2);
      expect($.getJSON).toHaveBeenLastCalledWith(contentUrl, expect.any(Function));
    } finally {
      readyState.mockRestore();
    }
  },
);
