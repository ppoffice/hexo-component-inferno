/**
 * Bing Webmaster Tools plugin JSX component.
 * @module view/plugin/bing_webmaster
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Bing Webmaster Tools plugin JSX component.
 *
 * @see https://www.bing.com/toolbox/webmaster/
 * @example
 * <BingWebmaster trackingId="******" />
 */
class BingWebmaster extends Component {
  render() {
    const { trackingId } = this.props;

    return <meta name="msvalidate.01" content={trackingId} />;
  }
}

/**
 * Cacheable Bing Webmaster Tools plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <BingWebmaster.Cacheable
 *     head={true}
 *     plugin={{ tracking_id: '*******' }} />
 */
BingWebmaster.Cacheable = cacheComponent(BingWebmaster, 'plugin.bingwebmaster', (props) => {
  const { head, plugin } = props;
  if (!head || !plugin.tracking_id) {
    return null;
  }
  return {
    trackingId: plugin.tracking_id,
  };
});

module.exports = BingWebmaster;
