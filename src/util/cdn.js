/**
 * Internal CDN URL resolution. Provider definitions and npm/CDN path fixtures live here; Hexo's
 * registration adapter only reads the calling page's provider bag. No Hexo initialization or I/O.
 * @module util/cdn
 * @private
 */
const PROVIDERS = {
  LIBRARY: {
    cdnjs: '[cdnjs]https://cdnjs.cloudflare.com/ajax/libs/${ package }/${ version }/${ filename }',
    loli: '[cdnjs]https://cdnjs.loli.net/ajax/libs/${ package }/${ version }/${ filename }',
    jsdelivr: 'https://cdn.jsdelivr.net/npm/${ package }@${ version }/${ filename }',
    unpkg: 'https://unpkg.com/${ package }@${ version }/${ filename }',
  },
  FONT: {
    google: 'https://fonts.googleapis.com/${ type }?family=${ fontname }',
    loli: 'https://fonts.loli.net/${ type }?family=${ fontname }',
    fontim: 'https://fonts.font.im/${ type }?family=${ fontname }',
    ustc: 'https://fonts.lug.ustc.edu.cn/${ type }?family=${ fontname }',
  },
  ICON: {
    loli: 'https://cdnjs.loli.net/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    fontawesome: 'https://use.fontawesome.com/releases/v6.0.0/css/all.css',
  },
};

const CDNJS_FIXTURES = {
  moment: (ver, fname) => ['moment.js', ver, fname.startsWith('min/') ? fname.substr(4) : fname],
  outdatedbrowser: (ver, fname) => [
    'outdated-browser',
    ver,
    fname.startsWith('outdatedbrowser/') ? fname.substr(16) : fname,
  ],
  'highlight.js': (ver, fname) => [
    'highlight.js',
    ver,
    fname.endsWith('.css') && fname.indexOf('.min.') === -1
      ? fname.substr(0, fname.length - 4) + '.min.css'
      : fname,
  ],
  mathjax: (ver, fname) => [
    'mathjax',
    ver,
    (() => {
      fname = fname.startsWith('unpacked/') ? fname.substr(9) : fname;
      return fname.indexOf('.min.') > -1 ? fname.replace(/\.min\./gi, '.') : fname;
    })(),
  ],
  katex: (ver, fname) => ['KaTeX', ver, fname],
  'pace-js': (ver, fname) => ['pace', ver, fname],
  clipboard: (ver, fname) => ['clipboard.js', ver, fname],
  cookieconsent: (ver, fname) => [
    'cookieconsent',
    ver,
    fname.startsWith('build/') ? fname.substr(6) : fname,
  ],
  '@waline/client': (ver, fname) => ['waline', ver, fname],
};

const UNPKG_FIXTURES = {
  mathjax: (ver, fname) => [
    'mathjax',
    ver,
    fname.indexOf('.min.') > -1 ? fname.replace(/\.min\./gi, '.') : fname,
  ],
  disqusjs: (ver, fname) => [
    'disqusjs',
    ver,
    fname.indexOf('.min.') > -1 ? fname.replace(/\.min\./gi, '.') : fname,
  ],
};

function applyFixture(fixture, _package, version, filename) {
  if (Object.prototype.hasOwnProperty.call(fixture, _package)) {
    const result = fixture[_package](version, filename);
    if (!result.length) throw new Error();
    return result;
  }
  return [_package, version, filename];
}

/**
 * Resolve a library URL using the selected provider bag (after the caller's typeof check).
 * Keep fixture assignment inside the try: fallback may use already-mapped arguments. Replacement
 * values are passed directly to String.replace, retaining dollar strings and callable replacements.
 * @param {Object} providers Calling page's selected providers value; null is not normalized away.
 * @param {string} _package npm package name.
 * @param {string} version Library version.
 * @param {string} filename File path in the npm package.
 * @returns {string} The resolved URL, with legacy conversion/errors unchanged.
 */
function resolveCdn(providers, _package, version, filename) {
  const { cdn_overrides: overrides } = providers;
  const cdn =
    typeof overrides === 'object' && overrides !== null && overrides[_package]
      ? overrides[_package]
      : providers.cdn || 'jsdelivr';
  let _cdn = cdn;
  if (_cdn in PROVIDERS.LIBRARY) _cdn = PROVIDERS.LIBRARY[_cdn];
  if (_cdn.startsWith('[cdnjs]')) {
    _cdn = _cdn.substr(7);
    try {
      [_package, version, filename] = applyFixture(CDNJS_FIXTURES, _package, version, filename);
      if (filename.startsWith('dist/')) filename = filename.substr(5);
    } catch (e) {
      _cdn = PROVIDERS.LIBRARY.jsdelivr;
    }
  } else if (cdn === 'unpkg') {
    try {
      [_package, version, filename] = applyFixture(UNPKG_FIXTURES, _package, version, filename);
    } catch (e) {
      _cdn = PROVIDERS.LIBRARY.jsdelivr;
    }
  }
  return _cdn
    .replace(/\${\s*package\s*}/gi, _package)
    .replace(/\${\s*version\s*}/gi, version)
    .replace(/\${\s*filename\s*}/gi, filename);
}

/**
 * Resolve a web font URL; only undefined selects the provider/type defaults, not null or false.
 * @param {Object} providers Calling page's selected provider bag.
 * @param {string} fontName Font family expression, unchanged by URL encoding.
 * @param {string} [type=css] Google Fonts endpoint type.
 * @returns {string} The resolved font URL.
 */
function resolveFontCdn(providers, fontName, type = 'css') {
  let { fontcdn = 'google' } = providers;
  if (fontcdn in PROVIDERS.FONT) fontcdn = PROVIDERS.FONT[fontcdn];
  return fontcdn.replace(/\${\s*fontname\s*}/gi, fontName).replace(/\${\s*type\s*}/gi, type);
}

/**
 * Select an icon provider URL without interpolating/coercing a custom value.
 * @param {Object} providers Calling page's selected provider bag.
 * @returns {*} The known URL or original custom iconcdn value.
 */
function resolveIconCdn(providers) {
  let { iconcdn = 'fontawesome' } = providers;
  if (iconcdn in PROVIDERS.ICON) iconcdn = PROVIDERS.ICON[iconcdn];
  return iconcdn;
}

module.exports = { resolveCdn, resolveFontCdn, resolveIconCdn };
