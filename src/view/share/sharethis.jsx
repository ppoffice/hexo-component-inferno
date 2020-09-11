/**
 * ShareThis share buttons JSX component.
 * @module view/share/sharethis
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * ShareThis share buttons JSX component.
 *
 * @see https://platform.sharethis.com/settings
 * @example
 * <ShareThis installUrl="******" />
 */
class ShareThis extends Component {
  render() {
    const { installUrl } = this.props;
    if (!installUrl) {
      return (
        <div class="notification is-danger">
          You need to set <code>install_url</code> to use ShareThis. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    return (
      <>
        <div class="sharethis-inline-share-buttons"></div>
        <script src={installUrl} defer={true}></script>
      </>
    );
  }
}

/**
 * Cacheable ShareThis share buttons JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <ShareThis.Cacheable share={{ install_url: '******' }} />
 */
ShareThis.Cacheable = cacheComponent(ShareThis, 'share.sharethis', (props) => {
  const { share } = props;

  return {
    installUrl: share.install_url,
  };
});

module.exports = ShareThis;
