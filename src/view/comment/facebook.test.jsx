/* eslint-env browser */
const { renderToString } = require('inferno-server');
const Facebook = require('./facebook');

test('explains the discontinued service without requesting an invisible Facebook plugin', () => {
  document.body.innerHTML = renderToString(
    <Facebook.Cacheable
      config={{ language: 'en' }}
      page={{ permalink: 'https://example.com/post/' }}
    />,
  );
  const notice = document.querySelector('.notification');
  expect(notice.classList.contains('is-danger')).toBe(true);
  expect(notice.textContent).toMatch(/discontinued/);
  expect(notice.textContent).toMatch(/February 10, 2026/);
  expect(notice.textContent).toMatch(/another comment provider/);
  expect(notice.querySelector('a')).toBe(null);
  expect(document.querySelector('script, .fb-comments')).toBe(null);
});
