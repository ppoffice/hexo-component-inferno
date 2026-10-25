const { resolveCdn, resolveFontCdn, resolveIconCdn } = require('./cdn');

test('MathJax and its font support independent local resource roots', () => {
  const providers = {
    cdn: 'cdnjs',
    cdn_overrides: {
      mathjax: '/blog/vendor/mathjax/${filename}',
      '@mathjax/mathjax-newcm-font': '/blog/vendor/mathjax-newcm-font/${filename}',
    },
  };
  expect(resolveCdn(providers, 'mathjax', '4.1.3', 'tex-mml-chtml.js')).toBe(
    '/blog/vendor/mathjax/tex-mml-chtml.js',
  );
  expect(resolveCdn(providers, '@mathjax/mathjax-newcm-font', '4.1.3', 'chtml.js')).toBe(
    '/blog/vendor/mathjax-newcm-font/chtml.js',
  );
});

test.each(['jsdelivr', 'unpkg', 'cdnjs', 'loli'])(
  'MathJax v4 and its separate font resolve with %s',
  (cdn) => {
    const prefix = {
      jsdelivr: 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/',
      unpkg: 'https://unpkg.com/mathjax@4.1.3/',
      cdnjs: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/4.1.3/',
      loli: 'https://cdnjs.loli.net/ajax/libs/mathjax/4.1.3/',
    }[cdn];
    expect(resolveCdn({ cdn }, 'mathjax', '4.1.3', 'tex-mml-chtml.js')).toBe(
      prefix + 'tex-mml-chtml.js',
    );
    const fontHost = cdn === 'unpkg' ? 'unpkg.com' : 'cdn.jsdelivr.net/npm';
    expect(resolveCdn({ cdn }, '@mathjax/mathjax-newcm-font', '4.1.3', 'chtml.js')).toBe(
      `https://${fontHost}/@mathjax/mathjax-newcm-font@4.1.3/chtml.js`,
    );
  },
);

test.each([
  ['algoliasearch', '5.60.0', 'lite/builds/browser.umd.js'],
  ['instantsearch.js', '4.120.0', 'instantsearch.production.min.js'],
])(
  'Algolia bundle %s preserves the selected provider host and path layout',
  (name, version, file) => {
    const expected = `https://cdnjs.loli.net/ajax/libs/${name}/${version}/${file}`;
    expect(resolveCdn({ cdn: 'loli' }, name, version, `dist/${file}`)).toBe(expected);
    expect(resolveCdn({ cdn: 'cdnjs' }, name, version, `dist/${file}`)).toBe(
      `https://cdnjs.cloudflare.com/ajax/libs/${name}/${version}/${file}`,
    );
    expect(
      resolveCdn(
        { cdn: 'loli', cdn_overrides: { [name]: 'jsdelivr' } },
        name,
        version,
        `dist/${file}`,
      ),
    ).toBe(`https://cdn.jsdelivr.net/npm/${name}@${version}/dist/${file}`);
    expect(resolveCdn({ cdn_overrides: { [name]: 'loli' } }, name, version, `dist/${file}`)).toBe(
      expected,
    );
    expect(
      resolveCdn(
        { cdn: 'loli', cdn_overrides: { [name]: 'unpkg' } },
        name,
        version,
        `dist/${file}`,
      ),
    ).toBe(`https://unpkg.com/${name}@${version}/dist/${file}`);
    expect(
      resolveCdn(
        { cdn: '[cdnjs]https://custom/${package}/${version}/${filename}' },
        name,
        version,
        `dist/${file}`,
      ),
    ).toBe(`https://custom/${name}/${version}/${file}`);
  },
);

