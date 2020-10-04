/**
 * Web app meta tags.
 * @module view/misc/web_app
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Web app meta tags.
 *
 * @example
 * <WebApp
 *     name="******"
 *     manifest="/path/to/manifest.json"
 *     tileIcon="/path/to/image"
 *     themeColor="#000000"
 *     icons={[
 *         { src: '/path/to/image', sizes: '128x128 256x256' },
 *         { src: '/path/to/image', sizes: '512x512' },
 *     ]} />
 */
class WebApp extends Component {
  render() {
    const { name, manifest, tileIcon, themeColor } = this.props;

    let icons = [];
    if (Array.isArray(this.props.icons)) {
      icons = this.props.icons.map((icon) => {
        const { sizes, src } = icon;
        if (src && sizes) {
          return icon.sizes.split(/\s+/).map((size) => ({ sizes: size, src }));
        }
        return null;
      });
      icons = icons.filter(Boolean);
      icons = [].concat(...icons);
    }

    return (
      <>
        <link rel="manifest" href={manifest} />
        {themeColor ? <meta name="theme-color" content={themeColor} /> : null}
        {/* Windows Pinned Site */}
        <meta name="application-name" content={name} />
        {tileIcon ? <meta name="msapplication-TileImage" content={tileIcon} /> : null}
        {themeColor ? <meta name="msapplication-TileColor" content={themeColor} /> : null}
        {/* iOS home screen launcher */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={name} />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {icons.map((icon) => (
          <link rel="apple-touch-icon" sizes={icon.sizes} href={icon.src} />
        ))}
      </>
    );
  }
}

/**
 * Cacheable web app meta tags.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}) and manifest generator ({@link module:hexo/generator/manifest}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <WebApp.Cacheable
 *     name="******"
 *     themeColor="#000000"
 *     favicon="/path/to/image"
 *     icons={[
 *         { src: '/path/to/image', sizes: '128x128 256x256' },
 *         { src: '/path/to/image', sizes: '512x512' },
 *     ]}
 *     helper={{ url_for: function() {...} }} />
 */
WebApp.Cacheable = cacheComponent(WebApp, 'misc.webapp', (props) => {
  const { name, themeColor, favicon, icons, helper } = props;

  let tileIcon = null;
  if (Array.isArray(icons)) {
    tileIcon = icons.find((icon) => icon.sizes.toLowerCase().indexOf('144x144') > -1);
    if (tileIcon) {
      tileIcon = tileIcon.src;
    } else if (icons.length) {
      tileIcon = icons[0].src;
    }
  }
  if (!tileIcon) {
    tileIcon = favicon;
  }

  return {
    name,
    icons,
    tileIcon,
    themeColor,
    manifest: helper.url_for('/manifest.json'),
  };
});

module.exports = WebApp;
