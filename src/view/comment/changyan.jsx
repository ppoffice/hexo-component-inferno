/**
 * ChangYan comment JSX component.
 * @module view/comment/changyan
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * ChangYan comment JSX component.
 *
 * @see http://changyan.kuaizhan.com/static/help/
 * @example
 * <ChangYan
 *     appId="******"
 *     conf="******"
 *     path="/path/to/page" />
 */
class ChangYan extends Component {
  render() {
    const { appId, conf, path } = this.props;
    if (!appId || !conf) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>app_id</code> or <code>conf</code> for Changyan. Please set it
          in <code>_config.yml</code>.
        </div>
      );
    }
    const js = `window.changyan.api.config({appid: '${appId}',conf: '${conf}'});`;
    /* eslint-disable react/no-unknown-property */
    return (
      <>
        <div id="SOHUCS" sid={path}></div>
        <script charset="utf-8" src="https://changyan.sohu.com/upload/changyan.js"></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
    /* eslint-enable react/no-unknown-property */
  }
}

/**
 * Cacheable ChangYan comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <ChangYan.Cacheable
 *     comment={{ app_id: '*******', conf='******' }}
 *     page={{ path: '/path/to/page' }} />
 */
ChangYan.Cacheable = cacheComponent(ChangYan, 'comment.changyan', (props) => {
  const { comment, page } = props;

  return {
    appId: comment.app_id,
    conf: comment.conf,
    path: page.path,
  };
});

module.exports = ChangYan;
