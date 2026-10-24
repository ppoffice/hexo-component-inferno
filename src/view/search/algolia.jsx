/**
 * Algolia search engine JSX component.
 * @module view/search/algolia
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { toJs } = require('../../util/script');
const searchbox = require('../../util/searchbox');

/**
 * Algolia search engine JSX component.
 *
 * @see https://www.algolia.com/
 * @example
 * <Algolia
 *     translation={{
 *         hint: '******',
 *         no_result: '******',
 *         untitled: '******',
 *         empty_preview: '******'
 *     }}
 *     applicationId="******"
 *     apiKey="******"
 *     indexName="******"
 *     jsUrl="******"
 *     algoliaSearchUrl="******"
 *     instantSearchUrl="******" />
 */
class Algolia extends Component {
  render() {
    const {
      translation,
      applicationId,
      apiKey,
      indexName,
      excerpt,
      jsUrl,
      algoliaSearchUrl,
      instantSearchUrl,
    } = this.props;

    if (!applicationId || !apiKey || !indexName) {
      return (
        <div class="notification is-danger">
          It seems that you forget to set the <code>applicationId</code>, <code>apiKey</code>, or{' '}
          <code>indexName</code> for the Aloglia. Please set it in <code>_config.yml</code>.
        </div>
      );
    }

    const config = { applicationId, apiKey, indexName, excerpt };
    const js = `function initAlgolia() {
            loadAlgolia(${toJs(config)}, ${toJs(translation)});
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAlgolia, { once: true });
        } else {
            initAlgolia();
        }`;

    return (
      <>
        <div class="searchbox">
          <div
            class="searchbox-mask"
            style="position:absolute;bottom:0px;left:0px;right:0px;top:0px;"></div>
          <div class="searchbox-container">
            <div class="searchbox-header">
              <div class="searchbox-input-container" id="algolia-input"></div>
              <div
                id="algolia-poweredby"
                style="display:flex;margin:0 .5em 0 1em;align-items:center;line-height:0"></div>
              <a class="searchbox-close" href="javascript:;">
                &times;
              </a>
            </div>
            <div class="searchbox-body"></div>
            <div class="searchbox-footer"></div>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: searchbox }}></script>
        <script src={algoliaSearchUrl} crossorigin="anonymous" defer={true}></script>
        <script src={instantSearchUrl} crossorigin="anonymous" defer={true}></script>
        <script src={jsUrl} defer={true}></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Algolia search engine JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Algolia.Cacheable
 *     config={{
 *         algolia: {
 *             applicationID: '******',
 *             apiKey: '******',
 *             indexName: '******'
 *         }
 *     }}
 *     helper={{
 *         __: function() {...},
 *         cdn: function() {...},
 *         url_for: function() {...}
 *     }} />
 */
Algolia.Cacheable = cacheComponent(Algolia, 'search.algolia', (props) => {
  const { config, helper, search } = props;
  const { algolia } = config;

  return {
    translation: {
      hint: helper.__('search.hint'),
      no_result: helper.__('search.no_result'),
      untitled: helper.__('search.untitled'),
      empty_preview: helper.__('search.empty_preview'),
    },
    applicationId: algolia ? algolia.applicationID : null,
    apiKey: algolia ? algolia.apiKey : null,
    indexName: algolia ? algolia.indexName : null,
    excerpt: search.excerpt ? search.excerpt : 'excerpt',
    algoliaSearchUrl: helper.cdn('algoliasearch', '5.60.0', 'dist/lite/builds/browser.umd.js'),
    instantSearchUrl: helper.cdn(
      'instantsearch.js',
      '4.120.0',
      'dist/instantsearch.production.min.js',
    ),
    jsUrl: helper.url_for('/js/algolia.js'),
  };
});

module.exports = Algolia;
