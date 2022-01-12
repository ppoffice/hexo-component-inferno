const fs = require('fs');
const util = require('util');
const path = require('path');
const yaml = require('js-yaml');
const Hexo = require('hexo');
const register = require('./locals');

const rootDir = path.join(__dirname, '../../../fixture/site');
const hexo = new Hexo(rootDir, { silent: true });
const regex = new RegExp(/\[Function: bound (.*)\]/gi);

let siteConfig,
  themeConfig,
  pageConfigInSiteDir,
  postConfigInSiteDir,
  pageConfigInThemeDir,
  postConfigInThemeDir;

const basePageConfig = {
  title: 'about',
  comments: false,
  int: 10000,
  float: 0.0001,
  bool: true,
  str: '10000',
  empty: null,
  arr: [10000, 20000, 30000],
  obj: { field: 10000 },
  int_ex: 10000,
  float_ex: 0.0001,
  bool_ex: true,
  str_ex: '10000',
  empty_ex: null,
  arr_ex: [10000, 20000, 30000],
  obj_ex: { field: 10000 },
};

beforeAll(async () => {
  await hexo.init();
  await hexo.load();
  siteConfig = yaml.load(fs.readFileSync(path.join(hexo.base_dir, '_config.yml')));
  themeConfig = yaml.load(fs.readFileSync(path.join(hexo.theme_dir, '_config.yml')));
  pageConfigInSiteDir = yaml.load(fs.readFileSync(path.join(hexo.base_dir, '_config.page.yml')));
  postConfigInSiteDir = yaml.load(fs.readFileSync(path.join(hexo.base_dir, '_config.post.yml')));
  pageConfigInThemeDir = yaml.load(fs.readFileSync(path.join(hexo.theme_dir, '_config.page.yml')));
  postConfigInThemeDir = yaml.load(fs.readFileSync(path.join(hexo.theme_dir, '_config.post.yml')));
  register(hexo);
});

test('Register all helper functions to "locals.helper"', async () => {
  const Locals = hexo._generateLocals();
  const helpers = hexo.extend.helper.list();
  const locals = await hexo.extend.filter.exec('template_locals', new Locals('about/index.html'), {
    context: hexo,
  });
  expect(Object.keys(locals.helper).sort()).toEqual(Object.keys(helpers).concat('__', '_p').sort());
  for (const name in locals.helper) {
    expect(typeof locals.helper[name]).toBe('function');
    const match = regex.exec(util.inspect(locals.helper[name]));
    if (match && match.length > 1) {
      expect(match[1]).toBe(helpers[name].name);
    }
  }
});

test('Correctly merge theme config with site config', async () => {
  const Locals = hexo._generateLocals();
  const locals = await hexo.extend.filter.exec('template_locals', new Locals('about/index.html'), {
    context: hexo,
  });
  expect(locals.config.title).toBe(themeConfig.title);
  expect(locals.config.int).toBe(themeConfig.int);
  expect(locals.config.float).toBe(themeConfig.float);
  expect(locals.config.bool).toBe(themeConfig.bool);
  expect(locals.config.str).toBe(themeConfig.str);
  expect(locals.config.empty).toBe(themeConfig.empty);
  expect(locals.config.arr).toEqual(themeConfig.arr);
  expect(locals.config.obj).toEqual(themeConfig.obj);
  expect(locals.config.theme).toEqual(siteConfig.theme);
});

test('Page/post layout configs override theme and site configs', async () => {
  const Locals = hexo._generateLocals();
  const configs = [
    Object.assign({}, basePageConfig, { layout: 'page' }),
    Object.assign({}, basePageConfig, { layout: 'post' }),
  ];
  for (const page of configs) {
    const locals = await hexo.extend.filter.exec(
      'template_locals',
      new Locals('about/index.html', page),
      { context: hexo },
    );
    expect(locals.config.comments).toBeUndefined();
    // theme page/post layout configs override ones under site root
    const keys = ['title', 'int', 'float', 'bool', 'str', 'empty', 'arr', 'obj'];
    for (const key of keys) {
      expect(locals.config[key]).toEqual(
        page.layout === 'page' ? pageConfigInThemeDir[key] : postConfigInThemeDir[key],
      );
    }
    const keysEx = [
      'title_ex',
      'int_ex',
      'float_ex',
      'bool_ex',
      'str_ex',
      'empty_ex',
      'arr_ex',
      'obj_ex',
    ];
    for (const key of keysEx) {
      expect(locals.config[key]).toEqual(
        page.layout === 'page' ? pageConfigInSiteDir[key] : postConfigInSiteDir[key],
      );
    }
  }
});

test('Configs in page/post front-matter override all other config sources', async () => {
  const Locals = hexo._generateLocals();
  const configs = [
    Object.assign({}, basePageConfig, { __page: true, layout: 'page' }),
    Object.assign({}, basePageConfig, { __post: true, layout: 'post' }),
  ];
  for (const page of configs) {
    const locals = await hexo.extend.filter.exec(
      'template_locals',
      new Locals('about/index.html', page),
      { context: hexo },
    );
    expect(locals.config.title).toBe(
      page.layout === 'page' ? pageConfigInThemeDir.title : postConfigInThemeDir.title,
    );
    expect(locals.config.comments).toBeUndefined();
    [
      'int',
      'float',
      'bool',
      'str',
      'empty',
      'arr',
      'obj',
      'int_ex',
      'float_ex',
      'bool_ex',
      'str_ex',
      'empty_ex',
      'arr_ex',
      'obj_ex',
    ].forEach((key) => {
      expect(locals.config[key]).toEqual(page[key]);
    });
  }
});
