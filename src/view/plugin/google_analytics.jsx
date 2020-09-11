/**
 * Google Analytics plugin JSX component.
 * @module view/plugin/google_analytics
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Google Analytics plugin JSX component.
 *
 * @see https://analytics.google.com/analytics/web
 * @example
 * <GoogleAnalytics trackingId="******" />
 */
class GoogleAnalytics extends Component {
  render() {
    const { trackingId } = this.props;

    const js = `window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
    
        gtag('config', '${trackingId}');`;

    return (
      <>
        <script
          src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}
          async={true}></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Google Analytics plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <GoogleAnalytics.Cacheable
 *     head={true}
 *     plugin={{ tracking_id: '*******' }} />
 */
GoogleAnalytics.Cacheable = cacheComponent(GoogleAnalytics, 'plugin.googleanalytics', (props) => {
  const { head, plugin } = props;
  if (!head || !plugin.tracking_id) {
    return null;
  }
  return {
    trackingId: plugin.tracking_id,
  };
});

module.exports = GoogleAnalytics;
