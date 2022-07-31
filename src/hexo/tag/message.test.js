const { join } = require('path');
const Hexo = require('hexo');
const cheerio = require('cheerio');
const { minify } = require('html-minifier');
const register = require('./message');

const rootDir = join(__dirname, '../../../fixture/site');
const hexo = new Hexo(rootDir, { silent: true });
const cheerioOptions = { xml: { normalizeWhitespace: true } };
const minifierOptions = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  keepClosingSlash: true,
};

beforeAll(async () => {
  await hexo.init();
  await hexo.load();
  register(hexo);
  await hexo.loadPlugin(require.resolve('hexo-renderer-marked'));
});

test('create default message', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  let source = '{% message %}**content**{% endmessage %}';
  let actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<article class="message"> <div class="message-body"> ' +
      '<p><strong>content</strong></p> </div> </article>',
  );

  source = '{% message %}\n# title\n{% endmessage %}';
  actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<article class="message"> <div class="message-body"> ' +
      '<h1 id="title"><a href="#title" class="headerlink" title="title"/>title</h1> ' +
      '</div> </article>',
  );
});

test('create message with different colors', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  for (const color of ['dark', 'primary', 'link', 'info', 'success', 'warning', 'danger']) {
    const source = `{% message color:${color} %}content{% endmessage %}`;
    const actual = cheerio.load(await render(source), cheerioOptions, false).html();
    expect(minify(actual, minifierOptions)).toEqual(
      `<article class="message is-${color}"> <div class="message-body"> <p>content</p> ` +
        '</div> </article>',
    );
  }
});

test('create message with different sizes', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  for (const size of ['small', 'medium', 'large']) {
    const source = `{% message size:${size} %}content{% endmessage %}`;
    const actual = cheerio.load(await render(source), cheerioOptions, false).html();
    expect(minify(actual, minifierOptions)).toEqual(
      `<article class="message is-${size}"> <div class="message-body"> <p>content</p> ` +
        '</div> </article>',
    );
  }
});

test('create message with an icon', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  const source = '{% message "icon:fas fas-file" %}content{% endmessage %}';
  const actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<article class="message"> <div class="message-header"><p>' +
      '<i class="fas fas-file mr-2"/></p> </div> <div class="message-body"> <p>content</p> ' +
      '</div> </article>',
  );
});

test('create message with a title', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  const source = '{% message "title:*message title*" %}content{% endmessage %}';
  const actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<article class="message"> <div class="message-header"><p>' +
      '<em>message title</em></p> </div> <div class="message-body"> <p>content</p> ' +
      '</div> </article>',
  );
});

test('create message with all properties', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  const source =
    '{% message color:success size:small "icon:fas fas-file" ' +
    '"title:*message title*" %}content{% endmessage %}';
  const actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<article class="message is-success is-small"> <div class="message-header"><p>' +
      '<i class="fas fas-file mr-2"/><em>message title</em></p> </div> ' +
      '<div class="message-body"> <p>content</p> </div> </article>',
  );
});
