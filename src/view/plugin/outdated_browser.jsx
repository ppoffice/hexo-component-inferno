/* eslint-env browser */
/**
 * Theme capability warning, without a third-party browser SDK or user-agent sniffing.
 * @module view/plugin/outdated_browser
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

// Keep this code ES5: it must also run in the browsers it warns about. Each invocation
// binds only its own notice, including after a page replacement; no global listeners.
/* eslint-disable no-var -- This function is serialized into an old-browser inline script. */
function checkBrowser(requiredFeatures) {
  var notice = document.getElementById('outdated');
  if (!notice) return;
  function supports(property, value) {
    if (window.CSS && typeof window.CSS.supports === 'function') {
      return property === 'selector'
        ? window.CSS.supports('selector(' + value + ')')
        : window.CSS.supports(property, value);
    }
    if (property === 'selector') {
      try {
        document.querySelector(value);
        return true;
      } catch (e) {
        return false;
      }
    }
    var style = document.createElement('div').style;
    style.setProperty(property, value);
    return style.getPropertyValue(property) !== '';
  }
  var compatible = true;
  for (var i = 0; i < requiredFeatures.length; i++) {
    if (!supports(requiredFeatures[i][0], requiredFeatures[i][1])) {
      compatible = false;
      break;
    }
  }
  notice.style.display = compatible ? 'none' : 'block';
  document.getElementById('btnCloseUpdateBrowser').onclick = function () {
    notice.style.display = 'none';
  };
}
/* eslint-enable no-var */

/** Non-blocking warning. Requirements are CSS property/value pairs, or ['selector', selector]. */
class OutdatedBrowser extends Component {
  render() {
    const { head, requiredFeatures = [['display', 'flex']] } = this.props;
    if (head) return null;
    const js =
      '(' +
      checkBrowser.toString() +
      ')(' +
      JSON.stringify(requiredFeatures).replace(/</g, '\\u003c') +
      ');';
    return (
      <>
        <div
          id="outdated"
          role="status"
          style="display:none;background:#fff3cd;color:#332701;padding:16px;margin:0;text-align:center;font:16px/1.5 sans-serif;">
          <strong style="color:#332701;">Your browser may not display this theme correctly.</strong>
          <p style="color:#332701;margin:8px 0;">
            Some essential layout or color features are unavailable. You can continue reading or{' '}
            <a
              id="btnUpdateBrowser"
              href="https://browsehappy.com/"
              style="color:#004085;text-decoration:underline;">
              update your browser
            </a>
            .
          </p>
          <button
            type="button"
            id="btnCloseUpdateBrowser"
            style="background:#fff;color:#332701;border:1px solid #332701;padding:4px 12px;cursor:pointer;">
            Dismiss
          </button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

OutdatedBrowser.Cacheable = cacheComponent(OutdatedBrowser, 'plugin.outdatedbrowser', (props) => {
  const { head, requiredFeatures } = props;
  return { head, requiredFeatures };
});

module.exports = OutdatedBrowser;
