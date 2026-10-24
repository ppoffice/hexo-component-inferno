/* eslint-env browser */
const { renderToString } = require('inferno-server');
const Gitalk = require('./gitalk');

const comment = {
  type: 'gitalk',
  repo: 'repo',
  owner: 'owner',
  admin: ['owner'],
  client_id: 'app-id',
  proxy: 'https://proxy.example.test',
};
const props = {
  comment,
  page: { path: 'post/' },
  helper: { cdn: (name, version, file) => `/cdn/${name}@${version}/${file}` },
};

afterEach(() => {
  document.dispatchEvent(new Event('hexo:page:before-replace'));
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  delete window.Gitalk;
  document.documentElement.removeAttribute('data-appearance');
});

test('Gitalk 2 preserves hashed page IDs and ignores legacy client secrets', () => {
  const html = renderToString(
    <Gitalk.Cacheable {...props} comment={{ ...comment, client_secret: 'never-publish-this' }} />,
  );
  expect(html).toContain('id: "0d67b10a60929a0d4bd9902d50d70dd9"');
  expect(html).not.toMatch(/never-publish-this|clientSecret:/);
  expect(html).toContain('/cdn/@aifire/gitalk@2.0.0-beta.2/dist/gitalk.js');
  expect(html).toContain('/cdn/@aifire/gitalk@2.0.0-beta.2/dist/gitalk.css');
  expect(html).toContain('backend: "issues"');
  expect(html).toContain('createIssueManually: true');
  expect(renderToString(<Gitalk />)).toContain('notification is-danger');
});

test('Gitalk schema requires an owned proxy, not a client secret', () => {
  const schema = require('../../schema/comment/gitalk.json');
  const validate = new (require('ajv'))().compile(schema);
  expect(validate(comment)).toBe(true);
  expect(validate({ ...comment, proxy: undefined })).toBe(false);
  expect(validate({ ...comment, backend: 'discussions', category: 'General', number: 12 })).toBe(
    true,
  );
  expect(validate({ ...comment, backend: 'invalid' })).toBe(false);
  expect(validate({ ...comment, number: 0 })).toBe(false);
});

function mount() {
  document.body.innerHTML = renderToString(
    <Gitalk.Cacheable
      {...props}
      comment={{
        ...comment,
        backend: 'discussions',
        category: 'General',
        number: 12,
        pager_direction: 'first',
      }}
    />,
  );
  // eslint-disable-next-line no-new-func
  new Function(document.body.querySelector('script').textContent)();
}

test('Gitalk 2 maps native options, follows appearance and destroys on page replacement', async () => {
  const destroy = jest.fn();
  let options;
  window.Gitalk = function (value) {
    options = value;
    this.render = jest.fn();
    this.destroy = destroy;
  };
  mount();
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(options).toMatchObject({
    backend: 'discussions',
    category: 'General',
    number: 12,
    sortDirection: 'first',
    mode: 'inline',
  });
  const container = document.getElementById('comment-container');
  expect(container.getAttribute('data-theme')).toBe('light');
  document.documentElement.setAttribute('data-appearance', 'dark');
  await Promise.resolve();
  expect(container.getAttribute('data-theme')).toBe('dark');
  document.dispatchEvent(new Event('hexo:page:before-replace'));
  expect(destroy).toHaveBeenCalledTimes(1);
  expect(window.__gitalkInstance).toBe(null);
  document.documentElement.setAttribute('data-appearance', 'light');
  await Promise.resolve();
  expect(container.getAttribute('data-theme')).toBe('dark');
});

test('Late SDK arrival does not mount an obsolete comment container', () => {
  window.Gitalk = jest.fn();
  mount();
  document.body.innerHTML = '<div id="comment-container"></div>';
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(window.Gitalk).not.toHaveBeenCalled();
});
