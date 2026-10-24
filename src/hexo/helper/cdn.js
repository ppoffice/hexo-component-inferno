/**
 * Register the Hexo helper functions for resolving the URL of static files of JavaScript libraries,
 * web fonts, and FontAwesome icon fonts.
 * @module hexo/helper/cdn
 */

const { resolveCdn, resolveFontCdn, resolveIconCdn } = require('../../util/cdn');

/**
 * Register the Hexo helper functions for resolving the URL of static files of JavaScript libraries,
 * web fonts, and FontAwesome icon fonts.
 *
 * @param {Hexo} hexo The Hexo instance.
 * @example
 * // Use the function below to resolve the CDN URL JavaScript library static files in your view files
 * cdn('jquery', '3.3.1', 'dist/jquery.min.js');
 * // -> https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js
 *
 * // Set providers.cdn_overrides, e.g., { jquery: 'unpkg' }, to use a different CDN provider or URL
 * // template for some packages
 * cdn('jquery', '3.3.1', 'dist/jquery.min.js');
 * // -> https://unpkg.com/jquery@3.3.1/dist/jquery.min.js
 *
 * // Use the function below to resolve the CDN URL web font files
 * fontcdn('Ubuntu:400,600|Source+Code+Pro', 'css');
 * // -> https://fonts.googleapis.com/css?family=Ubuntu:400,600|Source+Code+Pro
 *
 * // Use the function below to insert FontAwesome icon font CSS URL.
 * iconcdn();
 * // -> https://use.fontawesome.com/releases/v6.0.0/css/all.css
 */
module.exports = function (hexo) {
  hexo.extend.helper.register('cdn', function (_package, version, filename) {
    const providers = typeof this.config.providers === 'object' ? this.config.providers : {};
    return resolveCdn(providers, _package, version, filename);
  });

  hexo.extend.helper.register('fontcdn', function (fontName, type = 'css') {
    const providers = typeof this.config.providers === 'object' ? this.config.providers : {};
    return resolveFontCdn(providers, fontName, type);
  });

  hexo.extend.helper.register('iconcdn', function () {
    const providers = typeof this.config.providers === 'object' ? this.config.providers : {};
    return resolveIconCdn(providers);
  });
};
