const { join } = require('path');
const Hexo = require('hexo');
const { minify } = require('html-minifier');
const cheerio = require('cheerio');
const register = require('./tabs');

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

test('create default tabs', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  let source = '{% tabs %}<!--tab id:tab1-->**content**<!--endtab-->{% endtabs %}';
  let actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<div class="tabs my-3"> <ul class="mx-0 my-0"> <li> <a href="#tab1"> </a> </li> </ul> ' +
      '</div> <div id="tab1" class="tab-content is-hidden"> <p><strong>content</strong></p> </div>',
  );

  source = `{% tabs %}
  <!-- tab --># title 1<!-- endtab -->
  <!-- tab --># title 2<!-- endtab -->
  {% endtabs %}`;
  const $ = cheerio.load(await render(source), cheerioOptions, false);
  const [tabId1, tabId2] = $('.tab-content')
    .get()
    .map((element) => $(element).attr('id'));
  actual = $.html();
  expect(minify(actual, minifierOptions)).toEqual(
    `<div class="tabs my-3"> <ul class="mx-0 my-0"> <li> <a href="#${tabId1}"> </a> ` +
      `</li><li> <a href="#${tabId2}"> </a> </li> </ul> </div> ` +
      `<div id="${tabId1}" class="tab-content is-hidden"> <h1 id="title-1">` +
      '<a href="#title-1" class="headerlink" title="title 1"/>title 1</h1> </div>' +
      `<div id="${tabId2}" class="tab-content is-hidden"> <h1 id="title-2">` +
      '<a href="#title-2" class="headerlink" title="title 2"/>title 2</h1> </div>',
  );
});

test('create tabs with different alignment', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  for (const align of ['left', 'centered', 'right', 'fullwidth']) {
    const source = `{% tabs align:${align} %}<!--tab id:tab1-->content<!--endtab-->{% endtabs %}`;
    const actual = cheerio.load(await render(source), cheerioOptions, false).html();
    expect(minify(actual, minifierOptions)).toEqual(
      `<div class="tabs my-3 is-${align}"> <ul class="mx-0 my-0"> <li> <a href="#tab1"> </a> ` +
        '</li> </ul> </div> <div id="tab1" class="tab-content is-hidden"> ' +
        '<p>content</p> </div>',
    );
  }
});

test('create tabs with different sizes', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  for (const size of ['small', 'medium', 'large']) {
    const source = `{% tabs size:${size} %}<!--tab id:tab1-->content<!--endtab-->{% endtabs %}`;
    const actual = cheerio.load(await render(source), cheerioOptions, false).html();
    expect(minify(actual, minifierOptions)).toEqual(
      `<div class="tabs my-3 is-${size}"> <ul class="mx-0 my-0"> <li> <a href="#tab1"> </a> ` +
        '</li> </ul> </div> <div id="tab1" class="tab-content is-hidden"> ' +
        '<p>content</p> </div>',
    );
  }
});

test('create tabs with different styles', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  for (const style of ['boxed', 'toggle', 'toggle-rounded']) {
    const source = `{% tabs style:${style} %}<!--tab id:tab1-->content<!--endtab-->{% endtabs %}`;
    const actual = cheerio.load(await render(source), cheerioOptions, false).html();
    const classname = style === 'toggle-rounded' ? 'toggle is-toggle-rounded' : style;
    expect(minify(actual, minifierOptions)).toEqual(
      `<div class="tabs my-3 is-${classname}"> <ul class="mx-0 my-0"> <li> <a href="#tab1"> </a> ` +
        '</li> </ul> </div> <div id="tab1" class="tab-content is-hidden"> ' +
        '<p>content</p> </div>',
    );
  }
});

test('create tabs with active status', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  const source = `{% tabs %}
  <!-- tab id:tab1 -->tab 1<!-- endtab -->
  <!-- tab id:tab2 active -->tab 2<!-- endtab -->
  {% endtabs %}`;
  const actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<div class="tabs my-3"> <ul class="mx-0 my-0"> <li> <a href="#tab1"> </a> ' +
      '</li><li class="is-active"> <a href="#tab2"> </a> </li> </ul> </div> ' +
      '<div id="tab1" class="tab-content is-hidden"> <p>tab 1</p> </div>' +
      '<div id="tab2" class="tab-content"> <p>tab 2</p> </div>',
  );
});

test('create tabs with a title', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  const source = '{% tabs %}<!--tab id:tab1 "title:Tab Title"-->tab<!--endtab-->{% endtabs %}';
  const actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<div class="tabs my-3"> <ul class="mx-0 my-0"> <li> <a href="#tab1"> <p>Tab Title</p> </a> ' +
      '</li> </ul> </div> <div id="tab1" class="tab-content is-hidden"> <p>tab</p> </div>',
  );
});

test('create tabs with an icon', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  const source = '{% tabs %}<!--tab id:tab1 "icon:fab fa-github"-->tab<!--endtab-->{% endtabs %}';
  const actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<div class="tabs my-3"> <ul class="mx-0 my-0"> <li> <a href="#tab1"> ' +
      '<span class="icon is-small ml-0"> <i class="fab fa-github" aria-hidden="true"/> ' +
      '</span> </a> </li> </ul> </div> <div id="tab1" class="tab-content is-hidden"> ' +
      '<p>tab</p> </div>',
  );
});

test('create tabs with all properties', async () => {
  const render = hexo.extend.tag.render.bind(hexo.extend.tag);

  const source = `{% tabs align:fullwidth 'size:large' style:boxed %}
  <!-- tab id:tab1 "icon:fas\\ fa-file" -->tab 1<!-- endtab -->
  <!-- tab id:tab2 active 'title:Tim\\'s Tab' -->tab 2<!-- endtab -->
  {% endtabs %}`;
  const actual = cheerio.load(await render(source), cheerioOptions, false).html();
  expect(minify(actual, minifierOptions)).toEqual(
    '<div class="tabs my-3 is-fullwidth is-large is-boxed"> <ul class="mx-0 my-0"> <li> ' +
      '<a href="#tab1"> <span class="icon is-small ml-0"> ' +
      '<i class="fas\\ fa-file" aria-hidden="true"/> </span> </a> </li><li class="is-active"> ' +
      '<a href="#tab2"> <p>Tim&apos;s Tab</p> </a> </li> </ul> </div> ' +
      '<div id="tab1" class="tab-content is-hidden"> <p>tab 1</p> </div>' +
      '<div id="tab2" class="tab-content"> <p>tab 2</p> </div>',
  );
});
