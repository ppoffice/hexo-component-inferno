/**
 * Cusdis comment JSX component.
 * @module view/comment/cusdis
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');
const { getAppearance } = require('../../util/appearance');

/**
 * Cusdis comment JSX component.
 *
 * @see https://cusdis.com/doc
 * @example
 * <Cusdis
 *     host="https://cusdis.com"
 *     appId="******"
 *     pageId="/path/to/page/"
 *     pageUrl="https://example.com/path/to/page/"
 *     pageTitle="******"
 *     theme="auto"
 *     lang="zh-cn" />
 */
class Cusdis extends Component {
  render() {
    const {
      host = 'https://cusdis.com',
      appId,
      pageId,
      pageUrl,
      pageTitle,
      theme,
      lang,
    } = this.props;
    if (!appId) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>app_id</code> for Cusdis. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    const urls = [`${host}/js/cusdis.es.js`];
    if (lang) {
      urls.unshift(`${host}/js/widget/lang/${lang}.js`);
    }
    // Without the theme option, follow the appearance of the page (light, dark, or auto, the same values
    // as the themes of Cusdis). The Cusdis script renders #cusdis_thread when it loads, so render it
    // directly only when the script is already loaded, e.g., when PJAX runs this code again.
    const js = `(function () {
        var element = document.getElementById('cusdis_thread');
        if (!element) {
          return;
        }
        element.setAttribute('data-theme', ${theme ? JSON.stringify(theme) : getAppearance()});
        if (window.renderCusdis) {
          window.renderCusdis(element);
          return;
        }
        ${loadScripts(urls, '')}
      })();`;
    return (
      <>
        <div
          id="cusdis_thread"
          data-host={host}
          data-app-id={appId}
          data-page-id={pageId}
          data-page-url={pageUrl}
          data-page-title={pageTitle}></div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Cusdis comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Cusdis.Cacheable
 *     comment={{
 *         host: "https://cusdis.com",
 *         app_id: "******",
 *         theme: "auto",
 *         lang: "zh-cn"
 *     }}
 *     page={{ path: "/path/to/page/", permalink: "******", title: "******" }}
 *     helper={{ url_for: function() {...} }} />
 */
Cusdis.Cacheable = cacheComponent(Cusdis, 'comment.cusdis', (props) => {
  const { comment, helper, page } = props;

  return {
    host: comment.host ? comment.host.replace(/\/+$/, '') : undefined,
    appId: comment.app_id,
    pageId: helper.url_for(page.path),
    pageUrl: page.permalink,
    pageTitle: page.title,
    theme: comment.theme,
    lang: comment.lang,
  };
});

module.exports = Cusdis;
