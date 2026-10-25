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
    const {
      server,
      site,
      pageKey,
      pageTitle,
      locale,
      darkMode,
      preferRemoteConf,
      jsUrl,
      cssUrl,
      localeUrls = [],
    } = this.props;
    if (!server) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>server</code> for Artalk. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    // Without the dark_mode option, follow the appearance of the page
    const followAppearance = darkMode === null || typeof darkMode === 'undefined';
    const darkModeOption = followAppearance
      ? `${getAppearance()} === 'auto' ? 'auto' : ${isDark()}`
      : toJs(darkMode);
    // PJAX replaces the element of the previous instance, so destroy it before initializing again
    let js = `if (!container || !container.isConnected) return;
        if (window.__artalkInstance) {
            window.__artalkInstance.destroy();
        }
        window.__artalkInstance = Artalk.init({
            el: '#artalk-thread',
            server: ${toJs(server)},
            ${site ? `site: ${toJs(site)},` : ''}
            ${pageKey ? `pageKey: ${toJs(pageKey)},` : ''}
            ${pageTitle ? `pageTitle: ${toJs(pageTitle)},` : ''}
            ${locale ? `locale: ${toJs(locale)},` : ''}
            ${typeof preferRemoteConf === 'boolean' ? `preferRemoteConf: ${preferRemoteConf},` : ''}
            darkMode: ${darkModeOption},
        });`;
    if (followAppearance) {
      js += `
        var instance = window.__artalkInstance;
        var observer = new MutationObserver(function () {
            instance.update({ darkMode: ${darkModeOption} });
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-appearance'] });
        instance.on('unmounted', function () { observer.disconnect(); });`;
    }
    return (
      <>
        <div id="artalk-thread"></div>
        <link rel="stylesheet" href={cssUrl} media="print" onload="this.media='all'" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
          var container = document.getElementById('artalk-thread');
          ${loadScripts([jsUrl].concat(localeUrls), js)}
        })();`,
          }}></script>
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
  // The full bundle includes en and zh-CN only. Other published dictionaries register themselves
  // on window.ArtalkI18n before initialization. For auto, make every supported dictionary available.
  const externalLocales = ['zh-TW', 'ja', 'ko', 'fr', 'ru', 'tr'];
  const language = String(comment.locale || '').toLowerCase();
  const localeNames = externalLocales.filter((name) => {
    return (
      language === 'auto' ||
      language === name.toLowerCase() ||
      language.startsWith(name.toLowerCase() + '-')
    );
  });

  return {
    server: comment.server,
    site: comment.site,
    pageKey: comment.page_key,
    pageTitle: page.title,
    locale: comment.locale,
    darkMode: comment.dark_mode,
    preferRemoteConf: comment.prefer_remote_conf,
    jsUrl: helper.cdn('artalk', '2.10.0', 'dist/Artalk.js'),
    cssUrl: helper.cdn('artalk', '2.10.0', 'dist/Artalk.css'),
    localeUrls: localeNames.map((name) => helper.cdn('artalk', '2.10.0', `dist/i18n/${name}.js`)),
  };
});

module.exports = Artalk;
