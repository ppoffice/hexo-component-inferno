/**
 * Twikoo comment JSX component.
 * @module view/comment/twikoo
 */
const { Component, Fragment } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');
const { toJs } = loadScripts;

/**
 * Twikoo comment JSX component.
 *
 * @see https://twikoo.js.org/quick-start.html
 * @example
 * <Twikoo
 *     envId="env_id"
 *     region="ap-guangzhou"
 *     lang="zh-CN"
 *     jsUrl="/path/to/Twikoo.js" />
 */
class Twikoo extends Component {
  render() {
    const { envId, region, lang, jsUrl } = this.props;
    if (!envId) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>env_id</code> for Twikoo. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    // init() unmounts the previous widget. Bind it to this page's element, not a selector that
    // could resolve to a different page after an asynchronous SDK or locale load.
    const js = `if (!container.isConnected) return;
        twikoo.init({
            el: container,
            envId: ${toJs(envId)},
            ${region ? `region: ${toJs(region)},` : ''}
            ${lang ? `lang: ${toJs(lang)},` : ''}
        });`;
    return (
      <Fragment>
        <div id="twikoo" class="content twikoo"></div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
          var container = document.getElementById('twikoo');
          ${loadScripts(jsUrl, js)}
        })();`,
          }}></script>
      </Fragment>
    );
  }
}

/**
 * Cacheable Twikoo comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Twikoo.Cacheable
 *     comment={{
 *         env_id: "env_id",
 *         region: "ap-guangzhou",
 *         lang: "zh-CN",
 *     }} />
 */
Twikoo.Cacheable = cacheComponent(Twikoo, 'comment.twikoo', (props) => {
  const { comment, helper, page, config } = props;

  return {
    envId: comment.env_id,
    region: comment.region,
    lang: comment.lang || page.lang || page.language || config.language || 'zh-CN',
    jsUrl: helper.cdn('twikoo', '2.0.17', 'dist/twikoo.all.min.js'),
  };
});

module.exports = Twikoo;
