const fs = require('fs');
const util = require('util');
const path = require('path');
const yaml = require('js-yaml');
const Hexo = require('hexo');
const register = require('./locals');

const rootDir = path.join(__dirname, '../../../fixture/site');
const hexo = new Hexo(rootDir, { silent: true });
const regex = new RegExp(/\[Function: bound (.*)\]/gi);

let siteConfig, themeConfig, pageConfig, postConfig;
const basePageConfig = {
    title: 'about',
    comments: false,
    int: 4,
    float: 0.4,
    bool: false,
    str: '4',
    empty: null,
    arr: [10, 20, 30],
    obj: { field: 10 }
};

beforeAll(async () => {
    await hexo.init();
    await hexo.load();
    siteConfig = yaml.safeLoad(fs.readFileSync(path.join(hexo.base_dir, '_config.yml')));
    themeConfig = yaml.safeLoad(fs.readFileSync(path.join(hexo.theme_dir, '_config.yml')));
    pageConfig = yaml.safeLoad(fs.readFileSync(path.join(hexo.theme_dir, '_config.page.yml')));
    postConfig = yaml.safeLoad(fs.readFileSync(path.join(hexo.theme_dir, '_config.post.yml')));
    register(hexo);
});

test('Register all helper functions to "locals.helper"', async () => {
    const Locals = hexo._generateLocals();
    const helpers = hexo.extend.helper.list();
    const locals = await hexo.extend.filter.exec('template_locals',
        new Locals('about/index.html'), { context: hexo });
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
    const locals = await hexo.extend.filter.exec('template_locals',
        new Locals('about/index.html'), { context: hexo });
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

test('Correctly merge theme config with page/post config', async () => {
    const Locals = hexo._generateLocals();
    const configs = [
        Object.assign({}, basePageConfig, { layout: 'page' }),
        Object.assign({}, basePageConfig, { layout: 'post' })
    ];
    for (const page of configs) {
        const locals = await hexo.extend.filter.exec('template_locals',
            new Locals('about/index.html', page), { context: hexo });
        expect(locals.config.comments).toBeUndefined();
        const keys = ['title', 'int', 'float', 'bool', 'str', 'empty', 'arr', 'obj'];
        for (const key of keys) {
            expect(locals.config[key]).toEqual(page.layout === 'page' ? pageConfig[key] : postConfig[key]);
        }
    }
});

test('Correctly merge theme config with page/post layout config', async () => {
    const Locals = hexo._generateLocals();
    const configs = [
        Object.assign({}, basePageConfig, { __page: true, layout: 'page' }),
        Object.assign({}, basePageConfig, { __post: true, layout: 'post' })
    ];
    for (const page of configs) {
        const locals = await hexo.extend.filter.exec('template_locals',
            new Locals('about/index.html', page), { context: hexo });
        expect(locals.config.title).toBe(page.layout === 'page' ? pageConfig.title : postConfig.title);
        expect(locals.config.comments).toBeUndefined();
        ['int', 'float', 'bool', 'str', 'empty', 'arr', 'obj'].forEach(key => {
            expect(locals.config[key]).toEqual(page[key]);
        });
    }
});
