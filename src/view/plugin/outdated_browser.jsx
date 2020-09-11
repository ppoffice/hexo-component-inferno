/**
 * Outdated browser detection plugin JSX component.
 * @module view/plugin/outdated_browser
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Outdated browser detection plugin JSX component.
 *
 * @see https://github.com/outdatedbrowser/outdated-browser
 * @example
 * <OutdatedBrowser
 *     head={true}
 *     cssUrl="/path/to/outdatedbrowser.css"
 *     jsUrl="/path/to/outdatedbrowser.js" />
 */
class OutdatedBrowser extends Component {
  render() {
    const { head, jsUrl, cssUrl } = this.props;

    const js = `window.addEventListener("load", function () {
            outdatedBrowser({
                bgColor: '#f25648',
                color: '#ffffff',
                lowerThan: 'object-fit' // display on IE11 or below
            });
        });`;

    if (head) {
      return <link rel="stylesheet" href={cssUrl} />;
    }
    return (
      <>
        <div id="outdated">
          <h6>Your browser is out-of-date!</h6>
          <p>
            Update your browser to view this website correctly.&npsb;
            <a id="btnUpdateBrowser" href="http://outdatedbrowser.com/">
              Update my browser now{' '}
            </a>
          </p>
          <p class="last">
            <a href="#" id="btnCloseUpdateBrowser" title="Close">
              &times;
            </a>
          </p>
        </div>
        <script src={jsUrl} defer={true}></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable outdated browser detection plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <OutdatedBrowser.Cacheable
 *     head={true}
 *     helper={{ cdn: function() {...} }} />
 */
OutdatedBrowser.Cacheable = cacheComponent(OutdatedBrowser, 'plugin.outdatedbrowser', (props) => {
  const { head, helper } = props;
  return {
    head,
    cssUrl: helper.cdn('outdatedbrowser', '1.1.5', 'outdatedbrowser/outdatedbrowser.min.css'),
    jsUrl: helper.cdn('outdatedbrowser', '1.1.5', 'outdatedbrowser/outdatedbrowser.min.js'),
  };
});

module.exports = OutdatedBrowser;
