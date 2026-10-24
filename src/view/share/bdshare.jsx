/**
 * Baidu share buttons JSX component.
 * @module view/share/bdshare
 * @deprecated Retained for compatibility only. Use AddToAny or ShareThis instead.
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { deprecate } = require('../../util/deprecate');

/**
 * Baidu share buttons JSX component.
 *
 * @deprecated Legacy integration with HTTP mixed content and obsolete targets. Use AddToAny or ShareThis instead.
 * @example
 * <BdShare />
 */
class BdShare extends Component {
  render() {
    deprecate(
      'share.bdshare',
      'HTTP mixed content; use AddToAny or ShareThis.',
    );
    const js =
      'window._bd_share_config = { "common": { "bdSnsKey": {}, "bdText": "", "bdMini": "2", "bdPic": "", "bdStyle": "0", "bdSize": "16" }, "share": {} }; with (document) 0[(getElementsByTagName(\'head\')[0] || body).appendChild(createElement(\'script\')).src = \'http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion=\' + ~(-new Date() / 36e5)];';
    return (
      <>
        <div class="bdsharebuttonbox">
          <a href="#" class="bds_more" data-cmd="more"></a>
          <a href="#" class="bds_qzone" data-cmd="qzone" title="分享到QQ空间"></a>
          <a href="#" class="bds_tsina" data-cmd="tsina" title="分享到新浪微博"></a>
          <a href="#" class="bds_tqq" data-cmd="tqq" title="分享到腾讯微博"></a>
          <a href="#" class="bds_renren" data-cmd="renren" title="分享到人人网"></a>
          <a href="#" class="bds_weixin" data-cmd="weixin" title="分享到微信"></a>
        </div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Baidu share buttons JSX component.
 * @deprecated Retained for compatibility only. Use AddToAny or ShareThis instead.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <BdShare.Cacheable />
 */
BdShare.Cacheable = cacheComponent(BdShare, 'share.bdshare', (props) => {
  return {};
});

module.exports = BdShare;
