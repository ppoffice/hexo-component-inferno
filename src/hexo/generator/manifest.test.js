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
  expect(JSON.parse(result.data)).toEqual({
    ...manifest,
    icons: [
      { ...manifest.icons[0], src: '/1.png' },
      { ...manifest.icons[1], src: '/2.png' },
    ],
  });
});

test('Resolve the icons against the root of the site', async () => {
  const root = hexo.config.root;
  hexo.config.root = '/blog/';
  hexo.theme.config.head = {
    manifest: {
      icons: [{ src: '/img/icon.png', sizes: '192x192' }, { src: 'https://cdn/icon.png' }],
    },
  };
  const generator = hexo.extend.generator.get('manifest').bind(hexo);
  const data = JSON.parse((await generator(hexo.locals.toObject())).data);
  hexo.config.root = root;
  expect(data.start_url).toBe('/blog/index.html');
  expect(data.icons.map((icon) => icon.src)).toEqual([
    '/blog/img/icon.png',
    'https://cdn/icon.png',
  ]);
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
