/* eslint-env browser */
const { renderToString } = require('inferno-server');
const Waline = require('./waline');
const { SchemaLoader } = require('../../core/schema');
const schema = require('../../schema/comment/waline.json');

function render(comment = {}, options = {}) {
  const root = document.createElement('div');
  root.innerHTML = renderToString(
    <Waline.Cacheable
      comment={{ server_url: 'https://comments.example.com', ...comment }}
      config={{ language: ['en-US', 'zh-CN'] }}
      page={{}}
      helper={{ cdn: (name, version, file) => `/${name}@${version}/${file}` }}
      {...options}
    />,
  );
  document.body.appendChild(root);
  return root;
}

async function execute(root, load = () => Promise.resolve(window.Waline)) {
  // eslint-disable-next-line no-new-func
  new Function('load', root.querySelector('script').textContent.replace('import(', 'load('))(load);
  await Promise.resolve();
}

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-appearance');
  window.__walineInstance = null;
  window.Waline = {
    init: jest.fn(() => ({ update: jest.fn(), destroy: jest.fn() })),
  };
});

afterEach(() => {
  if (window.__walineInstance) window.__walineInstance.destroy();
});

test('pins matching full SDK and stylesheet and uses the first configured language', async () => {
  const root = render();
  expect(root.innerHTML).toContain('@waline/client@3.16.1/dist/waline.js');
  expect(root.querySelector('link').getAttribute('href')).toBe(
    '/@waline/client@3.16.1/dist/waline.css',
  );
  await execute(root);
  expect(window.Waline.init.mock.calls[0][0].lang).toBe('en-US');
});

test('uses page language arrays and keeps the explicit comment language first', async () => {
  await execute(render({}, { page: { lang: ['zh-TW', 'en'] } }));
  expect(window.Waline.init.mock.calls[0][0].lang).toBe('zh-TW');
  document.body.innerHTML = '';
  await execute(render({ lang: 'fr' }, { page: { language: ['zh-TW', 'en'] } }));
  expect(window.Waline.init.mock.calls[1][0].lang).toBe('fr');
});

test.each([true, false])(
  'preserves copyright=%s and feature-disable/count options',
  async (copyright) => {
    await execute(
      render({
        copyright,
        emoji: false,
        image_uploader: true,
        highlighter: true,
        tex_renderer: true,
        search: true,
        comment: '.count',
        pageview: false,
        path: '/fixed/',
      }),
    );
    expect(window.Waline.init.mock.calls[0][0]).toMatchObject({
      path: '/fixed/',
      noCopyright: !copyright,
      emoji: false,
      imageUploader: false,
      highlighter: false,
      texRenderer: false,
      search: false,
      comment: '.count',
      pageview: false,
    });
    expect(window.Waline.init.mock.calls[0][0]).not.toHaveProperty('copyright');
  },
);

test('ignores a delayed module for a detached PJAX container', async () => {
  let resolve;
  const root = render({ path: '/old/' });
  await execute(
    root,
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  root.remove();
  await execute(render({ path: '/new/' }));
  resolve(window.Waline);
  await Promise.resolve();
  expect(window.Waline.init).toHaveBeenCalledTimes(1);
  expect(window.Waline.init.mock.calls[0][0].path).toBe('/new/');
});

test('follows manual/auto appearance and disconnects on destroy', async () => {
  await execute(render({ path: '/appearance/' }));
  const instance = window.__walineInstance;
  document.documentElement.setAttribute('data-appearance', 'dark');
  await Promise.resolve();
  expect(instance.update).toHaveBeenLastCalledWith({
    dark: 'html[data-appearance="dark"]',
    path: '/appearance/',
  });
  document.documentElement.setAttribute('data-appearance', 'auto');
  await Promise.resolve();
  expect(instance.update).toHaveBeenLastCalledWith({ dark: 'auto', path: '/appearance/' });
  instance.destroy();
  instance.update.mockClear();
  document.documentElement.setAttribute('data-appearance', 'light');
  await Promise.resolve();
  expect(instance.update).not.toHaveBeenCalled();
});

test.each([false, true, 'auto', '.dark'])('keeps explicit dark=%s', async (dark) => {
  await execute(render({ dark }));
  expect(window.Waline.init.mock.calls[0][0].dark).toBe(dark);
  document.documentElement.setAttribute('data-appearance', 'dark');
  await Promise.resolve();
  expect(window.__walineInstance.update).not.toHaveBeenCalled();
});

test('schema accepts supported extra languages and disabled emoji', () => {
  const validate = SchemaLoader.load(schema).getSchema(schema.$id);
  for (const lang of ['fr', 'fr-FR', 'es', 'es-MX']) {
    expect(
      validate.validate({
        type: 'waline',
        server_url: 'https://comments.example.com',
        emoji: false,
        lang,
      }),
    ).toBe(true);
  }
});
