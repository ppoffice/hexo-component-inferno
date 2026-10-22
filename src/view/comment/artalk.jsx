/**
 * Artalk comment JSX component.
 * @module view/comment/artalk
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');
const { toJs } = loadScripts;
const { getAppearance, isDark } = require('../../util/appearance');

/**
 * Artalk comment JSX component.
 *
 * @see https://artalk.js.org/guide/frontend/config.html
 * @example
 * <Artalk
 *     server="https://artalk.example.com"
 *     site="******"
 *     pageKey="/path/to/page/"
 *     pageTitle="******"
 *     locale="en"
 *     darkMode={false}
 *     jsUrl="/path/to/Artalk.js"
 *     cssUrl="/path/to/Artalk.css" />
 */
class Artalk extends Component {
  render() {
    const { server, site, pageKey, pageTitle, locale, darkMode, jsUrl, cssUrl } = this.props;
    if (!server) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>server</code> for Artalk. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    // Without the dark_mode option, follow the appearance of the page
    const darkModeOption =
      darkMode === null || typeof darkMode === 'undefined'
        ? `${getAppearance()} === 'auto' ? 'auto' : ${isDark()}`
        : toJs(darkMode);
    // PJAX replaces the element of the previous instance, so destroy it before initializing again
    const js = `if (window.__artalkInstance) {
            window.__artalkInstance.destroy();
        }
        window.__artalkInstance = Artalk.init({
            el: '#artalk-thread',
            server: ${toJs(server)},
            ${site ? `site: ${toJs(site)},` : ''}
            ${pageKey ? `pageKey: ${toJs(pageKey)},` : ''}
            ${pageTitle ? `pageTitle: ${toJs(pageTitle)},` : ''}
            ${locale ? `locale: ${toJs(locale)},` : ''}
            darkMode: ${darkModeOption},
        });`;
    return (
      <>
        <div id="artalk-thread"></div>
        <link rel="stylesheet" href={cssUrl} media="print" onload="this.media='all'" />
        <script dangerouslySetInnerHTML={{ __html: loadScripts(jsUrl, js) }}></script>
      </>
    );
  }
}

/**
 * Cacheable Artalk comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Artalk.Cacheable
 *     comment={{
 *         server: "https://artalk.example.com",
 *         site: "******",
 *         locale: "en",
 *         dark_mode: false
 *     }}
 *     page={{ title: "******" }}
 *     helper={{ cdn: function() {...} }} />
 */
Artalk.Cacheable = cacheComponent(Artalk, 'comment.artalk', (props) => {
  const { comment, helper, page } = props;

  return {
    server: comment.server,
    site: comment.site,
    pageKey: comment.page_key,
    pageTitle: page.title,
    locale: comment.locale,
    darkMode: comment.dark_mode,
    jsUrl: helper.cdn('artalk', '2.9.1', 'dist/Artalk.js'),
    cssUrl: helper.cdn('artalk', '2.9.1', 'dist/Artalk.css'),
  };
});

module.exports = Artalk;
