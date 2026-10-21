/**
 * Waline page view counter plugin JSX component.
 * @module view/plugin/waline_pageview
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Waline page view counter plugin JSX component.
 * <p>
 * It counts a view of the current page, and shows the page views in the elements with the
 * <code>waline-pageview-count</code> class, of the page in their <code>data-path</code> attribute, or of
 * the current page without it. It counts and shows them again after switching pages with PJAX.
 *
 * @see https://waline.js.org/en/guide/features/pageview.html
 * @example
 * <WalinePageview
 *     serverURL="https://path/to/waline/server"
 *     jsUrl="/path/to/pageview.js" />
 */
class WalinePageview extends Component {
  render() {
    const { serverURL, jsUrl } = this.props;

    // Waline publishes the counter as an ES module, so load it with a dynamic import
    const js = `(function () {
        var abort = null;
        function count() {
          import(${JSON.stringify(jsUrl)}).then(function (Waline) {
            if (abort) {
              abort();
            }
            abort = Waline.pageviewCount({
              serverURL: ${JSON.stringify(serverURL)},
              path: window.location.pathname,
            });
          });
        }
        count();
        document.addEventListener('pjax:complete', count);
      })();`;

    return <script dangerouslySetInnerHTML={{ __html: js }}></script>;
  }
}

/**
 * Cacheable Waline page view counter plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <WalinePageview.Cacheable
 *     head={false}
 *     plugin={{ server_url: 'https://path/to/waline/server' }}
 *     config={{ comment: { type: 'waline', server_url: 'https://path/to/waline/server' } }}
 *     helper={{ cdn: function() {...} }} />
 */
WalinePageview.Cacheable = cacheComponent(WalinePageview, 'plugin.walinepageview', (props) => {
  const { head, plugin, config, helper } = props;
  if (head || !plugin) {
    return null;
  }
  // Use the server of the Waline comments without the server_url option
  const { comment } = config;
  let serverURL = typeof plugin === 'object' ? plugin.server_url : null;
  if (!serverURL && comment && comment.type === 'waline') {
    serverURL = comment.server_url;
  }
  if (!serverURL) {
    return null;
  }
  return {
    serverURL,
    jsUrl: helper.cdn('@waline/client', '3.3.0', 'dist/pageview.js'),
  };
});

module.exports = WalinePageview;
