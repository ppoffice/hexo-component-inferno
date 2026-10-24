/**
 * Share.js share buttons JSX component.
 * @module view/share/sharejs
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { deprecate } = require('../../util/deprecate');
const AddToAny = require('./addtoany');

/**
 * Share.js share buttons JSX component.
 *
 * @example
 * <ShareJs />
 */
class ShareJs extends Component {
  render() {
    deprecate(
      'share.sharejs',
      'Uses Web Share + AddToAny; custom asset URLs are ignored.',
    );
    const js = `(function () {
      document.querySelectorAll('.hexo-component-share').forEach(function (container) {
        var button = container.querySelector('button');
        var status = container.querySelector('[role="status"]');
        button.hidden = typeof navigator.share !== 'function';
        button.onclick = async function () {
          status.hidden = true;
          try {
            await navigator.share({ title: document.title, url: window.location.href });
          } catch (error) {
            if (error && error.name === 'AbortError') return;
            status.hidden = false;
            container.querySelector('.a2a_dd').focus();
          }
        };
      });
    })();`;
    return (
      <>
        <div class="hexo-component-share">
          <button type="button" class="button mb-2" hidden={true}>
            Share
          </button>
          <p role="status" hidden={true}>
            Please use the share buttons below.
          </p>
          <AddToAny />
        </div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Share.js share buttons JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <ShareJs.Cacheable />
 */
ShareJs.Cacheable = cacheComponent(ShareJs, 'share.sharejs', () => ({}));

module.exports = ShareJs;
