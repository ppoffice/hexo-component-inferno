const { renderToString } = require('inferno-server');
const AddThis = require('../share/addthis');
const BdShare = require('../share/bdshare');
const Gitment = require('../comment/gitment');
const SubscribeEmail = require('../widget/subscribe_email');
const Valine = require('../comment/valine');

test.each([
  ['share.addthis', <AddThis installUrl="/addthis.js" />],
  [
    'comment.gitment',
    <Gitment id="id" repo="repo" owner="owner" clientId="id" clientSecret="secret" />,
  ],
  [
    'widget.subscribe_email',
    <SubscribeEmail title="Subscribe" feedburnerId="id" buttonTitle="Go" />,
  ],
  ['comment.valine', <Valine appId="id" appKey="key" jsUrl="/valine.js" />],
])('Warn that %s is deprecated', (name, element) => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    renderToString(element);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(`hexo-component-inferno: ${name} is deprecated.`);
  } finally {
    warn.mockRestore();
  }
});

test('Baidu Share retains direct and cacheable rendering and warns only once', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const html = renderToString(<BdShare.Cacheable share={{ type: 'bdshare' }} />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'hexo-component-inferno: share.bdshare is deprecated. ' +
        'HTTP mixed content; use AddToAny or ShareThis.',
    );
    expect(html).toContain('class="bdsharebuttonbox"');
    expect(html).toContain('data-cmd="weixin"');
    expect(html).toContain('http://bdimg.share.baidu.com/static/api/js/share.js');
    expect(renderToString(<BdShare />)).toBe(html);
    expect(renderToString(<BdShare.Cacheable share={{ type: 'bdshare' }} />)).toBe(html);
    expect(warn).toHaveBeenCalledTimes(1);
  } finally {
    warn.mockRestore();
  }
});

test('Baidu Share schema keeps the legacy configuration and marks it deprecated', () => {
  const Ajv = require('ajv');
  const schema = require('../../schema/share/bdshare.json');
  const validate = new Ajv().compile(schema);
  expect(validate({ type: 'bdshare' })).toBe(true);
  expect(validate({})).toBe(false);
  expect(validate({ type: 'addtoany' })).toBe(false);
  expect(schema.description).toMatch(/deprecated/i);
  expect(schema.description).not.toMatch(/discontinued|shut down/);
});

describe('Configuration of the deprecated components', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('AddThis', () => {
    expect(renderToString(<AddThis.Cacheable share={{ install_url: '/addthis.js' }} />)).toContain(
      'src="/addthis.js"',
    );
    expect(renderToString(<AddThis.Cacheable share={{}} />)).toContain('notification is-danger');
  });

  test('Subscribe by email', () => {
    const helper = { __: (key) => key };
    const html = renderToString(
      <SubscribeEmail.Cacheable
        widget={{ feedburner_id: 'feed', description: 'Hint' }}
        helper={helper}
      />,
    );
    expect(html).toContain('value="feed"');
    expect(html).toContain('<p class="help">Hint</p>');
    expect(html).toContain('widget.subscribe_email');
    expect(
      renderToString(
        <SubscribeEmail.Cacheable widget={{ feedburner_id: 'feed' }} helper={helper} />,
      ),
    ).not.toContain('class="help"');
  });

  test('Gitment uses the hash of the page path as the ID', () => {
    const html = renderToString(
      <Gitment.Cacheable
        comment={{ owner: 'owner', repo: 'repo', client_id: 'id', client_secret: 'secret' }}
        page={{ path: 'post/' }}
      />,
    );
    expect(html).toContain('id: "0d67b10a60929a0d4bd9902d50d70dd9"'); // md5('post/')
  });

  test('Valine', () => {
    const html = renderToString(
      <Valine.Cacheable
        comment={{ app_id: 'id', app_key: 'key' }}
        helper={{ cdn: (name, version, file) => `/cdn/${name}@${version}/${file}` }}
        page={{}}
        config={{ language: 'en' }}
      />,
    );
    expect(html).toContain('/cdn/valine@1.5.3/dist/Valine.min.js');
    expect(html).toContain('"en"');
  });
});
