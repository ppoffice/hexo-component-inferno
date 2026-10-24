/**
 * DisqusJS comment JSX component.
 * @module view/comment/disqusjs
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');
const { toJs } = loadScripts;

/**
 * DisqusJS comment JSX component.
 *
 * @see https://github.com/SukkaW/DisqusJS
 * @example
 * <DisqusJs
 *     shortname="******"
 *     apiKey="******"
 *     api="******"
 *     admin="******"
 *     adminLabel={false}
 *     nesting={4}
 *     disqusId="******"
 *     path="/path/to/page"
 *     permalink="/page/permanent/path"
 *     pageTitle="******"
 *     siteTitle="******"
 *     jsUrl="/path/to/disqusjs.es2015.umd.min.js"
 *     cssUrl="/path/to/disqusjs.css" />
 */
class DisqusJs extends Component {
  render() {
    const {
      shortname,
      apiKey,
      api,
      admin,
      adminLabel,
      nesting,
      disqusId,
      path,
      permalink,
      pageTitle,
      siteTitle,
      jsUrl,
      cssUrl,
    } = this.props;
    if (!shortname || !apiKey) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>shortname</code> or <code>api_key</code> for Disqus. Please
          set it in <code>_config.yml</code>.
        </div>
      );
    }
    const url = permalink || path;
    const identifier = disqusId || path;
    const js = `if (!container.isConnected) return;
        instance = new DisqusJS({
            shortname: ${toJs(shortname)},
            apikey: ${toJs(apiKey)},
            ${siteTitle ? `siteName: ${toJs(siteTitle)},` : ''}
            ${identifier ? `identifier: ${toJs(identifier)},` : ''}
            ${url ? `url: ${toJs(url)},` : ''}
            ${pageTitle ? `title: ${toJs(pageTitle)},` : ''}
            ${api ? `api: ${toJs(api)},` : ''}
            ${admin ? `admin: ${toJs(admin)},` : ''}
            ${adminLabel ? `adminLabel: ${toJs(adminLabel)},` : ''}
            ${nesting ? `nesting: ${toJs(nesting)},` : ''}
        });
        instance.render(container);`;
    const script = `(function () {
        var container = document.getElementById('disqusjs');
        var instance;
        function destroy() {
            document.removeEventListener('hexo:page:before-replace', destroy);
            if (instance) instance.destroy();
        }
        document.addEventListener('hexo:page:before-replace', destroy);
        ${loadScripts(jsUrl, js)}
    })();`;
    return (
      <>
        <link rel="stylesheet" href={cssUrl} media="print" onload="this.media='all'" />
        <div id="disqusjs">
          <noscript>
            Please enable JavaScript to view the{' '}
            <a href="//disqus.com/?ref_noscript">comments powered by Disqus.</a>
          </noscript>
        </div>
        <script dangerouslySetInnerHTML={{ __html: script }}></script>
      </>
    );
  }
}

/**
 * Cacheable DisqusJS comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <DisqusJs.Cacheable
 *     comment={{
 *         shortname: '******',
 *         api_key: '******',
 *         api: '******',
 *         admin: '******',
 *         admin_label: false,
 *         nesting: 4
 *     }}
 *     page={{
 *         path: '/path/to/page',
 *         disqusId: '******',
 *         permalink: '******'
 *         title: '******'
 *     }}
 *     config={{ title: '******' }}
 *     helper={{ cdn: function() { ... } }} />
 */
DisqusJs.Cacheable = cacheComponent(DisqusJs, 'comment.disqusjs', (props) => {
  const { config, page, helper, comment } = props;

  return {
    path: page.path,
    shortname: comment.shortname,
    apiKey: comment.api_key,
    api: comment.api,
    admin: comment.admin,
    adminLabel: comment.admin_label,
    nesting: comment.nesting,
    disqusId: page.disqusId,
    permalink: page.permalink,
    pageTitle: page.title,
    siteTitle: config.title,
    jsUrl: helper.cdn('disqusjs', '3.2.2', 'dist/browser/disqusjs.es2015.umd.min.js'),
    cssUrl: helper.cdn('disqusjs', '3.2.2', 'dist/browser/styles/disqusjs.css'),
  };
});

module.exports = DisqusJs;
