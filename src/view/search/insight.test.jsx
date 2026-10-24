/* eslint-env browser */
const fs = require('fs');
const path = require('path');
const $ = require('jquery');
const searchbox = require('../../util/searchbox');

window.$ = $;
window.jQuery = $;
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