test.each(['jsdelivr', 'unpkg', 'cdnjs', 'loli'])(
  'DisqusJS 3 browser assets use the %s path layout',
  (cdn) => {
    const prefix = {
      jsdelivr: 'https://cdn.jsdelivr.net/npm/disqusjs@3.2.2/dist/browser/',
      unpkg: 'https://unpkg.com/disqusjs@3.2.2/dist/browser/',
      cdnjs: 'https://cdnjs.cloudflare.com/ajax/libs/disqusjs/3.2.2/',
      loli: 'https://cdnjs.loli.net/ajax/libs/disqusjs/3.2.2/',
    }[cdn];
    for (const file of ['disqusjs.es2015.umd.min.js', 'styles/disqusjs.css']) {
      expect(resolveCdn({ cdn }, 'disqusjs', '3.2.2', `dist/browser/${file}`)).toBe(prefix + file);
    }
  },
);

test.each([
  ['moment', 'min/moment.min.js', 'moment.js/1/moment.min.js'],
  [
    'outdatedbrowser',
    'outdatedbrowser/outdatedbrowser.min.js',
    'outdated-browser/1/outdatedbrowser.min.js',
  ],
  ['highlight.js', 'dist/styles/theme.css', 'highlight.js/1/styles/theme.min.css'],
  ['highlight.js', 'styles/theme.min.css', 'highlight.js/1/styles/theme.min.css'],
  ['highlight.js', 'styles/theme.MIN.css', 'highlight.js/1/styles/theme.MIN.min.css'],
  ['highlight.js', 'styles/theme.CSS', 'highlight.js/1/styles/theme.CSS'],
  ['mathjax', 'unpacked/foo.min.A.MIN.js', 'mathjax/1/foo.A.js'],
  ['mathjax', 'unpacked/foo.MIN.js', 'mathjax/1/foo.MIN.js'],
  ['katex', 'dist/katex.min.js', 'KaTeX/1/katex.min.js'],
  ['pace-js', 'dist/pace.min.js', 'pace/1/pace.min.js'],
  ['clipboard', 'dist/clipboard.min.js', 'clipboard.js/1/clipboard.min.js'],
  ['cookieconsent', 'build/cookieconsent.min.js', 'cookieconsent/1/cookieconsent.min.js'],
  ['@waline/client', 'dist/waline.js', 'waline/1/waline.js'],
  ['unknown', 'dist/dist/file.js', 'unknown/1/dist/file.js'],
  ['unknown', 'Dist/file.js', 'unknown/1/Dist/file.js'],
  ['__proto__', 'dist/file.js', '__proto__/1/file.js'],
])('CDN.js fixture %s / %s retains its exact mapping', (_package, filename, expected) => {
  expect(resolveCdn({ cdn: 'cdnjs' }, _package, '1', filename)).toBe(
    `https://cdnjs.cloudflare.com/ajax/libs/${expected}`,
  );
  expect(resolveCdn({ cdn: 'loli' }, _package, '1', filename)).toBe(
    `https://cdnjs.loli.net/ajax/libs/${expected}`,
  );
});

test.each([undefined, null, false, 0, ''])('Falsy library provider %p selects jsdelivr', (cdn) => {
  expect(resolveCdn({ cdn }, 'pkg', '1', 'dist/a.js')).toBe(
    'https://cdn.jsdelivr.net/npm/pkg@1/dist/a.js',
  );
});

test('Only a literal unpkg selector enables its npm path fixtures', () => {
  expect(resolveCdn({ cdn: 'unpkg' }, 'disqusjs', '1', 'dist/a.min.js')).toBe(
    'https://unpkg.com/disqusjs@1/dist/a.js',
  );
  expect(resolveCdn({ cdn: Object('unpkg') }, 'disqusjs', '1', 'dist/a.min.js')).toBe(
    'https://unpkg.com/disqusjs@1/dist/a.min.js',
  );
  expect(
    resolveCdn(
      { cdn: 'https://unpkg.com/${package}@${version}/${filename}' },
      'disqusjs',
      '1',
      'dist/a.min.js',
    ),
  ).toBe('https://unpkg.com/disqusjs@1/dist/a.min.js');
  expect(resolveCdn({ cdn: 'unpkg' }, 'mathjax', '1', 'a.MIN.js')).toBe(
    'https://unpkg.com/mathjax@1/a.MIN.js',
  );
  expect(resolveCdn({ cdn: 'unpkg' }, 'mathjax', '1', 'a.min.B.MIN.js')).toBe(
    'https://unpkg.com/mathjax@1/a.B.js',
  );
  expect(resolveCdn({ cdn: 'unpkg' }, 'unknown', '1', 'dist/a.min.js')).toBe(
    'https://unpkg.com/unknown@1/dist/a.min.js',
  );
});

