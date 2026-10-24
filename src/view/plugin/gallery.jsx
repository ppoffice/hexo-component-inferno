/**
 * lightGallery and Justified Gallery plugins JSX component.
 * @module view/plugin/gallery
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const gallery = require('../../util/gallery');

/**
 * lightGallery and Justified Gallery plugins JSX component.
 *
 * @see https://www.lightgalleryjs.com/
 * @see http://miromannino.github.io/Justified-Gallery/
 * @example
 * <Gallery
 *     head={true}
 *     lightGallery={{
 *         jsUrl: '/path/to/lightgallery.min.js',
 *         cssUrl: '/path/to/lightgallery-bundle.min.css'
 *     }}
 *     justifiedGallery={{
 *         jsUrl: '/path/to/justified-gallery.js',
 *         cssUrl: '/path/to/justified-gallery.css'
 *     }} />
 */
class Gallery extends Component {
  render() {
    const { head, lightGallery, justifiedGallery } = this.props;
    const plugins = lightGallery.plugins || [];
    if (head) {
      return (
        <>
          <link rel="stylesheet" href={lightGallery.cssUrl} data-pjax={true} />
          <link rel="stylesheet" href={justifiedGallery.cssUrl} data-pjax={true} />
        </>
      );
    }

    const js = `${gallery}\nwindow.HexoGallery.lightGalleryPlugins = ${JSON.stringify(plugins.map((plugin) => plugin.name)).replace(/</g, '\\u003c')};
window.HexoGallery.init(document, {
        lightGallery: true,
        justifiedGallery: true
    });`;

    return (
      <>
        <script src={lightGallery.jsUrl} defer={true}></script>
        {plugins.map((plugin) => (
          <script key={plugin.name} src={plugin.jsUrl} defer={true}></script>
        ))}
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
        <script
          type="module"
          dangerouslySetInnerHTML={{
            __html: `import { JustifiedGallery } from ${JSON.stringify(justifiedGallery.jsUrl).replace(/</g, '\\u003c')};
window.JustifiedGallery = JustifiedGallery;
document.dispatchEvent(new Event('hexo:gallery:ready'));`,
          }}></script>
      </>
    );
  }
}

/**
 * Cacheable lightGallery and Justified Gallery plugins JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Gallery.Cacheable
 *     head={true}
 *     helper={{ cdn: function() {...} }} />
 */
Gallery.Cacheable = cacheComponent(Gallery, 'plugin.gallery', (props) => {
  const { head, helper } = props;
  return {
    head,
    lightGallery: {
      jsUrl: helper.cdn('lightgallery', '3.0.0', 'lightgallery.min.js'),
      cssUrl: helper.cdn('lightgallery', '3.0.0', 'css/lightgallery-bundle.min.css'),
      plugins: [
        {
          name: 'lgZoom',
          jsUrl: helper.cdn('lightgallery', '3.0.0', 'plugins/zoom/lg-zoom.min.js'),
        },
        {
          name: 'lgThumbnail',
          jsUrl: helper.cdn('lightgallery', '3.0.0', 'plugins/thumbnail/lg-thumbnail.min.js'),
        },
        {
          name: 'lgFullscreen',
          jsUrl: helper.cdn('lightgallery', '3.0.0', 'plugins/fullscreen/lg-fullscreen.min.js'),
        },
      ],
    },
    justifiedGallery: {
      jsUrl: helper.cdn('justified-gallery', '4.0.2', 'dist/justified-gallery.js'),
      cssUrl: helper.cdn('justified-gallery', '4.0.2', 'dist/assets/justified-gallery.css'),
    },
  };
});

module.exports = Gallery;
