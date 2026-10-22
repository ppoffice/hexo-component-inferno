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
