const { readFileSync } = require('fs');
const { join } = require('path');
const Hexo = require('hexo');
const register = require('./assets');

const rootDir = join(__dirname, '../../../fixture/site');
const assetsDir = join(__dirname, '../../../asset');
const hexo = new Hexo(rootDir, { silent: true });

beforeAll(async () => {
  await hexo.init();
  await hexo.load();
  register(hexo);
});

test("Export files from asset/ folder that are not in theme's source folder", async () => {
  const locals = hexo.locals.toObject();
  const generator = hexo.extend.generator.get('static_assets').bind(hexo);
  const result = await generator(locals);
  ['/js/algolia.js', '/js/google_cse.js'].forEach((file) => {
    expect(result.find((route) => route.path === file)).not.toBeUndefined();
    expect(result.find((route) => route.path === file).data).toBe(
      readFileSync(join(assetsDir, file), { encoding: 'utf-8' }),
    );
  });
  ['/js/insight.js', '/js/.eslintrc.json'].forEach((file) => {
    expect(result.find((route) => route.path === file)).toBeUndefined();
  });
});
