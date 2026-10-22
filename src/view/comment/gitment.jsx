/**
 * Gitment comment JSX component.
 * @module view/comment/gitment
 * @deprecated
 */
const crypto = require('crypto');
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');
const { toJs } = loadScripts;
const { deprecate } = require('../../util/deprecate');

/**
 * Gitment comment JSX component.
 *
 * @deprecated Gitment is no longer maintained, and the GitHub sign-in proxy it uses no longer works. Use
 *     Giscus, Utterances or Gitalk instead.
 * @see https://github.com/imsun/gitment
 * @example
 * <Gitment
 *     id="******",
 *     repo="******",
 *     owner="******",
 *     clientId="******",
 *     clientSecret="******",
 *     perPage={10},
 *     maxCommentHeight={250} />
 */
class Gitment extends Component {
  render() {
    deprecate(
      'comment.gitment',
      'Gitment is no longer maintained, and the GitHub sign-in proxy it uses no longer works. Use Giscus, Utterances or Gitalk instead.',
    );
    const {
      id,
      repo,
      owner,
      clientId,
      clientSecret,
      perPage = 20,
      maxCommentHeight = 250,
    } = this.props;

    if (!id || !repo || !owner || !clientId || !clientSecret) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>owner</code>, <code>repo</code>, <code>clientId</code>, or{' '}
          <code>clientSecret</code> for Gitment. Please set it in <code>_config.yml</code>.
        </div>
      );
    }
    const js = `var gitment = new Gitment({
            id: ${toJs(id)},
            repo: ${toJs(repo)},
            owner: ${toJs(owner)},
            oauth: {
                client_id: ${toJs(clientId)},
                client_secret: ${toJs(clientSecret)},
            },
            perPage: ${toJs(perPage)},
            maxCommentHeight: ${toJs(maxCommentHeight)}
        })
        gitment.render('comment-container')`;
    return (
      <>
        <div id="comment-container"></div>
        <link
          rel="stylesheet"
          href="https://imsun.github.io/gitment/style/default.css"
          media="print"
          onload="this.media='all'"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: loadScripts('https://imsun.github.io/gitment/dist/gitment.browser.js', js),
          }}></script>
      </>
    );
  }
}

/**
 * Cacheable Gitment comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @deprecated
 * @see module:util/cache.cacheComponent
 * @example
 * <Gitment.Cacheable
 *     comment={{
 *         repo: '******',
 *         owner: '******',
 *         client_id: '******',
 *         client_secret: '******',
 *         per_page: 10,
 *         max_comment_height: 250
 *     }}
 *     page={{ path: '/path/to/page' }} />
 */
Gitment.Cacheable = cacheComponent(Gitment, 'comment.gitment', (props) => {
  const { comment } = props;

  const id = crypto.createHash('md5').update(props.page.path).digest('hex');
  return {
    id,
    repo: comment.repo,
    owner: comment.owner,
    clientId: comment.client_id,
    clientSecret: comment.client_secret,
    perPage: comment.per_page,
    maxCommentHeight: comment.max_comment_height,
  };
});

module.exports = Gitment;
