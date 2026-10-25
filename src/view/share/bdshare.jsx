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
    deprecate('share.bdshare', 'HTTP mixed content; use AddToAny or ShareThis.');
    return (
      <div class="notification is-danger" role="status">
        This legacy Baidu Share integration is deprecated because it uses HTTP assets and obsolete
        sharing targets. Set <code>share.type</code> to <code>web_share</code>,{' '}
        <code>addtoany</code>, or <code>sharethis</code>.
      </div>
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
