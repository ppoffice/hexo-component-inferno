/**
 * Gitalk comment JSX component.
 * @module view/comment/gitalk
 */
const crypto = require('crypto');
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

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
 *     clientSecret="******",
 *     createIssueManually={false},
 *     distractionFreeMode={false},
 *     pagerDirection="last",
 *     perPage={10},
 *     proxy="******",
 *     flipMoveOptions={...},
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
      clientSecret,
      createIssueManually = false,
      distractionFreeMode = false,
      pagerDirection = 'last',
      perPage = 10,
      proxy,
      flipMoveOptions,
      enableHotKey,
      language,
      jsUrl,
      cssUrl,
    } = this.props;

    if (!id || !repo || !owner || !admin || !clientId || !clientSecret) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>owner</code>, <code>admin</code>, <code>repo</code>,
          <code>client_id</code>, or <code>client_secret</code> for Gitalk. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    const js = `var gitalk = new Gitalk({
            id: ${JSON.stringify(id)},
            repo: ${JSON.stringify(repo)},
            owner: ${JSON.stringify(owner)},
            clientID: ${JSON.stringify(clientId)},
            clientSecret: ${JSON.stringify(clientSecret)},
            admin: ${JSON.stringify(admin)},
            createIssueManually: ${!!createIssueManually},
            distractionFreeMode: ${!!distractionFreeMode},
            perPage: ${JSON.stringify(perPage)},
            pagerDirection: ${JSON.stringify(pagerDirection)},
            ${proxy ? `proxy: ${JSON.stringify(proxy)},` : ''}
            ${flipMoveOptions ? `flipMoveOptions: ${JSON.stringify(flipMoveOptions)},` : ''}
            enableHotKey: ${enableHotKey ? !!enableHotKey : true},
            ${language ? `language: ${JSON.stringify(language)},` : ''}
        })
        gitalk.render('comment-container')`;
    return (
      <>
        <div id="comment-container"></div>
        <link rel="stylesheet" href={cssUrl} />
        <script src={jsUrl}></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
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
 *         client_secret: '******',
 *         create_issue_manually: false,
 *         distraction_free_mode: false,
 *         pager_direction: 'last',
 *         per_page: 10,
 *         proxy: '******',
 *         flip_move_options: {...},
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
    clientSecret: comment.client_secret,
    createIssueManually: comment.create_issue_manually,
    distractionFreeMode: comment.distraction_free_mode,
    pagerDirection: comment.pager_direction,
    perPage: comment.per_page,
    proxy: comment.proxy,
    flipMoveOptions: comment.flip_move_options,
    enableHotKey: comment.enable_hotkey,
    language: comment.language,
    cssUrl: helper.cdn('gitalk', '1.7.2', 'dist/gitalk.css'),
    jsUrl: helper.cdn('gitalk', '1.7.2', 'dist/gitalk.min.js'),
  };
});

module.exports = Gitalk;