test('CDN.js mode is a case-sensitive prefix, independent of the host', () => {
  expect(
    resolveCdn({ cdn: '[cdnjs]custom/${package}/${filename}' }, 'katex', '1', 'dist/a.js'),
  ).toBe('custom/KaTeX/a.js');
  expect(
    resolveCdn({ cdn: '[CDNJS]custom/${package}/${filename}' }, 'katex', '1', 'dist/a.js'),
  ).toBe('[CDNJS]custom/katex/dist/a.js');
});

test.each([undefined, null, false, 0, ''])('Falsy override %p falls back', (override) => {
  expect(resolveCdn({ cdn: 'unpkg', cdn_overrides: { pkg: override } }, 'pkg', '1', 'file')).toBe(
    'https://unpkg.com/pkg@1/file',
  );
});

test('Overrides accept inherited and array properties, but not function bags', () => {
  const inherited = Object.create({ moment: 'cdnjs' });
  expect(resolveCdn({ cdn_overrides: inherited }, 'moment', '1', 'min/a.js')).toBe(
    'https://cdnjs.cloudflare.com/ajax/libs/moment.js/1/a.js',
  );
  const array = [];
  array.moment = 'unpkg';
  expect(resolveCdn({ cdn_overrides: array }, 'moment', '1', 'min/a.js')).toBe(
    'https://unpkg.com/moment@1/min/a.js',
  );
  const fn = () => {};
  fn.moment = 'cdnjs';
  expect(resolveCdn({ cdn_overrides: fn }, 'moment', '1', 'min/a.js')).toBe(
    'https://cdn.jsdelivr.net/npm/moment@1/min/a.js',
  );
});

test('A truthy override is read twice and does not consult providers.cdn', () => {
  const selected = jest.fn().mockReturnValueOnce('cdnjs').mockReturnValueOnce('unpkg');
  const overrides = Object.defineProperty({}, 'pkg', { get: selected });
  const providers = {
    cdn_overrides: overrides,
    get cdn() {
      throw new Error('unused');
    },
  };
  expect(resolveCdn(providers, 'pkg', '1', 'dist/a.js')).toBe('https://unpkg.com/pkg@1/dist/a.js');
  expect(selected).toHaveBeenCalledTimes(2);
});

test.each([
  ['cdnjs', 'moment', 42, 'https://cdn.jsdelivr.net/npm/moment@1/42'],
  ['cdnjs', 'pace-js', 42, 'https://cdn.jsdelivr.net/npm/pace@1/42'],
  ['cdnjs', 'katex', null, 'https://cdn.jsdelivr.net/npm/KaTeX@1/null'],
  ['cdnjs', 'clipboard', undefined, 'https://cdn.jsdelivr.net/npm/clipboard.js@1/undefined'],
  ['unpkg', 'disqusjs', null, 'https://cdn.jsdelivr.net/npm/disqusjs@1/null'],
])('Mapping failure %s / %s keeps assignment stage', (cdn, _package, filename, expected) => {
  expect(resolveCdn({ cdn }, _package, '1', filename)).toBe(expected);
});

