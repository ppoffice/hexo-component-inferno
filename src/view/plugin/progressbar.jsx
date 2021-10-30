/**
 * A JSX component for showing progress bar at top of the page.
 * @module view/plugin/progressbar
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * A JSX component for showing progress bar at top of the page.
 *
 * @see https://codebyzach.github.io/pace/docs/
 * @example
 * <ProgressBar jsUrl="/path/to/pace-js.js" />
 */
class ProgressBar extends Component {
  render() {
    const { cssUrl, jsUrl } = this.props;

    return (
      <>
        <link rel="stylesheet" href={cssUrl} />
        <script src={jsUrl}></script>
      </>
    );
  }
}

/**
 * Cacheable JSX component for showing progress bar at top of the page.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <ProgressBar.Cacheable
 *     head={true}
 *     helper={{ cdn: function() {...} }} />
 */
ProgressBar.Cacheable = cacheComponent(ProgressBar, 'plugin.progressbar', (props) => {
  const { head, helper } = props;
  if (!head) {
    return null;
  }
  return {
    jsUrl: helper.cdn('pace-js', '1.2.4', 'pace.min.js'),
    cssUrl: helper.cdn('pace-js', '1.2.4', 'pace-theme-default.min.css'),
  };
});

module.exports = ProgressBar;
