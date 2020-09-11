/**
 * Baidu search engine JSX component.
 * @module view/search/baidu
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Baidu search engine JSX component.
 *
 * @example
 * <Baidu url="/site/url" hint="Placeholder text" />
 */
class Baidu extends Component {
  render() {
    const { url, hint } = this.props;

    const siteUrl = url.replace(/http(s)*:\/\//, '');
    const js = `(function ($) {
            $('.searchbox-input-container').on('submit', function (e) {
                var keyword = $('.searchbox-input[name="wd"]').val();
                window.location = 'https://www.baidu.com/s?wd=site:${siteUrl} ' + keyword;
                return false;
            });
        })(jQuery);
        (function (document, $) {
            $(document).on('click', '.navbar-main .search', function () {
                $('.searchbox').toggleClass('show');
            }).on('click', '.searchbox .searchbox-mask', function () {
                $('.searchbox').removeClass('show');
            }).on('click', '.searchbox-close', function () {
                $('.searchbox').removeClass('show');
            });
        })(document, jQuery);`;

    return (
      <>
        <div class="searchbox">
          <div class="searchbox-container">
            <div class="searchbox-header">
              <form class="searchbox-input-container">
                <input name="wd" type="text" class="searchbox-input" placeholder={hint} />
              </form>
              <a class="searchbox-close" href="javascript:;">
                &times;
              </a>
            </div>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Baidu search engine JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Baidu.Cacheable
 *     config={{ url: '/site/url' }}
 *     helper={{ __: function() {...} }} />
 */
Baidu.Cacheable = cacheComponent(Baidu, 'search.baidu', (props) => {
  const { config, helper } = props;

  return {
    url: config.url,
    hint: helper.__('search.hint'),
  };
});

module.exports = Baidu;
