/**
 * Baidu Analytics plugin JSX component.
 * @module view/plugin/baidu_analytics
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Baidu Analytics plugin JSX component.
 *
 * @see https://tongji.baidu.com/web/welcome/login
 * @example
 * <BaiduAnalytics trackingId="******" />
 */
class BaiduAnalytics extends Component {
  render() {
    const { trackingId } = this.props;

    const js = `var _hmt = _hmt || [];
        (function() {
            var hm = document.createElement("script");
            hm.src = "//hm.baidu.com/hm.js?${trackingId}";
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(hm, s);
        })();`;

    return <script dangerouslySetInnerHTML={{ __html: js }}></script>;
  }
}

/**
 * Cacheable Baidu Analytics plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <BaiduAnalytics.Cacheable
 *     head={true}
 *     plugin={{ tracking_id: '*******' }} />
 */
BaiduAnalytics.Cacheable = cacheComponent(BaiduAnalytics, 'plugin.baiduanalytics', (props) => {
  const { head, plugin } = props;
  if (!head || !plugin.tracking_id) {
    return null;
  }
  return {
    trackingId: plugin.tracking_id,
  };
});

module.exports = BaiduAnalytics;
