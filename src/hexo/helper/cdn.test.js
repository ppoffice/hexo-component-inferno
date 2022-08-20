const path = require('path');
const Hexo = require('hexo');
const register = require('./cdn');

const rootDir = path.join(__dirname, '../../../fixture/site');
const hexo = new Hexo(rootDir, { silent: true });

beforeAll(async () => {
  await hexo.init();
  await hexo.load();
  register(hexo);
});

describe('Get JavaScript library URL', () => {
  let cases;

  beforeEach(async () => {
    const cdn = hexo.extend.helper.get('cdn').bind(hexo);
    cases = [
      () => cdn('jquery', '3.0.0', 'dist/jquery.min.js'),
      () => cdn('moment', '2.24.0', 'min/moment.min.js'),
      () => cdn('outdatedbrowser', '1.1.5', 'outdatedbrowser/outdatedbrowser.min.js'),
      () => cdn('highlight.js', '9.18.1', 'styles/a11y-dark.css'),
      () => cdn('mathjax', '2.7.6', 'unpacked/MathJax.min.js'),
      () => cdn('pace-js', '1.0.2', 'pace.min.js'),
      () => cdn('katex', '0.11.1', 'dist/katex.min.js'),
      () => cdn('clipboard', '2.0.6', 'dist/clipboard.min.js'),
      () => cdn('disqusjs', '1.3.0', 'dist/disqus.min.js'),
      () => cdn('algoliasearch', '4.0.3', 'dist/algoliasearch-lite.umd.js'),
      () => cdn('instantsearch.js', '4.3.1', 'dist/instantsearch.production.min.js'),
      () => cdn('cookieconsent', '3.1.1', 'build/cookieconsent.min.js'),
      () => cdn('@waline/client', '2.6.3', 'dist/waline.js'),
      () => cdn('twikoo', '1.6.6', 'dist/twikoo.all.min.js'),
      () => cdn('example', '1.0.0', 'example.js'),
    ];
  });

  test('jsdelivr', () => {
    const expected = [
      'https://cdn.jsdelivr.net/npm/jquery@3.0.0/dist/jquery.min.js',
      'https://cdn.jsdelivr.net/npm/moment@2.24.0/min/moment.min.js',
      'https://cdn.jsdelivr.net/npm/outdatedbrowser@1.1.5/outdatedbrowser/outdatedbrowser.min.js',
      'https://cdn.jsdelivr.net/npm/highlight.js@9.18.1/styles/a11y-dark.css',
      'https://cdn.jsdelivr.net/npm/mathjax@2.7.6/unpacked/MathJax.min.js',
      'https://cdn.jsdelivr.net/npm/pace-js@1.0.2/pace.min.js',
      'https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.js',
      'https://cdn.jsdelivr.net/npm/clipboard@2.0.6/dist/clipboard.min.js',
      'https://cdn.jsdelivr.net/npm/disqusjs@1.3.0/dist/disqus.min.js',
      'https://cdn.jsdelivr.net/npm/algoliasearch@4.0.3/dist/algoliasearch-lite.umd.js',
      'https://cdn.jsdelivr.net/npm/instantsearch.js@4.3.1/dist/instantsearch.production.min.js',
      'https://cdn.jsdelivr.net/npm/cookieconsent@3.1.1/build/cookieconsent.min.js',
      'https://cdn.jsdelivr.net/npm/@waline/client@2.6.3/dist/waline.js',
      'https://cdn.jsdelivr.net/npm/twikoo@1.6.6/dist/twikoo.all.min.js',
      'https://cdn.jsdelivr.net/npm/example@1.0.0/example.js',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('unpkg', () => {
    hexo.config.providers = { cdn: 'unpkg' };
    const expected = [
      'https://unpkg.com/jquery@3.0.0/dist/jquery.min.js',
      'https://unpkg.com/moment@2.24.0/min/moment.min.js',
      'https://unpkg.com/outdatedbrowser@1.1.5/outdatedbrowser/outdatedbrowser.min.js',
      'https://unpkg.com/highlight.js@9.18.1/styles/a11y-dark.css',
      'https://unpkg.com/mathjax@2.7.6/unpacked/MathJax.js',
      'https://unpkg.com/pace-js@1.0.2/pace.min.js',
      'https://unpkg.com/katex@0.11.1/dist/katex.min.js',
      'https://unpkg.com/clipboard@2.0.6/dist/clipboard.min.js',
      'https://unpkg.com/disqusjs@1.3.0/dist/disqus.js',
      'https://unpkg.com/algoliasearch@4.0.3/dist/algoliasearch-lite.umd.js',
      'https://unpkg.com/instantsearch.js@4.3.1/dist/instantsearch.production.min.js',
      'https://unpkg.com/cookieconsent@3.1.1/build/cookieconsent.min.js',
      'https://unpkg.com/@waline/client@2.6.3/dist/waline.js',
      'https://unpkg.com/twikoo@1.6.6/dist/twikoo.all.min.js',
      'https://unpkg.com/example@1.0.0/example.js',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('cdnjs', () => {
    hexo.config.providers = { cdn: 'cdnjs' };
    const expected = [
      'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0/jquery.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/outdated-browser/1.1.5/outdatedbrowser.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.1/styles/a11y-dark.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.6/MathJax.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pace/1.0.2/pace.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.11.1/katex.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.6/clipboard.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/disqusjs/1.3.0/disqus.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/algoliasearch/4.0.3/algoliasearch-lite.umd.js',
      'https://cdnjs.cloudflare.com/ajax/libs/instantsearch.js/4.3.1/instantsearch.production.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/cookieconsent/3.1.1/cookieconsent.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/waline/2.6.3/waline.js',
      'https://cdnjs.cloudflare.com/ajax/libs/twikoo/1.6.6/twikoo.all.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/example/1.0.0/example.js',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('loli', () => {
    hexo.config.providers = { cdn: 'loli' };
    const expected = [
      'https://cdnjs.loli.net/ajax/libs/jquery/3.0.0/jquery.min.js',
      'https://cdnjs.loli.net/ajax/libs/moment.js/2.24.0/moment.min.js',
      'https://cdnjs.loli.net/ajax/libs/outdated-browser/1.1.5/outdatedbrowser.min.js',
      'https://cdnjs.loli.net/ajax/libs/highlight.js/9.18.1/styles/a11y-dark.min.css',
      'https://cdnjs.loli.net/ajax/libs/mathjax/2.7.6/MathJax.js',
      'https://cdnjs.loli.net/ajax/libs/pace/1.0.2/pace.min.js',
      'https://cdnjs.loli.net/ajax/libs/KaTeX/0.11.1/katex.min.js',
      'https://cdnjs.loli.net/ajax/libs/clipboard.js/2.0.6/clipboard.min.js',
      'https://cdnjs.loli.net/ajax/libs/disqusjs/1.3.0/disqus.min.js',
      'https://cdnjs.loli.net/ajax/libs/algoliasearch/4.0.3/algoliasearch-lite.umd.js',
      'https://cdnjs.loli.net/ajax/libs/instantsearch.js/4.3.1/instantsearch.production.min.js',
      'https://cdnjs.loli.net/ajax/libs/cookieconsent/3.1.1/cookieconsent.min.js',
      'https://cdnjs.loli.net/ajax/libs/waline/2.6.3/waline.js',
      'https://cdnjs.loli.net/ajax/libs/twikoo/1.6.6/twikoo.all.min.js',
      'https://cdnjs.loli.net/ajax/libs/example/1.0.0/example.js',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('Custom CDN', () => {
    hexo.config.providers = { cdn: 'https://my.cdn/${ package }@${ version }/${ filename }' };
    const expected = [
      'https://my.cdn/jquery@3.0.0/dist/jquery.min.js',
      'https://my.cdn/moment@2.24.0/min/moment.min.js',
      'https://my.cdn/outdatedbrowser@1.1.5/outdatedbrowser/outdatedbrowser.min.js',
      'https://my.cdn/highlight.js@9.18.1/styles/a11y-dark.css',
      'https://my.cdn/mathjax@2.7.6/unpacked/MathJax.min.js',
      'https://my.cdn/pace-js@1.0.2/pace.min.js',
      'https://my.cdn/katex@0.11.1/dist/katex.min.js',
      'https://my.cdn/clipboard@2.0.6/dist/clipboard.min.js',
      'https://my.cdn/disqusjs@1.3.0/dist/disqus.min.js',
      'https://my.cdn/algoliasearch@4.0.3/dist/algoliasearch-lite.umd.js',
      'https://my.cdn/instantsearch.js@4.3.1/dist/instantsearch.production.min.js',
      'https://my.cdn/cookieconsent@3.1.1/build/cookieconsent.min.js',
      'https://my.cdn/@waline/client@2.6.3/dist/waline.js',
      'https://my.cdn/twikoo@1.6.6/dist/twikoo.all.min.js',
      'https://my.cdn/example@1.0.0/example.js',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('Custom CDN.js-style CDN', () => {
    hexo.config.providers = {
      cdn: '[cdnjs]https://my.cdn/ajax/libs/${ package }/${ version }/${ filename }',
    };
    const expected = [
      'https://my.cdn/ajax/libs/jquery/3.0.0/jquery.min.js',
      'https://my.cdn/ajax/libs/moment.js/2.24.0/moment.min.js',
      'https://my.cdn/ajax/libs/outdated-browser/1.1.5/outdatedbrowser.min.js',
      'https://my.cdn/ajax/libs/highlight.js/9.18.1/styles/a11y-dark.min.css',
      'https://my.cdn/ajax/libs/mathjax/2.7.6/MathJax.js',
      'https://my.cdn/ajax/libs/pace/1.0.2/pace.min.js',
      'https://my.cdn/ajax/libs/KaTeX/0.11.1/katex.min.js',
      'https://my.cdn/ajax/libs/clipboard.js/2.0.6/clipboard.min.js',
      'https://my.cdn/ajax/libs/disqusjs/1.3.0/disqus.min.js',
      'https://my.cdn/ajax/libs/algoliasearch/4.0.3/algoliasearch-lite.umd.js',
      'https://my.cdn/ajax/libs/instantsearch.js/4.3.1/instantsearch.production.min.js',
      'https://my.cdn/ajax/libs/cookieconsent/3.1.1/cookieconsent.min.js',
      'https://my.cdn/ajax/libs/waline/2.6.3/waline.js',
      'https://my.cdn/ajax/libs/twikoo/1.6.6/twikoo.all.min.js',
      'https://my.cdn/ajax/libs/example/1.0.0/example.js',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });
});

describe('Get web font URL', () => {
  let cases;

  beforeEach(async () => {
    const fontcdn = hexo.extend.helper.get('fontcdn').bind(hexo);
    cases = [
      () => fontcdn('Ubuntu:400,600|Source+Code+Pro', 'css'),
      () => fontcdn('Roboto:wght@100;400&display=swap', 'css2'),
    ];
  });

  test('google', () => {
    hexo.config.providers = { fontcdn: 'google' };
    const expected = [
      'https://fonts.googleapis.com/css?family=Ubuntu:400,600|Source+Code+Pro',
      'https://fonts.googleapis.com/css2?family=Roboto:wght@100;400&display=swap',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('loli', () => {
    hexo.config.providers = { fontcdn: 'loli' };
    const expected = [
      'https://fonts.loli.net/css?family=Ubuntu:400,600|Source+Code+Pro',
      'https://fonts.loli.net/css2?family=Roboto:wght@100;400&display=swap',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('fontim', () => {
    hexo.config.providers = { fontcdn: 'fontim' };
    const expected = [
      'https://fonts.font.im/css?family=Ubuntu:400,600|Source+Code+Pro',
      'https://fonts.font.im/css2?family=Roboto:wght@100;400&display=swap',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('ustc', () => {
    hexo.config.providers = { fontcdn: 'ustc' };
    const expected = [
      'https://fonts.lug.ustc.edu.cn/css?family=Ubuntu:400,600|Source+Code+Pro',
      'https://fonts.lug.ustc.edu.cn/css2?family=Roboto:wght@100;400&display=swap',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('Custom web font CDN', () => {
    hexo.config.providers = { fontcdn: 'https://my.cdn/${ type }?family=${ fontname }' };
    const expected = [
      'https://my.cdn/css?family=Ubuntu:400,600|Source+Code+Pro',
      'https://my.cdn/css2?family=Roboto:wght@100;400&display=swap',
    ];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });
});

describe('Get icon font URL', () => {
  let cases;

  beforeEach(async () => {
    const iconcdn = hexo.extend.helper.get('iconcdn').bind(hexo);
    cases = [() => iconcdn()];
  });

  test('fontawesome', () => {
    hexo.config.providers = { iconcdn: 'fontawesome' };
    const expected = ['https://use.fontawesome.com/releases/v6.0.0/css/all.css'];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('loli', () => {
    hexo.config.providers = { iconcdn: 'loli' };
    const expected = ['https://cdnjs.loli.net/ajax/libs/font-awesome/6.0.0/css/all.min.css'];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });

  test('Custom web font CDN', () => {
    hexo.config.providers = { iconcdn: 'https://my.cdn/icon' };
    const expected = ['https://my.cdn/icon'];
    cases.forEach((func, i) => expect(func()).toBe(expected[i]));
  });
});
