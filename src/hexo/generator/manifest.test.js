const { join } = require('path');
const Hexo = require('hexo');
const register = require('./manifest');

const rootDir = join(__dirname, '../../../fixture/site');
const hexo = new Hexo(rootDir, { silent: true });

beforeAll(async () => {
  await hexo.init();
  await hexo.load();
  register(hexo);
});

test('Generate manifest.json according to theme configuration', async () => {
  const manifest = {
    name: 'name',
    short_name: 'short_name',
    start_url: 'start_url',
    theme_color: '#000000',
    background_color: '#111111',
    display: 'standalone',
    icons: [
      {
        src: '1.png',
        sizes: '128x128 256x256',
        type: 'image/png',
      },
      {
        src: '2.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
  hexo.theme.config.head = { manifest };
  const locals = hexo.locals.toObject();
  const generator = hexo.extend.generator.get('manifest').bind(hexo);
  const result = await generator(locals);
  expect(result.path).toEqual('/manifest.json');
  expect(JSON.parse(result.data)).toEqual(manifest);
});

test('Generate manifest.json when theme configuration is empty', async () => {
  hexo.theme.config.head = {};
  const locals = hexo.locals.toObject();
  const generator = hexo.extend.generator.get('manifest').bind(hexo);
  const result = await generator(locals);
  expect(result.path).toEqual('/manifest.json');
  expect(JSON.parse(result.data)).toEqual({
    name: 'site title',
    start_url: '/index.html',
  });
});
