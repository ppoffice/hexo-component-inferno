/**
 * AddToAny share buttons JSX component.
 * @module view/share/addtoany
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');

/**
 * AddToAny share buttons JSX component.
 *
 * @see https://www.addtoany.com/buttons/
 * @example
 * <AddToAny />
 */
class AddToAny extends Component {
  render() {
    const { url, title } = this.props;
    const initialize = `if (!kit || !kit.isConnected) return;
      if (window.a2a && typeof window.a2a.init_all === 'function') window.a2a.init_all();`;
    const js = `(function () {
      var kit = document.getElementById('addtoany-share');
      ${loadScripts('https://static.addtoany.com/menu/page.js', initialize)}
    })();`;
    return (
      <>
        <div
          id="addtoany-share"
          class="a2a_kit a2a_kit_size_32 a2a_default_style"
          style="display:flex;justify-content:center;flex-wrap:wrap"
          data-a2a-url={url}
          data-a2a-title={title}
          data-share-provider="addtoany">
          <a class="a2a_dd" href="https://www.addtoany.com/share"></a>
          <a class="a2a_button_facebook"></a>
          <a class="a2a_button_twitter"></a>
          <a class="a2a_button_telegram"></a>
          <a class="a2a_button_whatsapp"></a>
          <a class="a2a_button_reddit"></a>
        </div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable AddToAny share buttons JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <AddToAny.Cacheable />
 */
AddToAny.Cacheable = cacheComponent(AddToAny, 'share.addtoany', ({ page = {} }) => {
  return { url: page.permalink, title: page.title };
});

module.exports = AddToAny;
