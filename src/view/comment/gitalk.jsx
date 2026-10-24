/**
 * Gitalk comment JSX component.
 * @module view/comment/gitalk
 */
const crypto = require('crypto');
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');
const { toJs } = loadScripts;
const { isDark } = require('../../util/appearance');

/**
 * Gitalk comment JSX component.
 *
 * @see https://github.com/gitalk/gitalk
 * @example
 * <Gitalk
 *     id="******",
 *     repo="******",
 *     owner="******",
 *     admin={["******"]},
 *     clientId="******",
 *     backend="issues",
 *     createIssueManually={false},
 *     distractionFreeMode={false},
 *     pagerDirection="last",
 *     perPage={10},
 *     proxy="******",
 *     enableHotKey={true},
 *     language="zh-CN",
 *     jsUrl="/path/to/gitalk.js",
 *     cssUrl="/path/to/gitalk.css" />
 */
class Gitalk extends Component {
  render() {
    const {
      id,
      repo,
      owner,
      admin,
      clientId,
      backend = 'issues',
      number,
      category,
      createIssueManually = true,
      distractionFreeMode = false,
      pagerDirection = 'last',
      perPage = 10,
      proxy,
      enableHotKey = true,
      language,
      jsUrl,
      cssUrl,
    } = this.props;

    if (!id || !repo || !owner || !admin || !clientId || !proxy) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>owner</code>, <code>admin</code>, <code>repo</code>,
          <code>client_id</code>, or <code>proxy</code> for Gitalk. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    const js = `if (!container || !container.isConnected || document.getElementById('comment-container') !== container) return;
        if (window.__gitalkInstance) window.__gitalkInstance.destroy();
        var gitalk = new Gitalk({
            id: ${toJs(id)},
            repo: ${toJs(repo)},
            owner: ${toJs(owner)},
            clientID: ${toJs(clientId)},
            backend: ${toJs(backend)},
            ${number ? `number: ${toJs(number)},` : ''}
            ${category ? `category: ${toJs(category)},` : ''}
            admin: ${toJs(admin)},
            createIssueManually: ${!!createIssueManually},
            distractionFreeMode: ${!!distractionFreeMode},
            perPage: ${toJs(perPage)},
            sortDirection: ${toJs(pagerDirection)},
            ${proxy ? `proxy: ${toJs(proxy)},` : ''}
            mode: 'inline',
            maxHeight: null,
            stickyComposer: false,
            enableHotKey: ${!!enableHotKey},
            ${language ? `language: ${toJs(language)},` : ''}
        })
        gitalk.render('comment-container');
        window.__gitalkInstance = gitalk;
        var media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
        function appearance() { container.setAttribute('data-theme', ${isDark()} ? 'dark' : 'light'); }
        appearance();
        var observer = new MutationObserver(appearance);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-appearance'] });
        if (media && media.addEventListener) media.addEventListener('change', appearance);
        var destroy = gitalk.destroy;
        gitalk.destroy = function () {
            document.removeEventListener('hexo:page:before-replace', gitalk.destroy);
            observer.disconnect();
            if (media && media.removeEventListener) media.removeEventListener('change', appearance);
            destroy.call(gitalk);
            if (window.__gitalkInstance === gitalk) window.__gitalkInstance = null;
        };
        document.addEventListener('hexo:page:before-replace', gitalk.destroy);`;
    return (
      <>
        <div id="comment-container"></div>
        <link rel="stylesheet" href={cssUrl} media="print" onload="this.media='all'" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
          var container = document.getElementById('comment-container');
          ${loadScripts(jsUrl, js)}
        })();`,
          }}></script>
      </>
    );
  }
}

/**
 * Cacheable Gitalk comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Gitalk.Cacheable
 *     comment={{
 *         repo: '******',
 *         owner: '******',
 *         admin: ['******'],
 *         client_id: '******',
 *         backend: 'issues',
 *         create_issue_manually: false,
 *         distraction_free_mode: false,
 *         pager_direction: 'last',
 *         per_page: 10,
 *         proxy: '******',
 *         enable_hotkey: true,
 *         language: 'zh-CN'
 *     }}
 *     page={{ path: '/path/to/page' }}
 *     helper={{ cdn: function() {...} }} />
 */
Gitalk.Cacheable = cacheComponent(Gitalk, 'comment.gitalk', (props) => {
  const { helper, comment } = props;

  // FIXME: config name change
  const id = crypto.createHash('md5').update(props.page.path).digest('hex');
  return {
    id,
    repo: comment.repo,
    owner: comment.owner,
    admin: comment.admin,
    clientId: comment.client_id,
    backend: comment.backend || 'issues',
    number: comment.number,
    category: comment.category,
    createIssueManually: comment.create_issue_manually,
    distractionFreeMode: comment.distraction_free_mode,
    pagerDirection: comment.pager_direction,
    perPage: comment.per_page,
    proxy: comment.proxy,
    enableHotKey: comment.enable_hotkey,
    language: comment.language,
    cssUrl: helper.cdn('@aifire/gitalk', '2.0.0-beta.2', 'dist/gitalk.css'),
    jsUrl: helper.cdn('@aifire/gitalk', '2.0.0-beta.2', 'dist/gitalk.js'),
  };
});

module.exports = Gitalk;
