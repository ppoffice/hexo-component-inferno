/**
 * Valine comment JSX component.
 * @module view/comment/valine
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');
const { toJs } = loadScripts;
const { deprecate } = require('../../util/deprecate');

/**
 * Valine comment JSX component.
 *
 * @deprecated LeanCloud, where Valine stores the comments, shuts down on January 12, 2027. Use Waline,
 *     Twikoo or another comment system instead.
 * @see https://valine.js.org/quickstart.html
 * @example
 * <Valine
 *     appId="******"
 *     appKey="******"
 *     placeholder="******"
 *     avatar="mm"
 *     avatarForce={false}
 *     meta={['nick', 'mail', 'link']}
 *     pageSize={10}
 *     lang="zh-CN"
 *     visitor={false}
 *     highlight={true}
 *     recordIP={false}
 *     serverURLs="http[s]://[tab/us].avoscloud.com"
 *     emojiCDN=""
 *     emojiMaps={null}
 *     enableQQ={false}
 *     requiredFields={[]}
 *     jsUrl="/path/to/Valine.js" />
 */
class Valine extends Component {
  render() {
    deprecate(
      'comment.valine',
      'LeanCloud, where Valine stores the comments, shuts down on January 12, 2027. Use Waline, Twikoo or another comment system instead.',
    );
    const {
      appId,
      appKey,
      placeholder,
      avatar = 'mm',
      avatarForce = false,
      meta = ['nick', 'mail', 'link'],
      pageSize = 10,
      lang = 'zh-CN',
      visitor = false,
      highlight = true,
      recordIP = false,
      serverURLs = '',
      emojiCDN = '',
      emojiMaps = null,
      enableQQ = false,
      requiredFields: fields = [],
      jsUrl,
    } = this.props;
    if (!appId || !appKey) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>app_id</code> or <code>app_key</code> for Valine. Please set
          it in <code>_config.yml</code>.
        </div>
      );
    }
    const js = `new Valine({
            el: '#valine-thread',
            appId: ${toJs(appId)},
            appKey: ${toJs(appKey)},
            ${placeholder ? `placeholder: ${toJs(placeholder)},` : ''}
            ${avatar ? `avatar: ${toJs(avatar)},` : ''}
            ${`avatarForce: ${toJs(avatarForce)},`}
            ${meta ? `meta: ${toJs(meta)},` : ''}
            ${pageSize ? `pageSize: ${toJs(pageSize)},` : ''}
            ${lang ? `lang: ${toJs(lang)},` : ''}
            ${`visitor: ${toJs(visitor)},`}
            ${`highlight: ${toJs(highlight)},`}
            ${`recordIP: ${toJs(recordIP)},`}
            ${serverURLs ? `serverURLs: ${toJs(serverURLs)},` : ''}
            ${emojiCDN ? `emojiCDN: ${toJs(emojiCDN)},` : ''}
            ${emojiMaps ? `emojiMaps: ${toJs(emojiMaps)},` : ''}
            ${`enableQQ: ${toJs(enableQQ)},`}
            ${Array.isArray(fields) ? `requiredFields: ${toJs(fields)},` : ''}
        });`;
    return (
      <>
        <div id="valine-thread" class="content"></div>
        <script
          dangerouslySetInnerHTML={{
            __html: loadScripts(
              ['//cdn.jsdelivr.net/npm/leancloud-storage@3/dist/av-min.js', jsUrl],
              js,
            ),
          }}></script>
      </>
    );
  }
}

/**
 * Cacheable Valine comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Valine.Cacheable
 *     comment={{
 *         app_id: "******"
 *         app_key: "******"
 *         placeholder: "******"
 *         avatar: "mm"
 *         avatar_force: false
 *         meta: ["nick", "mail", "link"]
 *         page_size: 10
 *         lang: "zh-CN"
 *         visitor: false
 *         highlight: true
 *         record_ip: false
 *         server_urls: "http[s]://[tab/us].avoscloud.com"
 *         emoji_cdn: ""
 *         emoji_maps: null
 *         enable_qq: false
 *         required_fields: []
 *     }}
 *     helper={{ cdn: function() {...} }} />
 */
Valine.Cacheable = cacheComponent(Valine, 'comment.valine', (props) => {
  const { comment, helper, page, config } = props;

  return {
    appId: comment.app_id,
    appKey: comment.app_key,
    placeholder: comment.placeholder,
    avatar: comment.avatar,
    avatarForce: comment.avatar_force,
    meta: comment.meta,
    pageSize: comment.page_size,
    lang: comment.lang || page.lang || page.language || config.language || 'zh-CN',
    visitor: comment.visitor,
    highlight: comment.highlight,
    recordIP: comment.record_ip,
    serverURLs: comment.server_urls,
    emojiCDN: comment.emoji_cdn,
    emojiMaps: comment.emoji_maps,
    enableQQ: comment.enable_qq,
    requiredFields: comment.required_fields,
    jsUrl: helper.cdn('valine', '1.4.16', 'dist/Valine.min.js'),
  };
});

module.exports = Valine;
