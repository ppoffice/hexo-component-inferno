/**
 * Waline comment JSX component.
 * @module view/comment/waline
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Waline comment JSX component.
 *
 * @see https://waline.js.org/guide/get-started.html
 * @example
 * <Waline
 *     serverURL="https://path/to/waline/server"
 *     lang="zh-CN"
 *     visitor={false}
 *     emoji={['https://cdn.jsdelivr.net/gh/walinejs/emojis/weibo']}
 *     dark=""
 *     meta={['nick', 'mail', 'link']}
 *     requiredMeta={[]}
 *     login="enable"
 *     avatar="mp"
 *     wordLimit={0},
 *     pageSize={10}
 *     avatarCDN = "https://sdn.geekzu.org/avatar/"
 *     avatarForce={false}
 *     highlight={true}
 *     mathTagSupport={false}
 *     copyright={true}
 *     locale={{placeholder: '', ...}}
 *     jsUrl="/path/to/Waline.js" />
 */
class Waline extends Component {
  render() {
    const {
      serverURL,
      lang = 'zh-CN',
      visitor = false,
      emoji = ['https://cdn.jsdelivr.net/gh/walinejs/emojis/weibo'],
      dark = '',
      meta = ['nick', 'mail', 'link'],
      requiredMeta = [],
      login = 'enable',
      avatar = 'mp',
      wordLimit = 0,
      pageSize = 10,
      avatarCDN = 'https://sdn.geekzu.org/avatar/',
      avatarForce = false,
      highlight = true,
      mathTagSupport = false,
      copyright = true,
      locale,
      jsUrl,
    } = this.props;
    if (!serverURL) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>server_url</code> for Waline. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    const js = `Waline({
            el: '#waline-thread',
            serverURL: ${JSON.stringify(serverURL)},
            ${lang ? `lang: ${JSON.stringify(lang)},` : ''}
            ${`visitor: ${JSON.stringify(visitor)},`}
            ${emoji ? `emoji: ${JSON.stringify(emoji)},` : ''}
            ${dark ? `dark: ${JSON.stringify(dark)},` : ''}
            ${meta ? `meta: ${JSON.stringify(meta)},` : ''}
            ${Array.isArray(requiredMeta) ? `requiredMeta: ${JSON.stringify(requiredMeta)},` : ''}
            ${login ? `login: ${JSON.stringify(login)},` : ''}
            ${avatar ? `avatar: ${JSON.stringify(avatar)},` : ''}
            ${wordLimit ? `wordLimit: ${JSON.stringify(wordLimit)},` : ''}
            ${pageSize ? `pageSize: ${JSON.stringify(pageSize)},` : ''}
            ${avatarCDN ? `avatarCDN: ${JSON.stringify(avatarCDN)},` : ''}
            ${`avatarForce: ${JSON.stringify(avatarForce)},`}
            ${`highlight: ${JSON.stringify(highlight)},`}
            ${`mathTagSupport: ${JSON.stringify(mathTagSupport)},`}
            ${`copyright: ${JSON.stringify(copyright)},`}
            ${locale ? `locale: ${JSON.stringify(locale)},` : ''}
        });`;
    return (
      <>
        <div id="waline-thread" class="content"></div>
        <script src={jsUrl}></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Waline comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Waline.Cacheable
 *     comment={{
 *         server_url: "https://path/to/waline/server"
 *         lang: "zh-CN"
 *         visitor: false
 *         emoji: "https://cdn.jsdelivr.net/gh/walinejs/emojis/weibo"
 *         dark: ""
 *         meta: ['nick', 'mail', 'link']
 *         required_meta: []
 *         login: false
 *         avatar: "mp"
 *         word_limit: 0
 *         page_size: 10
 *         avatar_cdn: "https://sdn.geekzu.org/avatar/"
 *         avatar_force: false
 *         highlight: true
 *         math_tag_support: false
 *         copyright: true
 *         locale: {placeholder: '', ...}
 *     }}
 *     helper={{ cdn: function() {...} }} />
 */
Waline.Cacheable = cacheComponent(Waline, 'comment.waline', (props) => {
  const { comment, helper, page, config } = props;

  return {
    serverURL: comment.server_url,
    lang: comment.lang || page.lang || page.language || config.language || 'zh-CN',
    visitor: comment.visitor,
    emoji: comment.emoji,
    dark: comment.dark,
    meta: comment.meta,
    requiredMeta: comment.required_meta,
    login: comment.login,
    avatar: comment.avatar,
    wordLimit: comment.word_limit,
    pageSize: comment.page_size,
    avatarCDN: comment.avatar_cdn,
    avatarForce: comment.avatar_force,
    highlight: comment.highlight,
    mathTagSupport: comment.math_tag_support,
    copyright: comment.copyright,
    locale: comment.locale,
    jsUrl: helper.cdn('@waline/client', '1.5.4', 'dist/Waline.min.js'),
  };
});

module.exports = Waline;
