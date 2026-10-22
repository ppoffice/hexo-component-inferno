/* eslint-env browser */
const fs = require('fs');
const path = require('path');
const $ = require('jquery');

window.$ = $;
window.jQuery = $;
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
