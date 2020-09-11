/**
 * Isso comment JSX component.
 * @module view/comment/isso
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Isso comment JSX component.
 *
 * @see https://posativ.org/isso/docs/quickstart/#integration
 * @example
 * <Isso url="/path/to/isso/server" />
 */
class Isso extends Component {
  render() {
    const { url } = this.props;
    if (!url) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>url</code> for Isso. Please set it in <code>_config.yml</code>
          .
        </div>
      );
    }
    return (
      <>
        <div id="isso-thread"></div>
        <script data-isso={'//' + url} src={`//${url}/js/embed.min.js`}></script>
      </>
    );
  }
}

/**
 * Cacheable Isso comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Isso.Cacheable comment={{ url: "/path/to/isso/server" }} />
 */
Isso.Cacheable = cacheComponent(Isso, 'comment.isso', (props) => {
  const { comment } = props;

  return {
    url: comment.url,
  };
});

module.exports = Isso;
