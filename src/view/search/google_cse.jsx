/**
 * Google custom search engine JSX component.
 * @module view/search/google_cse
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Google custom search engine JSX component.
 *
 * @see https://cse.google.com/cse/create/new
 * @example
 * <GoogleCSE
 *     cx="******"
 *     hint="Placeholder text"
 *     jsUrl="******" />
 */
class GoogleCSE extends Component {
  render() {
    const { cx, hint, jsUrl } = this.props;

    const css = '.searchbox .searchbox-body { background: white; }';

    const js1 = `(function() {
            var cx = '${cx}';
            var gcse = document.createElement('script');
            gcse.type = 'text/javascript';
            gcse.async = true;
            gcse.src = 'https://cse.google.com/cse.js?cx=' + cx;
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(gcse, s);
        })();`;

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }}></style>
        <div class="searchbox">
          <div class="searchbox-container">
            <div class="searchbox-header">
              <div class="searchbox-input-container">
                <input type="text" class="searchbox-input" placeholder={hint} />
              </div>
              <a class="searchbox-close" href="javascript:;">
                &times;
              </a>
            </div>
            {(() => {
              if (cx) {
                const innerHtml = '<gcse:searchresults-only></gcse:searchresults-only>';
                return (
                  <div class="searchbox-body" dangerouslySetInnerHTML={{ __html: innerHtml }}></div>
                );
              }
              return (
                <div class="notification is-danger">
                  It seems that you forget to set the <code>cx</code> value for the Google CSE.
                  Please set it in <code>_config.yml</code>.
                </div>
              );
            })()}
          </div>
          {cx ? <script dangerouslySetInnerHTML={{ __html: js1 }}></script> : null}
        </div>
        <script src={jsUrl}></script>
      </>
    );
  }
}

/**
 * Cacheable Google custom search engine JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <GoogleCSE.Cacheable
 *     search={{ cx: '******' }}
 *     helper={{
 *         __: function() {...},
 *         url_for: function() {...}
 *     }} />
 */
GoogleCSE.Cacheable = cacheComponent(GoogleCSE, 'search.google', (props) => {
  const { helper, search } = props;

  return {
    cx: search.cx,
    hint: helper.__('search.hint'),
    jsUrl: helper.url_for('/js/google_cse.js'),
  };
});

module.exports = GoogleCSE;
