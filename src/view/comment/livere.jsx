/**
 * LiveRe comment JSX component.
 * @module view/comment/livere
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * LiveRe comment JSX component.
 *
 * @see https://livere.com/insight/myCode
 * @example
 * <LiveRe uid="******" />
 */
class LiveRe extends Component {
  render() {
    const { uid } = this.props;
    if (!uid) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>uid</code> for LiveRe. Please set it in{' '}
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
 * <LiveRe.Cacheable comment={{ uid: '******' }} />
 */
LiveRe.Cacheable = cacheComponent(LiveRe, 'comment.livere', (props) => {
  const { comment } = props;

  return {
    uid: comment.uid,
  };
});

module.exports = LiveRe;
