/**
 * LiveRe comment JSX component.
 * @module view/comment/livere
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const loadScripts = require('../../util/script');

/**
 * LiveRe comment JSX component.
 * <p>
 * Renders the current LiveRe widget when <code>clientId</code> is set, and the legacy LiveRe City
 * widget when only <code>uid</code> is set.
 *
 * @see https://admin.livere.org/
 * @example
 * <LiveRe clientId="******" />
 * <LiveRe uid="******" />
 */
class LiveRe extends Component {
  render() {
    const { clientId, uid } = this.props;
    if (clientId) {
      // <livere-comment> is a custom element, so the widget also starts on pages that PJAX inserts
      // after the script is loaded
      return (
        <>
          <livere-comment client-id={clientId}></livere-comment>
          <script
            dangerouslySetInnerHTML={{
              __html: loadScripts('https://www.livere.org/livere-widget.js', '', { type: 'module' }),
            }}></script>
        </>
      );
    }
    if (!uid) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>client_id</code> for LiveRe. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    const js = `(function(d, s) {
            var j, e = d.getElementsByTagName(s)[0];

            if (typeof LivereTower === 'function') { return; }

            j = d.createElement(s);
            j.src = 'https://cdn-city.livere.com/js/embed.dist.js';
            j.async = true;

            e.parentNode.insertBefore(j, e);
        })(document, 'script');`;
    return (
      <div id="lv-container" data-id="city" data-uid={uid}>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
        <noscript>Please activate JavaScript for write a comment in LiveRe</noscript>
      </div>
    );
  }
}

/**
 * Cacheable LiveRe comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <LiveRe.Cacheable comment={{ client_id: '******' }} />
 */
LiveRe.Cacheable = cacheComponent(LiveRe, 'comment.livere', (props) => {
  const { comment } = props;

  return {
    clientId: comment.client_id,
    uid: comment.uid,
  };
});

module.exports = LiveRe;
