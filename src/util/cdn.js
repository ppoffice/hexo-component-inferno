/**
 * Pure CDN URL resolution. Hexo registration and package compatibility rules stay separate.
 * @module util/cdn
 * @private
 */
const { PROVIDERS, PACKAGE_RULES, stripPrefix } = require('./cdn-rules');

function selectLibraryProvider(providers, name) {
  const { cdn_overrides: overrides } = providers;
  return typeof overrides === 'object' && overrides !== null && overrides[name]
    ? overrides[name]
    : providers.cdn || 'jsdelivr';
}

function packageRule(name) {
  return Object.prototype.hasOwnProperty.call(PACKAGE_RULES, name) ? PACKAGE_RULES[name] : {};
}

function resolveLibraryAsset(provider, asset) {
  let template = provider in PROVIDERS.LIBRARY ? PROVIDERS.LIBRARY[provider] : provider;
  const unavailable = typeof asset.package === 'string' && packageRule(asset.package).unavailable;
  if (
    unavailable &&
    unavailable.some((entry) => entry.provider === provider && entry.version === asset.version)
  ) {
    return { template: PROVIDERS.LIBRARY.jsdelivr, asset };
  }

  let family = provider === 'unpkg' ? 'unpkg' : null;
  if (template.startsWith('[cdnjs]')) {
    family = 'cdnjs';
    template = template.substr(7);
  }
  if (!family) return { template, asset };

  try {
    const mapping = packageRule(asset.package)[family];
    if (mapping === null) return { template: PROVIDERS.LIBRARY.jsdelivr, asset };
    if (mapping) {
      // Commit a mapping only after its path conversion succeeds. Later failures retain renames.
      asset = {
        package: mapping.package || asset.package,
        version: asset.version,
        filename: mapping.filename ? mapping.filename(asset.filename) : asset.filename,
      };
    }
    if (family === 'cdnjs') asset.filename = stripPrefix(asset.filename, 'dist/');
  } catch (e) {
    template = PROVIDERS.LIBRARY.jsdelivr;
  }
  return { template, asset };
}

function formatLibraryUrl({ template, asset }) {
  return template
    .replace(/\${\s*package\s*}/gi, asset.package)
    .replace(/\${\s*version\s*}/gi, asset.version)
    .replace(/\${\s*filename\s*}/gi, asset.filename);
}

/**
 * Resolve a library URL with optional per-package provider overrides.
 * @param {Object} providers Provider configuration.
 * @param {string} _package npm package name.
 * @param {string} version Library version.
 * @param {string} filename Path in the npm package.
 * @returns {string} The resolved URL.
 */
function resolveCdn(providers, _package, version, filename) {
  const provider = selectLibraryProvider(providers, _package);
  return formatLibraryUrl(resolveLibraryAsset(provider, { package: _package, version, filename }));
}

/**
 * Resolve a web font URL; only undefined selects provider/type defaults.
 * @param {Object} providers Provider configuration.
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
 * @param {Object} providers Provider configuration.
 * @returns {*} The known URL or original custom value.
 */
function resolveIconCdn(providers) {
  let { iconcdn = 'fontawesome' } = providers;
  if (iconcdn in PROVIDERS.ICON) iconcdn = PROVIDERS.ICON[iconcdn];
  return iconcdn;
}

module.exports = { resolveCdn, resolveFontCdn, resolveIconCdn };
