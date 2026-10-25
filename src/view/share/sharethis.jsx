/**
 * ShareThis share buttons JSX component.
 * @module view/share/sharethis
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');

/**
 * ShareThis share buttons JSX component.
 *
 * @see https://platform.sharethis.com/settings
 * @example
 * <ShareThis installUrl="******" />
 */
class ShareThis extends Component {
  render() {
    const { installUrl, url, title } = this.props;
    if (!installUrl) {
      return (
        <div class="notification is-danger">
          You need to set <code>install_url</code> to use ShareThis. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    const initialize = `
      if (!container || !container.isConnected || container.querySelector('.st-btn')) return;
      var sdk = window.__sharethis__;
      // Reuse the account settings when PJAX replaces the container.
      if (sdk && sdk.config && typeof sdk.load === 'function') {
        var settings = Object.assign({}, sdk.config['inline-share-buttons']);
        if (container.dataset.url) settings.url = container.dataset.url;
        if (container.dataset.title) settings.title = container.dataset.title;
        sdk.load('inline-share-buttons', settings);
      }`;
    return (
      <>
        <div
          id="sharethis-share"
          class="sharethis-inline-share-buttons"
          data-share-provider="sharethis"
          data-url={url}
          data-title={title}></div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
          var container = document.getElementById('sharethis-share');
          ${loadScripts(installUrl, initialize)}
        })();`,
          }}></script>
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
  const { share, page = {} } = props;

  return {
    installUrl: share.install_url,
    url: page.permalink,
    title: page.title,
  };
});

module.exports = ShareThis;
