/**
 * Matomo analytics plugin JSX component.
 * @module view/plugin/matomo
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { toJs } = require('../../util/script');

/**
 * Matomo analytics plugin JSX component.
 * <p>
 * Pages that are switched to by PJAX are tracked on the <code>pjax:complete</code> event.
 *
 * @see https://developer.matomo.org/guides/tracking-javascript-guide
 * @example
 * <Matomo
 *     url="https://matomo.example.com/"
 *     siteId="1"
 *     disableCookies={false} />
 */
class Matomo extends Component {
  render() {
    const { url, siteId, disableCookies } = this.props;
    const baseUrl = url.endsWith('/') ? url : url + '/';

    const js = `var _paq = window._paq = window._paq || [];
        ${disableCookies ? "_paq.push(['disableCookies']);" : ''}
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function () {
          var u = ${toJs(baseUrl)};
          _paq.push(['setTrackerUrl', u + 'matomo.php']);
          _paq.push(['setSiteId', ${toJs(String(siteId))}]);
          var g = document.createElement('script');
          g.async = true;
          g.src = u + 'matomo.js';
          document.head.appendChild(g);
        })();
        (function () {
          var referrer = location.href;
          document.addEventListener('pjax:complete', function () {
            _paq.push(['setReferrerUrl', referrer]);
            referrer = location.href;
            _paq.push(['setCustomUrl', referrer]);
            _paq.push(['setDocumentTitle', document.title]);
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
          });
        })();`;

    return <script dangerouslySetInnerHTML={{ __html: js }}></script>;
  }
}

/**
 * Cacheable Matomo analytics plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Matomo.Cacheable
 *     head={true}
 *     plugin={{
 *         url: 'https://matomo.example.com/',
 *         site_id: 1,
 *         disable_cookies: false
 *     }} />
 */
Matomo.Cacheable = cacheComponent(Matomo, 'plugin.matomo', (props) => {
  const { head, plugin } = props;
  if (!head || !plugin.url || !plugin.site_id) {
    return null;
  }
  return {
    url: plugin.url,
    siteId: plugin.site_id,
    disableCookies: plugin.disable_cookies,
  };
});

module.exports = Matomo;
