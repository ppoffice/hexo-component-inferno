/**
 * Provider templates and package compatibility rules, private to the URL resolver.
 * @module util/cdn-rules
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

function stripPrefix(filename, prefix) {
  return filename.startsWith(prefix) ? filename.substr(prefix.length) : filename;
}

function stripMin(filename) {
  return filename.indexOf('.min.') > -1 ? filename.replace(/\.min\./gi, '.') : filename;
}

// An absent mapping preserves the npm path; null means the provider lacks the package.
const PACKAGE_RULES = {
  'justified-gallery': { cdnjs: null },
  '@mathjax/mathjax-newcm-font': { cdnjs: null },
  lightgallery: {
    // cdnjs itself serves this release, but its loli mirror lacks the CSS, core and plugins.
    unavailable: [{ provider: 'loli', version: '3.0.0' }],
  },
  disqusjs: {
    cdnjs: { filename: (file) => stripPrefix(file, 'dist/browser/') },
    unpkg: {
      filename: (file) =>
        file.startsWith('dist/browser/') ? file : file.replace(/\.min\./gi, '.'),
    },
  },
  moment: { cdnjs: { package: 'moment.js', filename: (file) => stripPrefix(file, 'min/') } },
  outdatedbrowser: {
    cdnjs: {
      package: 'outdated-browser',
      filename: (file) => stripPrefix(file, 'outdatedbrowser/'),
    },
  },
  'highlight.js': {
    cdnjs: {
      filename: (file) =>
        file.endsWith('.css') && file.indexOf('.min.') === -1
          ? file.substr(0, file.length - 4) + '.min.css'
          : file,
    },
  },
  mathjax: {
    cdnjs: { filename: (file) => stripMin(stripPrefix(file, 'unpacked/')) },
    unpkg: { filename: stripMin },
  },
  katex: { cdnjs: { package: 'KaTeX' } },
  'pace-js': { cdnjs: { package: 'pace' } },
  clipboard: { cdnjs: { package: 'clipboard.js' } },
  cookieconsent: { cdnjs: { filename: (file) => stripPrefix(file, 'build/') } },
  '@waline/client': { cdnjs: { package: 'waline' } },
};

module.exports = { PROVIDERS, PACKAGE_RULES, stripPrefix };