test('Templates keep regex whitespace/case, replacement dollars and insertion order', () => {
  expect(
    resolveCdn(
      { cdn: '${\tPaCkAgE\n}/${VERSION}/${ filename }/${other}/${package x}' },
      'pkg',
      '1',
      'a',
    ),
  ).toBe('pkg/1/a/${other}/${package x}');
  expect(resolveCdn({ cdn: 'x/${package}/${version}/${filename}' }, '$&', '$$', '$&')).toBe(
    'x/${package}/$/${filename}',
  );
  expect(
    resolveCdn({ cdn: '${package}/${version}/${filename}' }, '${version}', '${filename}', 'a'),
  ).toBe('a/a/a');
  const replace = jest.fn(() => 'callback');
  expect(resolveCdn({ cdn: 'x/${package}' }, replace, '1', 'file')).toBe('x/callback');
  expect(replace).toHaveBeenCalledWith('${package}', 2, 'x/${package}');
});

test('Provider lookup keeps inherited-key errors and does not normalize unknown values', () => {
  expect(() => resolveCdn({ cdn: 'constructor' }, 'pkg', '1', 'file')).toThrow(TypeError);
  expect(() => resolveCdn({ cdn: {} }, 'pkg', '1', 'file')).toThrow(TypeError);
  expect(() => resolveCdn({ cdn: 'fixed' }, Symbol('package'), '1', 'file')).toThrow(TypeError);
  expect(() => resolveFontCdn({ fontcdn: null }, 'A')).toThrow(TypeError);
  for (const resolve of [resolveCdn, resolveFontCdn, resolveIconCdn]) {
    expect(() => resolve(null, 'A')).toThrow(TypeError);
  }
});

test.each([
  ['google', 'https://fonts.googleapis.com'],
  ['loli', 'https://fonts.loli.net'],
  ['fontim', 'https://fonts.font.im'],
  ['ustc', 'https://fonts.lug.ustc.edu.cn'],
])('Font provider %s retains its URL without encoding families', (fontcdn, root) => {
  expect(resolveFontCdn({ fontcdn }, 'A+B:400&display=swap', 'css2')).toBe(
    `${root}/css2?family=A+B:400&display=swap`,
  );
});

test.each([
  [undefined, 'css'],
  [null, 'null'],
  [false, 'false'],
  [0, '0'],
  ['', ''],
])('Font type %p only defaults for undefined', (type, expected) => {
  expect(resolveFontCdn({}, 'A', type)).toBe(`https://fonts.googleapis.com/${expected}?family=A`);
});

test('Font template defaults, literal placeholders and replacement strings remain distinct', () => {
  expect(resolveFontCdn({}, 'A')).toBe('https://fonts.googleapis.com/css?family=A');
  expect(resolveFontCdn({ fontcdn: '' }, 'A')).toBe('');
  expect(resolveFontCdn({ fontcdn: '${ FONTNAME }/${type}' }, '$&', '$$')).toBe('${ FONTNAME }/$');
  expect(resolveFontCdn({ fontcdn: '${fontname}/${type}' }, '${type}', 'css2')).toBe('css2/css2');
});

test('Icon URLs map known providers but otherwise return the original value', () => {
  expect(resolveIconCdn({})).toBe('https://use.fontawesome.com/releases/v6.0.0/css/all.css');
  expect(resolveIconCdn({ iconcdn: 'loli' })).toBe(
    'https://cdnjs.loli.net/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  );
  for (const iconcdn of [null, false, 0, '', [], {}, () => {}, Symbol('icon'), 'x/${type}']) {
    expect(resolveIconCdn({ iconcdn })).toBe(iconcdn);
  }
  expect(resolveIconCdn({ iconcdn: 'constructor' })).toBe(Object);
});

test('Resolving through frozen provider bags leaves the input configuration untouched', () => {
  const overrides = Object.freeze({ katex: 'cdnjs' });
  const providers = Object.freeze({ cdn: 'unpkg', cdn_overrides: overrides });
  const input = ['katex', '1', null];
  expect(resolveCdn(providers, ...input)).toBe('https://cdn.jsdelivr.net/npm/KaTeX@1/null');
  expect(input).toEqual(['katex', '1', null]);
  expect(providers).toEqual({ cdn: 'unpkg', cdn_overrides: { katex: 'cdnjs' } });
});
