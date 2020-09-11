/**
 * AddThis share buttons JSX component.
 * @module view/share/addthis
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * AddThis share buttons JSX component.
 *
 * @see https://www.addthis.com/dashboard
 * @example
 * <AddThis installUrl="******" />
 */
class AddThis extends Component {
  render() {
    const { installUrl } = this.props;
    if (!installUrl) {
      return (
        <div class="notification is-danger">
          You need to set <code>install_url</code> to use AddThis. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    return (
      <>
        <div class="addthis_inline_share_toolbox"></div>
        <script src={installUrl} defer={true}></script>
      </>
    );
  }
}

/**
 * Cacheable AddThis share buttons JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <AddThis.Cacheable share={{ install_url: '******' }} />
 */
AddThis.Cacheable = cacheComponent(AddThis, 'share.addthis', (props) => {
  const { share } = props;

  return {
    installUrl: share.install_url,
  };
});

module.exports = AddThis;
