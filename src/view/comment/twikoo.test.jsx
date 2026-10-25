/* eslint-env browser */
const { renderToString } = require('inferno-server');
const Twikoo = require('./twikoo');
const { SchemaLoader } = require('../../core/schema');
const schema = require('../../schema/comment/twikoo.json');

function render(element) {
  const root = document.createElement('div');
  root.innerHTML = renderToString(element);
  document.body.appendChild(root);
  // eslint-disable-next-line no-new-func
  new Function(root.querySelector('script').textContent)();
  return root;
}

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  window.twikoo = { init: jest.fn() };
});

test.each([
  [{ lang: 'en-US' }, { lang: 'ja' }, 'en-US'],
  [{}, { lang: 'ja' }, 'ja'],
  [{}, { language: 'zh-TW' }, 'zh-TW'],
  [{}, {}, 'en'],
])('pins the full SDK and preserves language precedence (%j, %j)', (comment, page, lang) => {
  const cdn = jest.fn(() => '/twikoo.js');
  render(
    <Twikoo.Cacheable
      comment={{ env_id: 'env', ...comment }}
      page={page}
      config={{ language: 'en' }}
      helper={{ cdn }}
    />,
  );
  expect(cdn).toHaveBeenCalledWith('twikoo', '2.0.17', 'dist/twikoo.all.min.js');
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(window.twikoo.init).toHaveBeenCalledWith({
    envId: 'env',
    lang,
    el: document.getElementById('twikoo'),
  });
});

test('passes URL, region and language safely to the async SDK', () => {
  const envId = 'https://comments.example.com/</script>';
  render(<Twikoo envId={envId} region="ap-guangzhou" lang="zh-CN" jsUrl="/twikoo.js" />);
  expect(window.twikoo.init).not.toHaveBeenCalled();
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(window.twikoo.init).toHaveBeenCalledWith({
    envId,
    region: 'ap-guangzhou',
    lang: 'zh-CN',
    el: document.getElementById('twikoo'),
  });
});

test('delayed SDK loading initializes only the current PJAX container', () => {
  const first = render(<Twikoo envId="old" jsUrl="/twikoo.js" />);
  first.remove();
  const second = render(<Twikoo envId="new" jsUrl="/twikoo.js" />);
  expect(document.head.querySelectorAll('script')).toHaveLength(1);
  document.head.querySelector('script').dispatchEvent(new Event('load'));
  expect(window.twikoo.init).toHaveBeenCalledTimes(1);
  expect(window.twikoo.init).toHaveBeenCalledWith({
    envId: 'new',
    el: second.querySelector('#twikoo'),
  });
  second.remove();
  const third = render(<Twikoo envId="third" jsUrl="/twikoo.js" />);
  expect(document.head.querySelectorAll('script')).toHaveLength(1);
  expect(window.twikoo.init).toHaveBeenLastCalledWith({
    envId: 'third',
    el: third.querySelector('#twikoo'),
  });
});

test('missing environment renders the configuration warning without loading the SDK', () => {
  const html = renderToString(<Twikoo jsUrl="/twikoo.js" />);
  expect(html).toContain('env_id');
  expect(html).not.toContain('<script');
});

test('keeps CloudBase and URL-based configuration compatible', () => {
  const loaded = SchemaLoader.load(schema).getSchema(schema.$id);
  const validate = (config) => loaded.validate(config);
  expect(validate({ type: 'twikoo', env_id: 'cloudbase-env', region: 'ap-guangzhou' })).toBe(true);
  expect(
    validate({
      type: 'twikoo',
      env_id: 'https://comments.example.com',
      region: null,
      lang: 'en-US',
    }),
  ).toBe(true);
  expect(validate({ type: 'twikoo' })).not.toBe(true);
});
