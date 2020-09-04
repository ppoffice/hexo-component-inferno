/**
 * Web app manifest.json generator.
 *
 * @module hexo/generator/manifest
 */

/**
 * Web app manifest.json generator.
 * <br>
 * Manifest configurations should be placed in the `head.manifest` property of
 * the theme configurations.
 *
 * @param {Hexo} hexo The Hexo instance.
 * @example
 * head:
 *     manifest:
 *         name:
 *         short_name:
 *         start_url:
 *         theme_color:
 *         background_color:
 *         display: standalone
 *         icons:
 *             - src: /path/to/image.png
 *               sizes: 128x128
 *               type: image/png
 */
module.exports = function (hexo) {
  hexo.extend.generator.register('manifest', function (locals) {
    const url_for = hexo.extend.helper.get('url_for').bind(this);
    let { manifest = {} } = ((this.theme || {}).config || {}).head || {};

    manifest = Object.assign({}, manifest);
    if (!manifest.name) {
      manifest.name = this.config.title;
    }
    if (!manifest.start_url) {
      manifest.start_url = url_for('/index.html');
    }

    return {
      path: '/manifest.json',
      data: JSON.stringify(manifest),
    };
  });
};
